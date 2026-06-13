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
    ],
  },
};

export default nextConfig;
