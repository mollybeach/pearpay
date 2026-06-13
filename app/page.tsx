export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "96px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64 }} aria-hidden>
        🍐
      </div>
      <h1 style={{ fontSize: 44, margin: "16px 0 8px" }}>Pear Pay</h1>
      <p style={{ fontSize: 22, color: "#7ee8b0", margin: 0 }}>
        Turn Conversations Into Transactions
      </p>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginTop: 24, opacity: 0.85 }}>
        Send money anywhere you communicate — from messaging apps to AI agents.
        No wallets, no chains, no addresses. Just say what you want.
      </p>
      <pre
        style={{
          display: "inline-block",
          marginTop: 32,
          padding: "12px 20px",
          background: "#13402c",
          borderRadius: 12,
          fontSize: 16,
        }}
      >
        &quot;Send Molly $20&quot;
      </pre>
    </main>
  );
}
