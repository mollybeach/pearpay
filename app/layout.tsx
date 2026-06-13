import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

/**
 * Resolve the public base URL so the social-preview image is an absolute URL
 * that loads on whatever domain is actually serving the site:
 *   - NEXT_PUBLIC_SITE_URL  → explicit override
 *   - VERCEL_PROJECT_PRODUCTION_URL → the project's production domain
 *   - VERCEL_URL → the current (preview) deployment domain
 *   - fallback → the canonical custom domain
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://pearpay.app")
).replace(/\/$/, "");

const TITLE = "Pear Pay — Turn Conversations Into Transactions";
const DESCRIPTION =
  "Send money anywhere you communicate — from messaging apps to AI agents. No wallets, no chains, no addresses. Just say what you want.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Pear Pay",
  keywords: [
    "Pear Pay",
    "web3 payments",
    "USDC",
    "conversational payments",
    "Apple Pay web3",
    "AI agent payments",
  ],
  icons: {
    icon: "/PearPayLogo.png",
    apple: "/PearPayLogo.png",
  },
  alternates: { canonical: "/" },
  // The business card is used as the social sharing preview image.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Pear Pay",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/pearpaybusinesscard.png",
        width: 1536,
        height: 1024,
        type: "image/png",
        alt: "Pear Pay — The Apple Pay of Web3",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/pearpaybusinesscard.png"],
    creator: "@pearpay_usdc",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ambient min-h-screen font-sans">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
