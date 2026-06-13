import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentFlow } from "@/components/PaymentFlow";
import {
  decodePayload,
  formatRecipient,
  type PaymentPayload,
} from "@/lib/payload";
import { APP_URL } from "@/lib/constants";

interface PayPageProps {
  params: { data: string };
}

function safeDecode(data: string): PaymentPayload | null {
  try {
    return decodePayload(data);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PayPageProps): Promise<Metadata> {
  const payload = safeDecode(params.data);
  if (!payload) {
    return { title: "Invalid Payment | PearPay" };
  }

  const recipient = formatRecipient(payload);
  const title = `Pay ${payload.amount} ${payload.token}`;
  const description = `Send ${payload.amount} ${payload.token} to ${recipient} via PearPay`;
  const ogImage = `${APP_URL}/pay/${params.data}/opengraph-image`;

  return {
    title: `${title} | PearPay`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/pay/${params.data}`,
      siteName: "PearPay",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function PayPage({ params }: PayPageProps) {
  const payload = safeDecode(params.data);
  if (!payload) notFound();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-12">
      <PaymentFlow payload={payload} />
    </div>
  );
}
