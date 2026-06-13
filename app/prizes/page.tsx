import type { Metadata } from "next";
import { PrizeTabs } from "../components/prizes/PrizeTabs";

export const metadata: Metadata = {
  title: "Prize Tracks — Pear Pay",
  description:
    "How Pear Pay satisfies its ETHGlobal NYC 2026 tracks — Finalist, Arc, Dynamic, and Unlink. Bounty asks, what we built, code evidence, and why we should win.",
};

/**
 * Prize-pool showcase page — in-page tabs (Finalist, Arc, Dynamic, Unlink)
 * documenting Pear Pay's sponsor integrations, modeled on HedgePod's per-prize
 * implementation pages.
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
          tracks. Switch tabs to see the bounty asks, what we built, the code
          evidence, and why we should win.
        </p>
      </div>

      <div className="mt-10">
        <PrizeTabs />
      </div>
    </main>
  );
}
