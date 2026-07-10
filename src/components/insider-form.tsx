"use client";

import Link from "next/link";
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
      <div className="gradient-border rounded-xl border border-lagoon/30 bg-lagoon/8 p-6 text-center">
        <p className="font-display text-xl text-lagoon">
          You&apos;re on the list.
        </p>
        <p className="mt-2 text-sm text-sand-muted">
          Check your inbox to confirm your subscription — presale access follows.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="font-display text-2xl text-sand">{heading}</p>
      <p className="text-sm text-sand-muted">{subheading}</p>
      {/* Honeypot — hidden from real users, catches bots */}
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
          <div className="gradient-border rounded-full">
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              aria-describedby={status === "error" ? "insider-error" : undefined}
              className="w-full rounded-full border border-border bg-marine-black px-5 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black"
            />
          </div>
        </label>
        <label className="flex-1">
          <span className="sr-only">Mobile (optional)</span>
          <div className="gradient-border rounded-full">
            <input
              type="tel"
              name="phone"
              placeholder="Mobile (optional)"
              className="w-full rounded-full border border-border bg-marine-black px-5 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black"
            />
          </div>
        </label>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="gradient-border w-full rounded-full border border-lagoon/40 bg-lagoon/12 px-6 py-3 text-sm font-semibold text-lagoon transition-all hover:bg-lagoon/20 disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Joining…" : buttonLabel}
      </button>
      {status === "error" && (
        <p id="insider-error" role="alert" className="text-sm text-coral">
          Something went wrong — please try again.
        </p>
      )}
      <p className="text-xs text-sand-muted/60">
        By joining you consent to receive event updates from Kayal Events.
        Unsubscribe anytime. See our{" "}
        <Link href="/privacy" className="underline hover:text-sand-muted">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
