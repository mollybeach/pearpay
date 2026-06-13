import { PaymentFlow } from "@/components/PaymentFlow";
import type { PaymentPayload } from "@/lib/payload";

const demoPayload: PaymentPayload = {
  amount: 20,
  token: "USDC",
  recipient: "0x2222222222222222222222222222222222222222",
  intent_id: "pay_demo",
  recipient_label: "molly.eth",
  recipient_type: "address",
};

export default function PayDemoPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-12">
      <PaymentFlow payload={demoPayload} />
    </div>
  );
}
