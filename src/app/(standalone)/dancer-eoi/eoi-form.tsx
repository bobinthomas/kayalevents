"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          appearance?: "always" | "execute" | "interaction-only";
          callback: (token: string) => void;
          "expired-callback": () => void;
        }
      ) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return /^[+\d][\d\s\-().]+$/.test(v.trim()) && digits.length >= 8;
}

function isValidUrl(v: string) {
  if (!v) return true;
  try {
    const url = new URL(v.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateField(name: string, value: string): string {
  switch (name) {
    case "contactEmail":
      return value && !isValidEmail(value) ? "Please enter a valid email address." : "";
    case "contactPhone":
      return value && !isValidPhone(value)
        ? "Please enter a valid phone number (e.g. 0412 345 678 or +61 412 345 678)."
        : "";
    case "linkInstagram":
    case "linkYoutube":
    case "linkOther":
      return value && !isValidUrl(value)
        ? "Must be a valid URL starting with https:// or http://."
        : "";
    default:
      return "";
  }
}

type FreshnessCode = {
  code: string;
  issuedAt: string;
  token: string;
  deadline: string;
};

type Phase = "closed" | "form" | "submitting" | "success" | "error";

const inputCls =
  "w-full rounded-xl border border-border bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black disabled:opacity-50";

const inputErrCls =
  "w-full rounded-xl border border-red-500/60 bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:ring-offset-1 focus:ring-offset-marine-black disabled:opacity-50";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-5">{children}</h2>;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-sand-muted">
        {label}
        {hint && <span className="ml-1 text-sand-muted/60">{hint}</span>}
      </span>
      <div className={error ? "rounded-xl" : "gradient-border rounded-xl"}>{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function EOIForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [freshnessCode, setFreshnessCode] = useState<FreshnessCode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [declared, setDeclared] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/eoi/issue-code")
      .then((r) => r.json())
      .then((data: FreshnessCode) => {
        if (Date.now() > new Date(data.deadline).getTime()) {
          setPhase("closed");
          return;
        }
        setFreshnessCode(data);
      })
      .catch(() => {
        setErrorMsg("Could not load the application form. Please refresh and try again.");
      });
  }, []);

  function handleTurnstileLoad() {
    if (turnstileRef.current && window.turnstile && TURNSTILE_SITE_KEY) {
      window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "always",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
      });
      setTurnstileReady(true);
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  }

  function cls(name: string) {
    return fieldErrors[name] ? inputErrCls : inputCls;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";

    // Run all field validations up-front (catches un-blurred fields)
    const blurFields = ["contactEmail", "contactPhone", "linkInstagram", "linkYoutube", "linkOther"];
    const errors: Record<string, string> = {};
    for (const name of blurFields) {
      const err = validateField(name, get(name));
      if (err) errors[name] = err;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    if (!get("linkInstagram") && !get("linkYoutube") && !get("linkOther")) {
      setErrorMsg("Provide at least one performance link — Instagram, YouTube, or other.");
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMsg("Please complete the security check below before submitting.");
      return;
    }

    setErrorMsg(null);
    setPhase("submitting");

    try {
      const submitRes = await fetch("/api/eoi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: get("groupName"),
          profileAbout: get("profileAbout"),
          achievements: get("achievements"),
          numPerformers: get("numPerformers"),
          contactName: get("contactName"),
          contactEmail: get("contactEmail"),
          contactPhone: get("contactPhone"),
          location: get("location"),
          linkInstagram: get("linkInstagram"),
          linkYoutube: get("linkYoutube"),
          linkOther: get("linkOther"),
          turnstileToken: turnstileToken ?? "",
          declarationChecked: declared,
          freshnessCode: freshnessCode?.code ?? "",
          issuedAt: freshnessCode?.issuedAt ?? "",
          codeToken: freshnessCode?.token ?? "",
        }),
      });

      if (!submitRes.ok) {
        const err = (await submitRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Submission failed. Please try again.");
      }

      const result = (await submitRes.json()) as { submissionId: string };
      setSubmissionId(result.submissionId);
      setPhase("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setPhase("form");
    }
  }

  // ─── States ────────────────────────────────────────────────────────────────

  if (phase === "closed") {
    return (
      <div className="rounded-2xl border border-border bg-surface-raised p-8 text-center">
        <p className="eyebrow">Applications closed</p>
        <p className="mt-3 font-display text-2xl text-sand">Submissions are now closed.</p>
        <p className="mt-2 text-sand-muted">
          The deadline was 8 July 2026, 5 pm AEST. Thank you to everyone who applied — the
          panel will be in touch with selected groups.
        </p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-lagoon/30 bg-lagoon/8 p-8 text-center">
        <p className="eyebrow text-lagoon">Application received</p>
        <p className="mt-3 font-display text-2xl text-sand">Thank you for applying.</p>
        <p className="mt-3 text-sand-muted">
          A confirmation email is on its way. Your reference number is{" "}
          <span className="font-mono text-sand">{submissionId}</span>.
        </p>
        <p className="mt-4 text-sm text-sand-muted">
          The panel will contact shortlisted groups by email after the deadline. If you have a
          question, email{" "}
          <a href="mailto:kayaleventsofficial@gmail.com" className="text-lagoon underline">
            kayaleventsofficial@gmail.com
          </a>{" "}
          and include your reference number.
        </p>
      </div>
    );
  }

  const isBusy = phase === "submitting";

  // ─── Form ──────────────────────────────────────────────────────────────────

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={handleTurnstileLoad}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-10" noValidate>
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {/* ── About your group ── */}
        <section>
          <SectionHeading>About your group</SectionHeading>
          <div className="space-y-5">
            <Field label="Group name *">
              <input
                type="text"
                name="groupName"
                required
                disabled={isBusy}
                placeholder="e.g. Nrityam Dance Company"
                className={inputCls}
              />
            </Field>

            <Field label="About the group *">
              <textarea
                name="profileAbout"
                required
                disabled={isBusy}
                rows={4}
                placeholder="Your style, how long you've been together, what makes your group unique…"
                className={inputCls}
              />
            </Field>

            <Field label="Achievements and past performances *">
              <textarea
                name="achievements"
                required
                disabled={isBusy}
                rows={4}
                placeholder="Awards, notable shows, competitions, festivals…"
                className={inputCls}
              />
            </Field>

            <Field label="Number of performers *">
              <input
                type="number"
                name="numPerformers"
                required
                min={1}
                disabled={isBusy}
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Contact ── */}
        <section>
          <SectionHeading>Contact person</SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name *">
              <input
                type="text"
                name="contactName"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Email *" error={fieldErrors.contactEmail}>
              <input
                type="email"
                name="contactEmail"
                required
                disabled={isBusy}
                onBlur={handleBlur}
                className={cls("contactEmail")}
              />
            </Field>

            <Field label="Phone *" error={fieldErrors.contactPhone}>
              <input
                type="tel"
                name="contactPhone"
                required
                disabled={isBusy}
                onBlur={handleBlur}
                className={cls("contactPhone")}
              />
            </Field>

            <Field label="Location *" hint="(city / state)">
              <input
                type="text"
                name="location"
                required
                disabled={isBusy}
                placeholder="e.g. Melbourne, VIC"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Performance links ── */}
        <section>
          <div className="mb-5">
            <h2 className="eyebrow">Performance links</h2>
            <p className="mt-1 text-sm text-sand-muted">
              Add a link to your most recent performance video — YouTube, Instagram, or any
              other platform. At least one is required.
            </p>
          </div>
          <div className="space-y-5">
            <Field label="Instagram" error={fieldErrors.linkInstagram}>
              <input
                type="url"
                name="linkInstagram"
                disabled={isBusy}
                placeholder="https://instagram.com/yourgroup"
                onBlur={handleBlur}
                className={cls("linkInstagram")}
              />
            </Field>

            <Field label="YouTube" error={fieldErrors.linkYoutube}>
              <input
                type="url"
                name="linkYoutube"
                disabled={isBusy}
                placeholder="https://youtube.com/@yourgroup"
                onBlur={handleBlur}
                className={cls("linkYoutube")}
              />
            </Field>

            <Field label="Other" hint="(optional)" error={fieldErrors.linkOther}>
              <input
                type="url"
                name="linkOther"
                disabled={isBusy}
                placeholder="Facebook, website, TikTok, Google Drive link…"
                onBlur={handleBlur}
                className={cls("linkOther")}
              />
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Turnstile ── */}
        {TURNSTILE_SITE_KEY && (
          <div>
            <div ref={turnstileRef} />
            {!turnstileReady && (
              <p className="mt-1 text-xs text-sand-muted/60">Loading security check…</p>
            )}
          </div>
        )}

        {/* ── Declaration ── */}
        <section className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="eyebrow mb-4">Declaration</h2>
          <ul className="mb-5 space-y-2 text-sm text-sand-muted">
            {[
              "EOI submissions will be reviewed by our selection panel.",
              "Selected groups will be contacted directly by the organizers.",
              "The panel's decision will be final.",
              "Terms and conditions will apply to all selected groups.",
              "Submission of an EOI does not guarantee selection for the event.",
              "No enquiries will be accepted via Instagram, Facebook, phone calls, or text messages.",
              "Only email correspondence will be considered.",
            ].map((point) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-0.5 text-lagoon" aria-hidden="true">›</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 h-4 w-4 shrink-0 accent-lagoon disabled:opacity-50"
            />
            <span className="text-sm text-sand">
              I have read and understood all of the above, and I agree to these terms.
            </span>
          </label>
        </section>

        {/* ── Error ── */}
        {errorMsg && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {errorMsg}
          </p>
        )}

        {/* ── Submit ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isBusy || !declared || !freshnessCode}
            className="gradient-border coral-glow rounded-full bg-coral px-8 py-4 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {phase === "submitting" ? "Submitting…" : "Submit Application"}
          </button>
          <p className="text-xs text-sand-muted">
            Deadline: 8 July 2026, 5 pm AEST
          </p>
        </div>

        <p className="text-xs text-sand-muted">
          Questions? Email{" "}
          <a
            href="mailto:kayaleventsofficial@gmail.com"
            className="text-lagoon underline"
          >
            kayaleventsofficial@gmail.com
          </a>{" "}
          — panel contact for selected groups only.
        </p>
      </form>
    </>
  );
}
