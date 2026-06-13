import { ImageResponse } from "next/og";
import { decodePayload, formatRecipient } from "@/lib/payload";

export const runtime = "edge";
export const alt = "PearPay Payment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgProps {
  params: { data: string };
}

export default function Image({ params }: OgProps) {
  const { data } = params;

  let amount = "—";
  let token = "USDC";
  let recipient = "Unknown";

  try {
    const payload = decodePayload(data);
    amount = payload.amount.toFixed(2);
    token = payload.token;
    recipient = formatRecipient(payload);
  } catch {
    // fallback for invalid payload
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background:
            "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 50%, #dbeafe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            padding: 48,
            borderRadius: 32,
            border: "2px solid rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.35)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: "#64748b",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              PearPay
            </span>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "#2775CA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              $
            </div>
          </div>
          <div>
            <p style={{ fontSize: 28, color: "#64748b", margin: 0 }}>Amount</p>
            <p
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#0f172a",
                margin: "8px 0 0",
              }}
            >
              {amount}{" "}
              <span style={{ fontSize: 40, color: "#64748b" }}>{token}</span>
            </p>
          </div>
          <div>
            <p style={{ fontSize: 28, color: "#64748b", margin: 0 }}>To</p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: "#1e293b",
                margin: "8px 0 0",
                textTransform: "capitalize",
              }}
            >
              {recipient}
            </p>
          </div>
          <p style={{ fontSize: 22, color: "#94a3b8", margin: 0 }}>
            Tap to pay · Secured by Face ID · Arc Testnet
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
