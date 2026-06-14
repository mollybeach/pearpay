// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 surface used for USDC/EURC transfers.
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title PearPayEscrow
 * @notice Programmable claimable-payment escrow for Pear Pay, deployed on Arc.
 *
 * Implements the README's Smart Escrow System with advanced stablecoin logic:
 * conditional release on claim, time-based auto-refund, sender cancellation,
 * multi-step settlement (escrow on send, release on claim), and an optional
 * on-chain dispute path: a per-payment arbiter can freeze and adjudicate a
 * contested payment, releasing to the recipient or refunding the sender. Works
 * with any ERC-20 stablecoin (USDC or EURC).
 */
contract PearPayEscrow {
    enum Status {
        None,
        Escrowed,
        Claimed,
        Refunded,
        Cancelled,
        // Appended (value 5) so existing on-chain status codes are unchanged.
        Disputed
    }

    struct Payment {
        address sender;
        address token;
        uint256 amount;
        uint64 expiresAt;
        bytes32 claimHash; // keccak256(claimSecret) — recipient proves knowledge.
        Status status;
        // Optional dispute resolver. address(0) => dispute path disabled and the
        // payment behaves exactly like the original escrow() flow.
        address arbiter;
    }

    /// @dev paymentId => Payment.
    mapping(bytes32 => Payment) public payments;

    event PaymentEscrowed(
        bytes32 indexed paymentId,
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint64 expiresAt
    );
    event PaymentClaimed(bytes32 indexed paymentId, address indexed recipient, uint256 amount);
    event PaymentRefunded(bytes32 indexed paymentId, address indexed sender, uint256 amount);
    event PaymentCancelled(bytes32 indexed paymentId, address indexed sender, uint256 amount);
    event DisputeRaised(bytes32 indexed paymentId, address indexed by, address indexed arbiter);
    event DisputeResolved(
        bytes32 indexed paymentId,
        address indexed arbiter,
        bool releasedToRecipient,
        address beneficiary,
        uint256 amount
    );

    error AlreadyExists();
    error NotEscrowed();
    error NotExpired();
    error Expired();
    error NotSender();
    error InvalidSecret();
    error TransferFailed();
    error NoArbiter();
    error NotArbiter();
    error NotDisputed();
    error NotDisputable();
    error ZeroRecipient();

    /**
     * @notice Escrow a claimable payment. Funds move from sender into the
     *         contract and stay locked until claimed, refunded, or cancelled.
     * @param paymentId Unique id (mirrors the backend payment id).
     * @param token     Stablecoin address (USDC or EURC).
     * @param amount    Amount in token base units.
     * @param expiresAt Unix timestamp after which auto-refund is allowed.
     * @param claimHash keccak256 of the secret the recipient must present.
     */
    function escrow(
        bytes32 paymentId,
        address token,
        uint256 amount,
        uint64 expiresAt,
        bytes32 claimHash
    ) external {
        _escrow(paymentId, token, amount, expiresAt, claimHash, address(0));
    }

    /**
     * @notice Escrow a claimable payment with an on-chain dispute resolver.
     *         Identical to {escrow} but sets a per-payment `arbiter` that can
     *         adjudicate a disputed payment via {resolveDispute}.
     * @param arbiter Address allowed to resolve a dispute (release or refund).
     */
    function escrowWithArbiter(
        bytes32 paymentId,
        address token,
        uint256 amount,
        uint64 expiresAt,
        bytes32 claimHash,
        address arbiter
    ) external {
        _escrow(paymentId, token, amount, expiresAt, claimHash, arbiter);
    }

    function _escrow(
        bytes32 paymentId,
        address token,
        uint256 amount,
        uint64 expiresAt,
        bytes32 claimHash,
        address arbiter
    ) internal {
        if (payments[paymentId].status != Status.None) revert AlreadyExists();
        if (expiresAt <= block.timestamp) revert Expired();

        payments[paymentId] = Payment({
            sender: msg.sender,
            token: token,
            amount: amount,
            expiresAt: expiresAt,
            claimHash: claimHash,
            status: Status.Escrowed,
            arbiter: arbiter
        });

        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        emit PaymentEscrowed(paymentId, msg.sender, token, amount, expiresAt);
    }

    /**
     * @notice Claim an escrowed payment by presenting the secret and a payout
     *         address (the recipient's freshly created wallet).
     */
    function claim(bytes32 paymentId, bytes32 secret, address recipient) external {
        Payment storage p = payments[paymentId];
        if (p.status != Status.Escrowed) revert NotEscrowed();
        if (block.timestamp > p.expiresAt) revert Expired();
        if (keccak256(abi.encodePacked(secret)) != p.claimHash) revert InvalidSecret();

        p.status = Status.Claimed;
        if (!IERC20(p.token).transfer(recipient, p.amount)) revert TransferFailed();

        emit PaymentClaimed(paymentId, recipient, p.amount);
    }

    /**
     * @notice Raise a dispute on an escrowed payment, freezing it so it can
     *         neither be claimed, refunded, nor cancelled until the arbiter
     *         resolves it. Only the sender (payer) can raise a dispute, and only
     *         while the payment is still escrowed and unexpired.
     * @dev    Requires the payment to have been created with an arbiter via
     *         {escrowWithArbiter}.
     */
    function dispute(bytes32 paymentId) external {
        Payment storage p = payments[paymentId];
        if (p.status != Status.Escrowed) revert NotDisputable();
        if (block.timestamp > p.expiresAt) revert Expired();
        if (p.arbiter == address(0)) revert NoArbiter();
        if (msg.sender != p.sender) revert NotSender();

        p.status = Status.Disputed;
        emit DisputeRaised(paymentId, msg.sender, p.arbiter);
    }

    /**
     * @notice Resolve a disputed payment. Only the designated arbiter may call.
     *         The arbiter either releases the funds to `recipient` or refunds
     *         the original sender — a single, final, on-chain settlement step.
     * @param releaseToRecipient true => pay `recipient`; false => refund sender.
     * @param recipient          Payout address when releasing (ignored on refund).
     */
    function resolveDispute(
        bytes32 paymentId,
        bool releaseToRecipient,
        address recipient
    ) external {
        Payment storage p = payments[paymentId];
        if (p.status != Status.Disputed) revert NotDisputed();
        if (msg.sender != p.arbiter) revert NotArbiter();

        address beneficiary;
        if (releaseToRecipient) {
            if (recipient == address(0)) revert ZeroRecipient();
            p.status = Status.Claimed;
            beneficiary = recipient;
        } else {
            p.status = Status.Refunded;
            beneficiary = p.sender;
        }

        if (!IERC20(p.token).transfer(beneficiary, p.amount)) revert TransferFailed();
        emit DisputeResolved(paymentId, msg.sender, releaseToRecipient, beneficiary, p.amount);
    }

    /// @notice Auto-refund an expired, unclaimed payment back to the sender.
    function refund(bytes32 paymentId) external {
        Payment storage p = payments[paymentId];
        if (p.status != Status.Escrowed) revert NotEscrowed();
        if (block.timestamp <= p.expiresAt) revert NotExpired();

        p.status = Status.Refunded;
        if (!IERC20(p.token).transfer(p.sender, p.amount)) revert TransferFailed();

        emit PaymentRefunded(paymentId, p.sender, p.amount);
    }

    /// @notice Cancel an unclaimed payment before expiry (sender only).
    function cancel(bytes32 paymentId) external {
        Payment storage p = payments[paymentId];
        if (p.status != Status.Escrowed) revert NotEscrowed();
        if (msg.sender != p.sender) revert NotSender();

        p.status = Status.Cancelled;
        if (!IERC20(p.token).transfer(p.sender, p.amount)) revert TransferFailed();

        emit PaymentCancelled(paymentId, p.sender, p.amount);
    }

    /// @notice Read a payment's current status.
    function statusOf(bytes32 paymentId) external view returns (Status) {
        return payments[paymentId].status;
    }
}
