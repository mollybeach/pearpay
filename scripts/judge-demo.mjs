#!/usr/bin/env node
/**
 * Run all partner-prize verification scripts before live judging.
 *
 * Usage:
 *   npm run judge:demo
 *   BASE_URL=https://pearpay.app npm run judge:demo
 */
import { execSync } from "node:child_process";

const sections = [
  {
    title: "Arc ($15,000)",
    script: "node scripts/arc-live-verify.mjs",
    doc: "docs/ARC_BOUNTY.md",
    demo: [
      "Name bounty: Best Smart Contracts on Arc / Chain Abstracted USDC Apps",
      "npm run verify:arc → ArcScan escrow + claim txs",
      "POST /api/payments → rail: arc, chain 5042002",
      "/prizes → Arc tab",
    ],
  },
  {
    title: "Dynamic ($10,000)",
    script: "node scripts/verify-dynamic.mjs",
    doc: "docs/DYNAMIC_BOUNTY.md",
    demo: [
      "Name bounty: Best Use of Flow / Best Agentic Build",
      "POST /api/payments → open payUrl → Face ID + Flow → Arc",
      "Home → Run Autonomous Agent → x402 pay → 200",
    ],
  },
  {
    title: "Unlink ($5,000)",
    script: "node scripts/verify-unlink.mjs",
    doc: "docs/UNLINK_BOUNTY.md",
    demo: [
      "Name bounty: Best Private Nano Payment App / Best Unlink Integration",
      '/messages → "Send Sasha 50 USDC privately" → 🕶️ shielded',
      "POST /api/privacy/shield → mode: live",
    ],
  },
];

console.log("╔══════════════════════════════════════════════════╗");
console.log("║  Pear Pay — Partner Prize Pre-Judging Checks     ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log(`\nLive app: https://pearpay.app/`);
console.log(`Judging guide: docs/JUDGING.md\n`);

let allOk = true;

for (const section of sections) {
  console.log(`\n${"─".repeat(52)}`);
  console.log(`▶ ${section.title}`);
  console.log(`  Doc: ${section.doc}`);
  console.log(`${"─".repeat(52)}\n`);

  try {
    execSync(section.script, { stdio: "inherit" });
    console.log(`\n✅ ${section.title} checks passed\n`);
  } catch {
    console.error(`\n❌ ${section.title} checks failed\n`);
    allOk = false;
  }

  console.log("Demo script:");
  for (const step of section.demo) {
    console.log(`  • ${step}`);
  }
}

console.log(`\n${"═".repeat(52)}`);
if (allOk) {
  console.log("✅ All prize-pool checks passed. Ready for judging.");
} else {
  console.log("❌ Some checks failed — fix env vars and re-run.");
  console.log("   See docs/JUDGING.md and docs/ENV_SETUP.md");
}
console.log(`${"═".repeat(52)}\n`);

process.exit(allOk ? 0 : 1);
