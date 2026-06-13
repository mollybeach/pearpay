import Link from "next/link";

export default function PayNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-lg text-zinc-600">This payment link is invalid or expired.</p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Back to Pear Pay
      </Link>
    </div>
  );
}
