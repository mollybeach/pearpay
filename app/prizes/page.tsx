import type { Metadata } from "next";
import { PrizeTabs } from "../components/prizes/PrizeTabs";

export const metadata: Metadata = {
  title: "Prize Tracks — Pear Pay",
  description:
    "How Pear Pay satisfies ETHGlobal NYC 2026 tracks — Finalist, Arc, Dynamic, and Unlink. Live Arc Testnet escrow, x402 nanopayments, Delegated Access, and private burner flow.",
};

/**
 * Prize-pool showcase page — in-page tabs (Finalist, Arc, Dynamic, Unlink)
 * documenting Pear Pay's sponsor integrations with current code evidence.
 */
export default function PrizesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Prize <span className="text-pear-400">tracks</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-cream/70">
          Pear Pay is built to win across multiple ETHGlobal NYC 2026 sponsor
          tracks. Switch tabs for bounty asks, what we built, code evidence, and
          proof commands — including the live Autonomous Private Agent flow on
          the homepage.
        </p>
        <p className="mx-auto mt-4 max-w-xl rounded-xl border border-white/10 bg-pear-900/40 px-4 py-3 font-mono text-xs text-pear-200/90">
          npm run judge:demo · verify:arc · verify:nanopay · verify:dynamic
        </p>
      </div>

      <div className="mt-10">
        <PrizeTabs />
      </div>
    </main>
  );
}
