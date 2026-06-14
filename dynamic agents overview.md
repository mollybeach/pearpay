> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Agents Overview

> Wallet infrastructure for AI agents — autonomous agents with their own wallets, or agents acting on behalf of users.

AI agents need wallets to hold funds, sign transactions, and pay for services. Dynamic gives you two patterns — pick the one that matches who the agent acts for.

## Server wallets — autonomous agents

Wallets your backend creates and controls. No user is required to sign; your code signs directly using MPC key shares.

**Use this when**

* The agent acts on its own behalf, not a user's
* Flows are fully automated: bots, scheduled tasks, pipelines
* You need to provision many agent wallets programmatically

**SDK support**

<div className="flex flex-wrap items-center gap-2 my-4 text-sm">
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/node.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=16f8140f26f963a84ba990f8657220ef" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/node.svg" /> Node</span>
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/python.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e4e96b31384e6cbb3380425fb462b58e" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/python.svg" /> Python</span>
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/rust.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=d99941edd2805bf5c38d13c7eef382b1" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/rust.svg" /> Rust</span>
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] opacity-60"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/go.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=0091b43159f05eb4333fdf684b50feca" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/go.svg" /> Go · Soon</span>
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/java.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=d5013413c68913b9f728174a0cbae0cc" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/java.svg" /> Java</span>
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] opacity-60"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/ruby.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e34bb95869e85fda391c9c9a72b97de3" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/ruby.svg" /> Ruby · Soon</span>
</div>

<CardGroup cols={2}>
  <Card title="Node" icon="node" href="/node/wallets/server-wallets/overview">
    Create wallets, sign transactions, and manage key shares from your backend.
  </Card>

  <Card title="Python" icon="python" href="/python/quickstart">
    Server-side MPC wallets on EVM and Solana.
  </Card>

  <Card title="Rust" icon="rust" href="/rust/quickstart">
    Server-side MPC wallets (beta).
  </Card>

  <Card title="Java" icon="java" href="/java/quickstart">
    Server-side MPC wallets (beta).
  </Card>
</CardGroup>

***

## Delegated access — agents acting for users

Your agent signs transactions on behalf of a user who has explicitly approved it. The user's embedded wallet stays user-owned; they grant your server limited signing rights and can revoke at any time.

**Use this when**

* The agent acts on behalf of a specific user
* You want the user to stay in control of their wallet
* Multi-user apps where each user has their own wallet the agent uses

**SDK support**

Delegated access has two legs — a client SDK to trigger the user's consent prompt, and a server SDK to use the delegated materials afterward.

<div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 my-4 text-sm">
  <span className="text-xs uppercase tracking-wide opacity-60">Trigger</span>

  <div className="flex flex-wrap items-center gap-2">
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/react.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=1cf149f3cb9eab0e2c13d10f8e8f8c09" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/react.svg" /> React</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/javascript.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=beae7147f961348c23b361c0d54a1113" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/javascript.svg" /> JavaScript</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/react.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=1cf149f3cb9eab0e2c13d10f8e8f8c09" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/react.svg" /> React Native</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/swift.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=c43e4f6aaee14603e902cb2016c62ab2" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/swift.svg" /> Swift</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/kotlin.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e53beee08e9748585fc295095023d8bd" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/kotlin.svg" /> Kotlin</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/flutter.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=af10298cf91de5d90884708e989a605b" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/flutter.svg" /> Flutter</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/unity.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e92b864d90bfc3134049b306865443a3" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/unity.svg" /> Unity</span>
  </div>

  <span className="text-xs uppercase tracking-wide opacity-60">Use</span>

  <div className="flex flex-wrap items-center gap-2">
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/node.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=16f8140f26f963a84ba990f8657220ef" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/node.svg" /> Node</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/python.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e4e96b31384e6cbb3380425fb462b58e" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/python.svg" /> Python</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/rust.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=d99941edd2805bf5c38d13c7eef382b1" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/rust.svg" /> Rust</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] opacity-60"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/go.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=0091b43159f05eb4333fdf684b50feca" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/go.svg" /> Go · Soon</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-gray-300 dark:ring-white/10"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/java.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=d5013413c68913b9f728174a0cbae0cc" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/java.svg" /> Java</span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] opacity-60"><img src="https://mintcdn.com/dynamic-docs-testing/p5WK-MuiM9G2AoW9/assets/images/sdks/ruby.svg?fit=max&auto=format&n=p5WK-MuiM9G2AoW9&q=85&s=e34bb95869e85fda391c9c9a72b97de3" alt="" className="size-5 !m-0 inline-block align-middle" width="24" height="24" data-path="assets/images/sdks/ruby.svg" /> Ruby · Soon</span>
  </div>
</div>

<Card title="Set up Delegated Access" icon="arrow-right" href="/overview/wallets/embedded-wallets/mpc/delegated-access/overview">
  How delegated access works, security considerations, and dashboard configuration.
</Card>

***

## Agent payments

Agents often need to pay for API access or services without a human in the loop. Dynamic server wallets plug into HTTP 402 payment flows — including [x402](https://www.x402.org/) and [Tempo MPP](https://docs.tempo.xyz) — so the agent can sign, pay, and retry automatically.

<Card title="Agent Payments" icon="credit-card" href="/overview/agents/agent-payments">
  Wire HTTP 402 payment flows to a Dynamic server wallet.
</Card>
