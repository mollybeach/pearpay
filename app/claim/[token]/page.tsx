import { notFound } from "next/navigation";
import { getEscrowStore } from "@/core/escrow";
import { formatUsdcDisplay } from "@/lib/money";
import { ClaimButton } from "./claim-button";

/**
 * Public claim page — pearpay.app/claim/:token.
 *
 * A recipient with no wallet lands here from a Twilio SMS/WhatsApp link. The
 * ClaimButton triggers embedded wallet creation (Dynamic) and fund release.
 */
export default async function ClaimPage({
  params,
}: {
  params: { token: string };
}) {
  const payment = await getEscrowStore().getByToken(params.token);
  if (!payment) notFound();

  const claimed = payment.status === "claimed";
  const amount = payment.private
    ? "a private amount"
    : formatUsdcDisplay(payment.amount);

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 56 }} aria-hidden>
        🍐
      </div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>
        {payment.senderLabel} sent you
      </h1>
      <p style={{ fontSize: 40, color: "#7ee8b0", margin: "8px 0" }}>{amount}</p>
      {payment.memo ? (
        <p style={{ opacity: 0.8, fontStyle: "italic" }}>
          &ldquo;{payment.memo}&rdquo;
        </p>
      ) : null}

      {claimed ? (
        <p style={{ marginTop: 32, color: "#7ee8b0" }}>
          ✅ Claimed — funds are in your wallet.
        </p>
      ) : (
        <div style={{ marginTop: 32 }}>
          <ClaimButton token={params.token} />
          <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>
            We&apos;ll create a secure wallet for you automatically. No seed
            phrase required.
          </p>
        </div>
      )}
    </main>
  );
}
