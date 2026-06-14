/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Sponsor SDKs are server-only; keep them out of the client bundle.
    // NOTE: @circle-fin/x402-batching is intentionally NOT external — webpack
    // bundles it (and its viem imports) into the serverless function so it
    // resolves at runtime on Vercel. It is imported with a static specifier in
    // src/integrations/arc/x402-gateway.ts.
    serverComponentsExternalPackages: [
      "twilio",
      "@unlink-xyz/sdk",
      "@dynamic-labs-wallet/node-evm",
      "@dynamic-labs-wallet/node",
      "@dynamic-labs-wallet/core",
    ],
  },
};

export default nextConfig;
