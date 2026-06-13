"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-border bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none";

export function InquiryForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      track("inquiry_submit", { event_type: String(data.eventType ?? "") });
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-lagoon/30 bg-lagoon/8 p-8 text-center">
        <p className="font-display text-2xl text-lagoon">Inquiry received.</p>
        <p className="mt-2 text-sand-muted">
          We&apos;ll come back to you within one business day — usually sooner.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">Name *</span>
          <input type="text" name="name" required className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">Email *</span>
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">Phone</span>
          <input type="tel" name="phone" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">Event type *</span>
          <select name="eventType" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select…
            </option>
            <option value="concert">Concert / live show</option>
            <option value="corporate">Corporate event</option>
            <option value="private">Private event / wedding</option>
            <option value="community">Community / festival</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">Preferred date</span>
          <input type="date" name="preferredDate" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand-muted">City</span>
          <select name="city" defaultValue="" className={inputClass}>
            <option value="">Select…</option>
            {["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Other"].map(
              (c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-sand-muted">
          Budget range (optional)
        </span>
        <select name="budget" defaultValue="" className={inputClass}>
          <option value="">Prefer not to say</option>
          <option value="under-10k">Under $10k</option>
          <option value="10k-25k">$10k – $25k</option>
          <option value="25k-50k">$25k – $50k</option>
          <option value="50k-100k">$50k – $100k</option>
          <option value="100k-plus">$100k+</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-sand-muted">
          Tell us about your event *
        </span>
        <textarea name="message" required rows={5} className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="coral-glow w-full rounded-full bg-coral px-8 py-3.5 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Sending…" : "Send Inquiry"}
      </button>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          Something went wrong — please try again, or reach us on WhatsApp.
        </p>
      )}
    </form>
  );
}
