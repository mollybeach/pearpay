"use client";

import { useEffect, useState } from "react";
import {
  WagmiProvider,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { erc20Abi, formatUnits, isAddress, parseUnits } from "viem";
import {
  ARC_TESTNET_CHAIN_ID,
  EXPLORER_TX,
  USDC_ARC_TESTNET,
  USDC_DECIMALS,
  USDC_FAUCET,
  demoWagmiConfig,
} from "@/lib/wagmi-demo";

/**
 * Live "Try it" payment — a REAL on-chain USDC transfer on Arc Testnet.
 *
 * Connect a browser wallet, then send Circle testnet USDC to any address; the
 * transaction is signed by the user's wallet and broadcast for real, returning
 * a verifiable BaseScan link. Self-contained wagmi + react-query providers so
 * it works regardless of the app-wide (Dynamic) provider state.
 */

const demoQueryClient = new QueryClient();

export function RealPayment() {
  return (
    <WagmiProvider config={demoWagmiConfig}>
      <QueryClientProvider client={demoQueryClient}>
        <RealPaymentInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function RealPaymentInner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: connecting, error: connectError } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useReadContract({
    address: USDC_ARC_TESTNET,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: Boolean(address) && !wrongChain, refetchInterval: 8000 },
  });

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1");
  const [formError, setFormError] = useState("");

  const {
    writeContract,
    data: hash,
    isPending: signing,
    error: sendError,
    reset,
  } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  function send() {
    setFormError("");
    if (!isAddress(to)) {
      setFormError("Enter a valid recipient address (0x…).");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setFormError("Enter an amount greater than 0.");
      return;
    }
    writeContract({
      chainId: ARC_TESTNET_CHAIN_ID,
      address: USDC_ARC_TESTNET,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, USDC_DECIMALS)],
    });
  }

  // Avoid SSR/hydration mismatch for wallet state.
  if (!mounted) {
    return (
      <div className="mx-auto h-40 w-full max-w-xl animate-pulse rounded-2xl border border-white/10 bg-pear-900/40" />
    );
  }

  const injected = connectors[0];
  // The injected() connector always exists in config, so its presence does NOT
  // mean a wallet is installed. Detect the actual EIP-1193 provider to avoid the
  // raw "Provider not found" error and guide the user to install MetaMask.
  const hasProvider =
    typeof window !== "undefined" &&
    Boolean((window as unknown as { ethereum?: unknown }).ethereum);
  const balanceText = balanceLoading
    ? "Loading…"
    : balanceError
      ? "Could not load"
      : balance !== undefined
        ? `${formatUnits(balance, USDC_DECIMALS)} USDC`
        : "—";

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-pear-900/60 p-5 shadow-glow">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-pear-500/15 px-3 py-1 text-xs font-semibold text-pear-300">
          🔵 Live · Arc Testnet
        </span>
        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-xs text-cream/55 hover:text-cream"
          >
            {address ? short(address) : "connected"} · Disconnect
          </button>
        ) : null}
      </div>

      {/* 1. Connect */}
      {!isConnected ? (
        <div className="mt-4 text-center">
          <p className="text-cream/75">
            Connect a wallet to send <b>real testnet USDC</b> on-chain.
          </p>
          <button
            type="button"
            disabled={!injected || !hasProvider || connecting}
            onClick={() => injected && connect({ connector: injected })}
            className="mt-4 w-full rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400 disabled:opacity-60"
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
          {!hasProvider ? (
            <p className="mt-2 text-xs text-amber-300">
              No browser wallet detected — install{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                MetaMask
              </a>{" "}
              (or open this page in your wallet&apos;s browser), then refresh.
            </p>
          ) : null}
          {hasProvider && connectError ? (
            <p className="mt-2 text-xs text-red-300">{connectError.message}</p>
          ) : null}
        </div>
      ) : wrongChain ? (
        /* 2. Wrong network */
        <div className="mt-4 text-center">
          <p className="text-cream/75">
            Switch your wallet to <b>Arc Testnet</b> (chain{" "}
            {ARC_TESTNET_CHAIN_ID}). Mainnet USDC on Base or Ethereum will not
            show here.
          </p>
          <button
            type="button"
            disabled={switching}
            onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
            className="mt-4 w-full rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 transition hover:bg-pear-400 disabled:opacity-60"
          >
            {switching ? "Switching…" : "Switch to Arc Testnet"}
          </button>
        </div>
      ) : (
        /* 3. Send */
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-pear-950/60 px-4 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-cream/55">Your USDC balance</span>
              <span className="font-semibold text-cream">{balanceText}</span>
            </div>
            <p className="mt-1 text-xs text-cream/40">
              Arc Testnet · chain {ARC_TESTNET_CHAIN_ID} ·{" "}
              {short(USDC_ARC_TESTNET)}
            </p>
            {balanceError ? (
              <button
                type="button"
                onClick={() => refetchBalance()}
                className="mt-2 text-xs text-pear-300 underline"
              >
                Retry balance
              </button>
            ) : null}
            {!balanceLoading &&
            !balanceError &&
            balance !== undefined &&
            balance === 0n ? (
              <p className="mt-2 text-xs text-amber-300/90">
                0 on Arc Testnet — fund this wallet from the Circle faucet
                (select Arc Testnet). Balances on Base mainnet or other networks
                are separate.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/40">
              Recipient address
            </label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pear-950 px-4 py-3 font-mono text-sm text-cream placeholder:text-cream/40 focus:border-pear-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/40">
              Amount (USDC)
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1"
              className="mt-1 w-full rounded-xl border border-white/10 bg-pear-950 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-pear-500 focus:outline-none"
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-300">{formError}</p>
          ) : null}

          <button
            type="button"
            disabled={signing || confirming}
            onClick={send}
            className="w-full rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400 disabled:opacity-60"
          >
            {signing
              ? "Confirm in wallet…"
              : confirming
                ? "Settling on-chain…"
                : `Send ${amount || "0"} USDC 🍐`}
          </button>

          {sendError ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {(sendError as { shortMessage?: string }).shortMessage ??
                sendError.message}
            </p>
          ) : null}

          {hash ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                confirmed
                  ? "border-pear-500/40 bg-pear-500/10 text-pear-200"
                  : "border-white/10 bg-white/5 text-cream/80"
              }`}
            >
              <p className="font-semibold">
                {confirmed
                  ? "✅ Settled on-chain"
                  : "⏳ Broadcast — waiting for confirmation…"}
              </p>
              <a
                href={`${EXPLORER_TX}/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all font-mono text-xs text-pear-300 underline"
              >
                {hash}
              </a>
              {confirmed ? (
                <button
                  type="button"
                  onClick={() => reset()}
                  className="mt-2 text-xs text-cream/55 hover:text-cream"
                >
                  Send another →
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="text-center text-xs text-cream/40">
            Need test USDC? Get free Arc Testnet USDC from the{" "}
            <a
              href={USDC_FAUCET}
              target="_blank"
              rel="noreferrer"
              className="text-pear-300 underline"
            >
              Circle faucet
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
