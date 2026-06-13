import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const SITE_URL = "https://pearpay.app";
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
        width: 1200,
        height: 630,
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
