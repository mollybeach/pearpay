/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sponsor SDKs are server-only; keep them out of the client bundle.
  serverExternalPackages: ["twilio", "@hashgraph/sdk"],
};

export default nextConfig;
