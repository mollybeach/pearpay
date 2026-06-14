/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Sponsor SDKs are server-only; keep them out of the client bundle.
    serverComponentsExternalPackages: [
      "twilio",
      "@unlink-xyz/sdk",
      "@dynamic-labs-wallet/node-evm",
      "@dynamic-labs-wallet/node",
      "@dynamic-labs-wallet/core",
      "@circle-fin/x402-batching",
      "@x402/core",
      "@x402/evm",
    ],
    // The Circle x402 batching SDK is loaded via a runtime dynamic import
    // (variable specifier + webpackIgnore), which Vercel's file tracer cannot
    // follow — so its files are missing from the serverless bundle in prod
    // ("Cannot find package '@circle-fin/x402-batching'"). Force-include the
    // package and its @x402 deps for every API route that may settle x402.
    outputFileTracingIncludes: {
      "/api/**": [
        "./node_modules/@circle-fin/x402-batching/**",
        "./node_modules/@x402/**",
      ],
    },
  },
};

export default nextConfig;
