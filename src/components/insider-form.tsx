"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

export function InsiderForm({
  source = "general",
  heading = "Join Kayal Insider",
  subheading = "Presale access, first announcements, and member pricing — before anyone else.",
  buttonLabel = "Get Presale Access",
}: {
  source?: string;
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    try {
      const res = await fetch("/api/insider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          phone: data.get("phone"),
          source,
          website: data.get("website"), // honeypot
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      track("insider_signup", { source });
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-6 text-center">
        <p className="font-display text-xl text-gold">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-ivory-muted">
          Check your inbox to confirm your subscription — presale access follows.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="font-display text-2xl text-ivory">{heading}</p>
      <p className="text-sm text-ivory-muted">{subheading}</p>
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            required
            placeholder="Email address"
            className="w-full rounded-full border border-ink-border bg-ink px-5 py-3 text-sm text-ivory placeholder:text-ivory-muted/60 focus:border-gold"
          />
        </label>
        <label className="flex-1">
          <span className="sr-only">Mobile (optional)</span>
          <input
            type="tel"
            name="phone"
            placeholder="Mobile (optional)"
            className="w-full rounded-full border border-ink-border bg-ink px-5 py-3 text-sm text-ivory placeholder:text-ivory-muted/60 focus:border-gold"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-bright disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Joining…" : buttonLabel}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          Something went wrong — please try again.
        </p>
      )}
      <p className="text-xs text-ivory-muted/70">
        By joining you consent to receive event updates from Kayal Events.
        Unsubscribe anytime. See our privacy policy.
      </p>
    </form>
  );
}
