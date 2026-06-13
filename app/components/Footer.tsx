import Image from "next/image";
import Link from "next/link";

/** Site footer with logo, quick links, and tagline. */
export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-pear-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-12 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/PearPayLogo.png"
            alt="Pear Pay"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <div>
            <p className="font-bold leading-tight">
              Pear<span className="text-pear-400">Pay</span>
            </p>
            <p className="text-xs text-cream/50">
              Turn Conversations Into Transactions
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream/70">
          <Link href="/" className="transition hover:text-cream">
            Home
          </Link>
          <Link href="/about" className="transition hover:text-cream">
            About
          </Link>
          <a
            href="https://github.com/mollybeach/pearpay"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-cream"
          >
            GitHub
          </a>
          <a href="#waitlist" className="transition hover:text-cream">
            Waitlist
          </a>
        </nav>
      </div>

      <p className="pb-8 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Pear Pay · Built at ETHGlobal NYC 2026
      </p>
    </footer>
  );
}
