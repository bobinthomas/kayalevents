"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-border bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black";

/**
 * Ticket enquiry modal — shown in place of a "Buy Tickets" link when an
 * event has no ticket URL set up yet. Posts to /api/event-inquiry.
 */
export function EventEnquiryModal({
  eventName,
  onClose,
}: {
  eventName: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    nameInputRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, select'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          website: data.get("website"), // honeypot
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      track("inquiry_submit", { event_name: eventName, placement: "event_enquiry_modal" });
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-marine-black/80 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-enquiry-heading"
        className="gradient-border w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Enquiry</p>
            <h2 id="event-enquiry-heading" className="headline mt-1 text-2xl text-sand">
              {eventName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-sand-muted transition hover:bg-white/5 hover:text-sand"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M1 1l14 14M15 1L1 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-lagoon/30 bg-lagoon/8 p-6 text-center">
            <p className="font-display text-xl text-lagoon">Thanks — we&apos;ve got it.</p>
            <p className="mt-2 text-sm text-sand-muted">
              We&apos;ll come back to you within one business day.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <label className="block">
              <span className="mb-1.5 block text-sm text-sand-muted">Name *</span>
              <div className="gradient-border rounded-xl">
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  required
                  className={inputClass}
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-sand-muted">Email *</span>
              <div className="gradient-border rounded-xl">
                <input type="email" name="email" required className={inputClass} />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-sand-muted">Phone</span>
              <div className="gradient-border rounded-xl">
                <input type="tel" name="phone" className={inputClass} />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-sand-muted">Message</span>
              <div className="gradient-border rounded-xl">
                <textarea
                  name="message"
                  rows={3}
                  placeholder="How many tickets, which date, any questions…"
                  className={inputClass}
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="gradient-border coral-glow w-full rounded-full bg-coral px-7 py-3 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send Enquiry"}
            </button>
            {status === "error" && (
              <p role="alert" className="text-sm text-coral">
                Something went wrong — please try again, or reach us on WhatsApp.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
