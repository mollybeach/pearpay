// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../PearPayEscrow.sol";

interface Vm {
    function expectRevert(bytes4 selector) external;
    function prank(address sender) external;
    function warp(uint256 timestamp) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
}

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (balanceOf[from] < amount || allowance[from][msg.sender] < amount) {
            return false;
        }
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) return false;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PearPayEscrowTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    PearPayEscrow private escrow;
    MockERC20 private usdc;
    address private sender = address(0xA11CE);
    address private recipient = address(0xB0B);
    address private arbiter = address(0xA46172);
    bytes32 private paymentId = keccak256("payment-1");
    bytes32 private secret = keccak256("secret");
    bytes32 private claimHash = keccak256(abi.encodePacked(secret));
    uint256 private amount = 100e6;

    function setUp() public {
        escrow = new PearPayEscrow();
        usdc = new MockERC20();
        usdc.mint(sender, amount * 10);
        vm.prank(sender);
        usdc.approve(address(escrow), amount * 10);
    }

    function testEscrowAndClaim() public {
        _escrow(paymentId);
        escrow.claim(paymentId, secret, recipient);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Claimed));
        _assertEq(usdc.balanceOf(recipient), amount);
    }

    function testRejectsIncorrectSecret() public {
        _escrow(paymentId);
        vm.expectRevert(PearPayEscrow.InvalidSecret.selector);
        escrow.claim(paymentId, keccak256("wrong"), recipient);
    }

    function testRefundAfterExpiry() public {
        _escrow(paymentId);
        vm.warp(block.timestamp + 8 days);
        escrow.refund(paymentId);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Refunded));
        _assertEq(usdc.balanceOf(sender), amount * 10);
    }

    function testCancelBeforeExpiry() public {
        _escrow(paymentId);
        vm.prank(sender);
        escrow.cancel(paymentId);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Cancelled));
    }

    function testRejectsDoubleClaim() public {
        _escrow(paymentId);
        escrow.claim(paymentId, secret, recipient);
        vm.expectRevert(PearPayEscrow.NotEscrowed.selector);
        escrow.claim(paymentId, secret, recipient);
    }

    function testRejectsNonSenderCancel() public {
        _escrow(paymentId);
        vm.expectRevert(PearPayEscrow.NotSender.selector);
        escrow.cancel(paymentId);
    }

    // ── Dispute path ─────────────────────────────────────────────────────────

    function testDisputeAndResolveRelease() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Disputed));

        vm.prank(arbiter);
        escrow.resolveDispute(paymentId, true, recipient);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Claimed));
        _assertEq(usdc.balanceOf(recipient), amount);
    }

    function testDisputeAndResolveRefund() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);

        vm.prank(arbiter);
        escrow.resolveDispute(paymentId, false, recipient);
        _assertEq(uint256(escrow.statusOf(paymentId)), uint256(PearPayEscrow.Status.Refunded));
        // Sender funded amount*10, escrowed `amount`, refunded `amount` => whole balance back.
        _assertEq(usdc.balanceOf(sender), amount * 10);
        _assertEq(usdc.balanceOf(recipient), 0);
    }

    function testDisputeRequiresArbiter() public {
        _escrow(paymentId); // no arbiter
        vm.prank(sender);
        vm.expectRevert(PearPayEscrow.NoArbiter.selector);
        escrow.dispute(paymentId);
    }

    function testOnlySenderCanDispute() public {
        _escrowWithArbiter(paymentId);
        vm.expectRevert(PearPayEscrow.NotSender.selector);
        escrow.dispute(paymentId); // caller is the test contract, not sender
    }

    function testOnlyArbiterCanResolve() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);
        vm.expectRevert(PearPayEscrow.NotArbiter.selector);
        escrow.resolveDispute(paymentId, true, recipient); // caller is not the arbiter
    }

    function testCannotClaimWhileDisputed() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);
        vm.expectRevert(PearPayEscrow.NotEscrowed.selector);
        escrow.claim(paymentId, secret, recipient);
    }

    function testCannotRefundWhileDisputed() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);
        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(PearPayEscrow.NotEscrowed.selector);
        escrow.refund(paymentId);
    }

    function testResolveRequiresDisputed() public {
        _escrowWithArbiter(paymentId);
        vm.prank(arbiter);
        vm.expectRevert(PearPayEscrow.NotDisputed.selector);
        escrow.resolveDispute(paymentId, true, recipient); // never disputed
    }

    function testResolveReleaseRejectsZeroRecipient() public {
        _escrowWithArbiter(paymentId);
        vm.prank(sender);
        escrow.dispute(paymentId);
        vm.prank(arbiter);
        vm.expectRevert(PearPayEscrow.ZeroRecipient.selector);
        escrow.resolveDispute(paymentId, true, address(0));
    }

    function _escrow(bytes32 id) private {
        vm.prank(sender);
        escrow.escrow(id, address(usdc), amount, uint64(block.timestamp + 7 days), claimHash);
    }

    function _escrowWithArbiter(bytes32 id) private {
        vm.prank(sender);
        escrow.escrowWithArbiter(
            id,
            address(usdc),
            amount,
            uint64(block.timestamp + 7 days),
            claimHash,
            arbiter
        );
    }

    function _assertEq(uint256 left, uint256 right) private pure {
        if (left != right) revert("assert eq failed");
    }
}
