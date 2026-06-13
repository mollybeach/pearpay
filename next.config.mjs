/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Sponsor SDKs are server-only; keep them out of the client bundle.
    serverComponentsExternalPackages: [
      "twilio",
      "@unlink-xyz/sdk",
    ],
  },
};

export default nextConfig;
