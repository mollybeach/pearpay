"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ESCROW_EXPLORER_URL } from "@/lib/constants";

type NavItem = { href: string; label: string; external?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/pay", label: "Try it" },
  { href: "/messages", label: "Simulator" },
  { href: "/prizes", label: "Prizes" },
  { href: ESCROW_EXPLORER_URL, label: "Explorer", external: true },
  { href: "/about", label: "About" },
];

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-cream";

/** Sticky site header with the Pear Pay logo and a responsive nav. */
export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-pear-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" onClick={close} className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-white to-pear-50 p-1 shadow-sm ring-1 ring-black/5">
            <Image
              src="/PearPayLogo.png"
              alt="Pear Pay"
              width={40}
              height={40}
              priority
              className="h-8 w-8 object-contain"
            />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Pear<span className="text-pear-400">Pay</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
                title="PearPayEscrow on Arc Testnet"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ),
          )}
          <a
            href="https://github.com/mollybeach/pearpay"
            target="_blank"
            rel="noreferrer"
            className={`hidden lg:block ${linkClass}`}
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cream transition hover:bg-white/5 sm:hidden"
        >
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open ? (
        <nav className="border-t border-white/5 bg-pear-950/95 px-5 pb-4 pt-2 backdrop-blur sm:hidden">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                className="block rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition hover:bg-white/5"
                title="PearPayEscrow on Arc Testnet"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="block rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            ),
          )}
          <a
            href="https://github.com/mollybeach/pearpay"
            target="_blank"
            rel="noreferrer"
            onClick={close}
            className="block rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition hover:bg-white/5"
          >
            GitHub
          </a>
          <a
            href="#waitlist"
            onClick={close}
            className="mt-2 block rounded-lg bg-pear-500 px-3 py-3 text-center text-base font-semibold text-pear-950"
          >
            Join waitlist
          </a>
        </nav>
      ) : null}
    </header>
  );
}
