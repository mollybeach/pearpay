import Image from "next/image";
import Link from "next/link";

/** Sticky site header with the Pear Pay logo and primary navigation. */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-pear-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/PearPayLogo.png"
            alt="Pear Pay"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-bold tracking-tight">
            Pear<span className="text-pear-400">Pay</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-cream"
          >
            Home
          </Link>
          <Link
            href="/pay"
            className="rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-cream"
          >
            Try it
          </Link>
          <Link
            href="/about"
            className="rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-cream"
          >
            About
          </Link>
          <a
            href="https://github.com/mollybeach/pearpay"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-cream sm:block"
          >
            GitHub
          </a>
          <a
            href="#waitlist"
            className="ml-1 rounded-lg bg-pear-500 px-4 py-2 text-sm font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400"
          >
            Join waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}
