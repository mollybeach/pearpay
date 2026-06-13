import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pear Pay — Turn Conversations Into Transactions",
  description:
    "Send money anywhere you communicate. From messaging apps to AI agents. One conversation. One payment.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#0b1f16",
          color: "#eafff3",
        }}
      >
        {children}
      </body>
    </html>
  );
}
