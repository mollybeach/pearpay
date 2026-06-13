import Image from "next/image";
import Link from "next/link";

/** Branded 404 — also the fallback for invalid claim tokens (notFound()). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <div className="rounded-3xl bg-gradient-to-b from-white to-pear-50 p-4 shadow-glow ring-1 ring-white/40">
        <Image
          src="/PearPayLogo.png"
          alt="Pear Pay"
          width={120}
          height={120}
          className="h-20 w-20 object-contain"
        />
      </div>

      <h1 className="mt-6 text-5xl font-extrabold tracking-tight">404</h1>
      <p className="mt-2 text-cream/70">
        This page or payment link doesn&apos;t exist — it may have been claimed,
        cancelled, or expired.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400"
        >
          Go home
        </Link>
        <Link
          href="/pay"
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-cream transition hover:bg-white/5"
        >
          Try a payment
        </Link>
      </div>
    </main>
  );
}
