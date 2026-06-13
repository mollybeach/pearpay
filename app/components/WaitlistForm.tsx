"use client";

import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Waitlist signup form.
 *
 * There is no backend list yet, so a valid submission opens the visitor's mail
 * client pre-addressed to the team with their email in the body. The input is
 * wired to real state and validated — unlike a bare `mailto:` link, the address
 * the visitor typed is actually carried through.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);

    const subject = encodeURIComponent("Join the Pear Pay waitlist");
    const body = encodeURIComponent(
      `Please add me to the Pear Pay waitlist.\n\nEmail: ${value}`,
    );
    window.location.href = `mailto:hello@pearpay.app?subject=${subject}&body=${body}`;
  }

  if (submitted) {
    return (
      <p
        className="mx-auto mt-8 max-w-md rounded-xl border border-pear-500/30 bg-pear-500/10 px-4 py-3 text-center text-sm text-pear-200"
        role="status"
      >
        Thanks! Your mail app should open to confirm — we&apos;ll be in touch at{" "}
        <span className="font-semibold">{email.trim()}</span>.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto mt-8 flex max-w-md flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={error ? true : undefined}
          className="w-full rounded-xl border border-white/10 bg-pear-950 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-pear-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-pear-500 px-6 py-3 text-center font-semibold text-pear-950 transition hover:bg-pear-400"
        >
          Join
        </button>
      </div>
      {error ? (
        <p className="text-left text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
