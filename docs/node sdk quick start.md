> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Node SDK Quickstart

Get started with Dynamic's Node SDK to add server-side wallets, MPC-powered signing, and flexible multi-chain support to your backend in just a few lines.

<Note>
  Before you start: Node.js 18+, and a Dynamic environment ID and API token from the [Dynamic Dashboard](https://app.dynamic.xyz/dashboard/developer/api).
</Note>

<Tabs>
  <Tab title="Agent-friendly">
    <Tip>
      Add the Dynamic docs MCP to your AI editor first — your agent can then query the docs directly. Instructions are on the [Welcome page](/overview/introduction/welcome).
    </Tip>

    Copy this prompt into your LLM (e.g. Claude, ChatGPT, Cursor) to implement Dynamic in your Node.js app.

    <div data-llm-quickstart>
      ````markdown theme={"system"}
      # Node SDK Quickstart

      ## Purpose and Usage

      This document provides structured quickstart information for the Dynamic Node SDK. It is designed to be consumed by LLMs to generate accurate installation commands and code examples based on user requirements.

      > **Important scope note:** The Dynamic Node SDK is for **server-side wallet operations only** — creating wallets, signing transactions, and MPC key management. If the user needs to verify Dynamic-issued JWTs on their backend, direct them to: https://www.dynamic.xyz/docs/overview/authentication/tokens — that is a separate concern and does not use these packages.

      ---

      ## How to use this document

      Start by asking the user which path they want:

      > "Would you like a **Quick start** (EVM + pnpm + TWO_OF_TWO threshold scheme, zero configuration — recommended if you're just getting started) or a **Custom setup** (choose your chains, package manager, and threshold scheme)?"

      - If the user chooses **Quick start**: follow the Quick Start Path section exactly. Do not ask any configuration questions — execute the happy path as written.
      - If the user chooses **Custom setup**: follow the Custom Setup Path section and ask all configuration questions before proceeding.

      ---

      ## Quick Start Path

      > Use this path when the user chooses Quick start. Execute every step in order. Do not skip steps. Do not ask configuration questions.

      **Stack:** pnpm + EVM only + TWO_OF_TWO threshold scheme

      ### Step 1 — Prerequisites

      Tell the user:
      - Node.js 18+ is required
      - A Dynamic environment ID and API token are required — get them at https://app.dynamic.xyz/dashboard/developer/api

      Ask the user for their environment ID and API token before proceeding.

      ### Step 2 — Install

      Initialize a new project and install all required packages explicitly. `@dynamic-labs-wallet/core` is required for `ThresholdSignatureScheme`. `viem` is required for EVM utilities and must be installed directly — do not rely on it as a transitive dependency (breaks under pnpm strict mode). `tsx` is the TypeScript runtime used to execute the app.

      ```bash
      pnpm init
      ```

      Then open the generated `package.json` and add `"type": "module"` — this is required because the SDK code uses ES module syntax (top-level `await`):

      ```json
      {
        "type": "module",
        "pnpm": { "onlyBuiltDependencies": ["esbuild"] }
      }
      ```

      > **Why `onlyBuiltDependencies`:** pnpm v10 suppresses build scripts by default, which prevents esbuild from installing its platform binary. Adding this before your first install avoids a tsx crash on first run.

      Then install:

      ```bash
      pnpm add @dynamic-labs-wallet/node-evm @dynamic-labs-wallet/core viem
      pnpm add -D tsx
      ```

      ### Step 3 — Set up environment variables

      Create a `.env` file at the project root:

      ```bash
      # .env
      DYNAMIC_AUTH_TOKEN=your_api_token_here
      DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
      WALLET_PASSWORD=your_secure_wallet_password_here
      ```

      > `DYNAMIC_AUTH_TOKEN` is a **server-level API credential** from the Dynamic dashboard — not a user-facing JWT. Never expose it to clients.

      To load these variables at runtime, use Node's built-in `--env-file` flag (Node 20.6+):

      ```bash
      npx tsx --env-file=.env server.ts
      ```

      For older Node versions, install and import `dotenv` at the top of your entry file:

      ```bash
      pnpm add dotenv
      ```
      ```typescript
      import 'dotenv/config';
      ```

      ### Step 4 — Initialize the client

      > **`enableMPCAccelerator` note:** This option enables AWS Nitro Enclave-based attestation for faster MPC operations. Set it to `true` only in environments that support Nitro Enclave attestation (e.g. production AWS infrastructure). In local development or CI environments, set it to `false` — using `true` in unsupported environments will cause a `SessionAttestationError: Attestation verification failed` crash during wallet creation.

      ```typescript
      import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';

      export const authenticatedEvmClient = async ({
        authToken,
        environmentId,
      }: {
        authToken: string;
        environmentId: string;
      }) => {
        const client = new DynamicEvmWalletClient({
          environmentId,
          enableMPCAccelerator: false, // Set to true only on AWS Nitro Enclave-compatible infrastructure
        });
        await client.authenticateApiToken(authToken);
        return client;
      };
      ```

      ### Step 5 — Create a wallet

      ```typescript
      import { ThresholdSignatureScheme } from '@dynamic-labs-wallet/core';

      const evmClient = await authenticatedEvmClient({
        authToken: process.env.DYNAMIC_AUTH_TOKEN!,
        environmentId: process.env.DYNAMIC_ENVIRONMENT_ID!,
      });

      const wallet = await evmClient.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        password: process.env.WALLET_PASSWORD,
        onError: (error: Error) => {
          console.error('Wallet creation error:', error);
        },
        backUpToClientShareService: true,
      });

      console.log('Wallet created:', wallet.accountAddress);
      ```

      ### Step 6 — Sign a message

      ```typescript
      const signature = await evmClient.signMessage({
        accountAddress: wallet.accountAddress,
        message: 'Hello from Dynamic!',
        password: process.env.WALLET_PASSWORD,
      });

      console.log('Message signed:', signature);
      ```

      > **Next:** To sign and broadcast a real transaction, see [Sign EVM Transactions](/node/evm/sign-transactions).

      ### Step 7 — Run the app

      ```bash
      npx tsx --env-file=.env server.ts
      ```

      ---

      ## Custom Setup Path

      > Use this path when the user chooses Custom setup. Ask ALL questions below before generating any code.

      **Questions to ask the user:**

      1. Which package manager do you prefer? (npm, yarn, pnpm, bun)
      2. Which chains do you want to support? (EVM, SVM, TON — one or more)
      3. Which threshold signature scheme? (TWO_OF_TWO or TWO_OF_THREE)

      **Only after receiving answers**, use the sections below to generate the correct setup.

      ### Package Manager Commands
      - `npm`: `npm i`
      - `yarn`: `yarn add`
      - `pnpm`: `pnpm add`
      - `bun`: `bun add`

      ### Package Mapping

      Always install all of the following explicitly — do not rely on transitive dependencies, which break under pnpm's strict mode.

      - Core (always required): `@dynamic-labs-wallet/core`
      - EVM: `@dynamic-labs-wallet/node-evm`
      - SVM: `@dynamic-labs-wallet/node-svm`
      - TON: `@dynamic-labs-wallet/node-ton`
      - Transaction utilities (always required): `viem`
      - TypeScript runtime (dev dependency): `tsx`

      **Example — EVM + SVM with pnpm:**
      ```bash
      pnpm add @dynamic-labs-wallet/node-evm @dynamic-labs-wallet/node-svm @dynamic-labs-wallet/core viem
      pnpm add -D tsx
      ```

      > **Why `onlyBuiltDependencies`:** pnpm v10 suppresses build scripts by default, which prevents esbuild from installing its platform binary. Adding this before your first install avoids a tsx crash on first run.
      > ```json
      > "pnpm": { "onlyBuiltDependencies": ["esbuild"] }
      > ```

      ### Environment Variables

      ```bash
      # .env
      DYNAMIC_AUTH_TOKEN=your_api_token_here
      DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
      WALLET_PASSWORD=your_secure_wallet_password_here
      ```

      > `DYNAMIC_AUTH_TOKEN` is a **server-level API credential** — not a user JWT. Never expose it to clients.

      Load at runtime with Node 20.6+:
      ```bash
      npx tsx --env-file=.env server.ts
      ```

      Or with `dotenv` for older Node versions:
      ```typescript
      import 'dotenv/config';
      ```

      ### Client Initialization

      Use the same parametric pattern for all chains — pass credentials as function arguments rather than reading directly from `process.env` inside the factory. This keeps clients testable and consistent.

      > **`enableMPCAccelerator` note:** Set to `true` only on AWS Nitro Enclave-compatible infrastructure (e.g. production AWS). In local development or CI, set to `false` — `true` will cause a `SessionAttestationError` crash in unsupported environments.

      **EVM:**
      ```typescript
      import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';

      export const authenticatedEvmClient = async ({
        authToken,
        environmentId,
      }: {
        authToken: string;
        environmentId: string;
      }) => {
        const client = new DynamicEvmWalletClient({
          environmentId,
          enableMPCAccelerator: false, // Set to true only on AWS Nitro Enclave-compatible infrastructure
        });
        await client.authenticateApiToken(authToken);
        return client;
      };
      ```

      **SVM:**
      ```typescript
      import { DynamicSvmWalletClient } from '@dynamic-labs-wallet/node-svm';

      export const authenticatedSvmClient = async ({
        authToken,
        environmentId,
      }: {
        authToken: string;
        environmentId: string;
      }) => {
        const client = new DynamicSvmWalletClient({
          environmentId,
        });
        await client.authenticateApiToken(authToken);
        return client;
      };
      ```

      **TON:**
      ```typescript
      import { DynamicTonWalletClient } from '@dynamic-labs-wallet/node-ton';

      export const authenticatedTonClient = async ({
        authToken,
        environmentId,
      }: {
        authToken: string;
        environmentId: string;
      }) => {
        const client = new DynamicTonWalletClient({
          environmentId,
        });
        await client.authenticateApiToken(authToken);
        return client;
      };
      ```

      ### Wallet Creation (all chains)

      ```typescript
      import { ThresholdSignatureScheme } from '@dynamic-labs-wallet/core';

      const wallet = await client.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO, // or TWO_OF_THREE
        password: process.env.WALLET_PASSWORD,
        onError: (error: Error) => {
          console.error('Wallet creation error:', error);
        },
        backUpToClientShareService: true,
      });

      console.log('Wallet created:', wallet.accountAddress);
      ```

      ### SVM Transaction Example

      ```typescript
      import {
        Connection,
        LAMPORTS_PER_SOL,
        PublicKey,
        SystemProgram,
        Transaction,
      } from '@solana/web3.js';

      const svmClient = await authenticatedSvmClient({
        authToken: process.env.DYNAMIC_AUTH_TOKEN!,
        environmentId: process.env.DYNAMIC_ENVIRONMENT_ID!,
      });

      const wallet = await svmClient.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        password: process.env.WALLET_PASSWORD,
        onError: (error: Error) => console.error('SVM wallet creation error:', error),
        backUpToClientShareService: true,
      });

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const senderPublicKey = new PublicKey(wallet.accountAddress);
      const recipientPublicKey = new PublicKey('recipient_address_here');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: recipientPublicKey,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPublicKey;

      const signedTx = await svmClient.signTransaction({
        senderAddress: wallet.accountAddress,
        transaction,
        password: process.env.WALLET_PASSWORD,
      });

      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);
      console.log('Transaction confirmed:', signature);
      ```

      ### Valid Chain Combinations
      - Any single chain or any combination of EVM, SVM, and TON is valid
      - At least one chain must be selected

      ### Documentation
      All docs for this SDK: https://docs.dynamic.xyz (paths starting with `/node/`)
      Environment ID and API token: https://app.dynamic.xyz/dashboard/developer/api

      ---

      ## Critical Reference

      | Correct | Incorrect | Notes |
      |---|---|---|
      | Install `viem` explicitly | Rely on it as a transitive dep | Imported in Step 6; breaks under pnpm strict mode without explicit install |
      | Install `@dynamic-labs-wallet/core` explicitly | Rely on it as a transitive dep | Required for `ThresholdSignatureScheme`; breaks under pnpm strict mode without explicit install |
      | `password: process.env.WALLET_PASSWORD` | `password: "your-secure-password"` | Never hardcode passwords in source |
      | Pass credentials as function args | Read `process.env` inside factory | Consistent pattern across EVM, SVM, TON — easier to test |
      | `DYNAMIC_AUTH_TOKEN` = server API credential | `DYNAMIC_AUTH_TOKEN` = user JWT | Completely different credentials. Never expose the API token to clients |
      | `enableMPCAccelerator: false` in local/CI | `enableMPCAccelerator: true` in local/CI | `true` requires AWS Nitro Enclave support — causes `SessionAttestationError` in standard environments |

      ---

      ## Troubleshooting — Dashboard Configuration

      If the SDK initializes but wallet creation fails or returns errors, verify the following in the Dynamic dashboard at https://app.dynamic.xyz:

      ### 1 — Embedded wallets not enabled
      Go to **Wallets** and enable embedded wallets. Without this, `createWalletAccount()` will return an error.

      ### 2 — Chains not enabled
      Go to **Chains & Networks** and enable the chains your app uses (Ethereum, Solana, TON, etc.). Wallet creation will fail silently or error if the chain isn't toggled on.

      ### 3 — API token has insufficient permissions
      Go to **Developer → API Tokens** and confirm the token has the correct permission scopes for wallet operations. See https://www.dynamic.xyz/docs/overview/developer-dashboard/api-token-permissions for the full scope reference.

      ### 4 — `SessionAttestationError` during wallet creation
      This error occurs when `enableMPCAccelerator: true` is set in an environment that does not support AWS Nitro Enclave attestation (e.g. local dev, CI, non-AWS servers). Set `enableMPCAccelerator: false` to resolve it.

      If these are all configured and the issue persists, check server logs for error codes and refer to https://docs.dynamic.xyz/overview/troubleshooting/general.
      ````
    </div>
  </Tab>

  <Tab title="Visual">
    ## Install the SDK

    <iframe frameBorder="0" width="100%" height="600px" src="https://documentation-quickstarts.vercel.app/node?color-scheme=dark" allow="clipboard-write" className="rn-qs-dark">
      {' '}
    </iframe>

    <iframe frameBorder="0" width="100%" height="600px" src="https://documentation-quickstarts.vercel.app/node?color-scheme=light" allow="clipboard-write" className="rn-qs-light">
      {' '}
    </iframe>

    ## Get Your Credentials

    Navigate to the [Dynamic Dashboard](https://app.dynamic.xyz/dashboard/developer/api) and:

    1. Copy your `Environment ID`
    2. Create a new API token

    <Frame>
      <img src="https://mintcdn.com/dynamic-docs-testing/UE-XnPYRwgMqTMGV/images/dashboard/dashboard-env-id-api-token.png?fit=max&auto=format&n=UE-XnPYRwgMqTMGV&q=85&s=859554c95305af1b97ea6677ab64260b" alt="Environment ID and API Token" width="2656" height="1304" data-path="images/dashboard/dashboard-env-id-api-token.png" />
    </Frame>

    ## Example Usage

    The quickstart embed under **Install the SDK** includes dependency install and server initialization. Use the environment ID and API token from **Get Your Credentials** in your code and environment variables below.

    ## Enable Features in Dashboard

    Before you can use wallet features, you need to enable them in your Dynamic dashboard:

    1. Go to your [Dynamic Dashboard](https://app.dynamic.xyz/dashboard/overview)
    2. Select your project
    3. Go to **Wallets** and enable embedded wallets
    4. Go to **Chains** and enable the networks you want to support (Ethereum, Solana, TON, etc.)

    ## Environment Variables

    ```bash theme={"system"}
    # .env
    DYNAMIC_AUTH_TOKEN=your_auth_token_here
    DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
    WALLET_PASSWORD=your_secure_wallet_password_here
    ```

    ## Available Threshold Signature Schemes

    * **TWO\_OF\_TWO**: Requires both server and Dynamic's infrastructure to sign
    * **TWO\_OF\_THREE**: Requires 2 out of 3 shares to sign

    ## Next Steps

    ### Ethereum (EVM) Support

    * [Create EVM Wallets](/node/evm/create-wallet)
    * [Sign EVM Transactions](/node/evm/sign-transactions)

    ### Solana (SVM) Support

    * [Create SVM Wallets](/node/svm/create-wallet)
    * [Sign SVM Transactions](/node/svm/sign-transactions)

    ### TON Support

    * [Create TON Wallets](/node/ton/create-wallet)
    * [Sign TON Transactions](/node/ton/sign-transactions)

    ### API Reference

    * [EVM API Reference](/node/reference/evm/)
    * [SVM API Reference](/node/reference/svm/)
    * [TON API Reference](/node/ton/)
  </Tab>
</Tabs>
