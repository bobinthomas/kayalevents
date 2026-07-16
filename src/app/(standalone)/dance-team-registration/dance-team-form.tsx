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

const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PHOTO_ACCEPT_MIME = ["image/jpeg", "image/png"];
const ID_ACCEPT_MIME = ["image/jpeg", "image/png", "application/pdf"];

const TERMS = [
  "Mandatory Submission: Every dancer who will be performing at the event must individually complete this registration form and submit all required information and supporting documents.",
  "Document Quality Requirements: All uploaded photographs and identification documents must be clear, legible, and of good quality. Blurred, cropped, incomplete, or unreadable submissions may be rejected and may delay accreditation approval.",
  "Age Requirement: All performers must be 15 years of age or older at the time of the event.",
  "Identity Verification Consent: By submitting this form, the performer consents to Kayal Events collecting, storing, and using the uploaded identification documents solely for performer verification, accreditation, backstage access control, security, and event management purposes.",
  "Photography and Promotional Use Consent: By submitting this form, the performer grants Kayal Events permission to use the submitted photographs, as well as photographs and video footage captured during rehearsals and the event, for promotional, marketing, advertising, media, social media, website, and event-related purposes without further notice or compensation.",
  "Accuracy of Information: The performer confirms that all information provided is true, accurate, and complete. Any false or misleading information may result in disqualification from participation.",
  "Backstage Accreditation Requirement: Only performers who have successfully completed this registration process and received approval from Kayal Events will be permitted access to backstage and performer-only areas.",
];

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return /^[+\d][\d\s\-().]+$/.test(v.trim()) && digits.length >= 8;
}

function validateFile(file: File, allowedMime: string[], typeLabel: string): string | null {
  if (!allowedMime.includes(file.type)) {
    return `${typeLabel} must be a JPEG or PNG${allowedMime.includes("application/pdf") ? " image, or a PDF." : " image."}`;
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 5MB.`;
  }
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type SubmitPayload = Record<string, unknown>;

function submitViaXhr(
  payload: SubmitPayload,
  onProgress: (pct: number) => void
): Promise<{ registrationId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/dance-team/submit");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: { error?: string; registrationId?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Unexpected response from server."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && !data.error) {
        resolve({ registrationId: data.registrationId ?? "" });
      } else {
        reject(new Error(data.error ?? "Submission failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error. Please try again."));
    xhr.send(JSON.stringify(payload));
  });
}

type FreshnessCode = {
  code: string;
  issuedAt: string;
  token: string;
  deadline: string | null;
};

type Phase = "closed" | "form" | "submitting" | "success";

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

type PhotoKey = "fullLengthPhoto" | "closeUpPhoto" | "idProof";

export function DanceTeamForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [freshnessCode, setFreshnessCode] = useState<FreshnessCode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [tcsRead, setTcsRead] = useState(false);
  const [agreeAndSubmit, setAgreeAndSubmit] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<Record<PhotoKey, File | null>>({
    fullLengthPhoto: null,
    closeUpPhoto: null,
    idProof: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<PhotoKey, string | null>>({
    fullLengthPhoto: null,
    closeUpPhoto: null,
    idProof: null,
  });

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/dance-team/issue-code")
      .then((r) => r.json())
      .then((data: FreshnessCode) => {
        if (data.deadline && Date.now() > new Date(data.deadline).getTime()) {
          setPhase("closed");
          return;
        }
        setFreshnessCode(data);
      })
      .catch(() => {
        setErrorMsg("Could not load the registration form. Please refresh and try again.");
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
    let error = "";
    if (name === "contactNumber")
      error =
        value && !isValidPhone(value)
          ? "Please enter a valid phone number (e.g. 0412 345 678 or +61 412 345 678)."
          : "";
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  }

  function cls(name: string) {
    return fieldErrors[name] ? inputErrCls : inputCls;
  }

  function handleFileChange(key: PhotoKey, label: string, allowedMime: string[]) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setFileErrors((prev) => ({ ...prev, [key]: null }));
      setFiles((prev) => ({ ...prev, [key]: null }));
      if (!file) return;

      const error = validateFile(file, allowedMime, label);
      if (error) {
        setFileErrors((prev) => ({ ...prev, [key]: error }));
        return;
      }
      setFiles((prev) => ({ ...prev, [key]: file }));
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";

    const errors: Record<string, string> = {};
    const contactNumber = get("contactNumber");
    if (contactNumber && !isValidPhone(contactNumber))
      errors.contactNumber = "Please enter a valid phone number (e.g. 0412 345 678 or +61 412 345 678).";

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    if (!files.fullLengthPhoto || !files.closeUpPhoto || !files.idProof) {
      setErrorMsg("Please upload all 3 required files: full-length photo, close-up photo, and ID proof.");
      return;
    }

    if (!tcsRead) {
      setErrorMsg("Please confirm you have read and agree to the terms and conditions.");
      return;
    }

    if (!agreeAndSubmit) {
      setErrorMsg('Please check "I Agree and Submit" to complete your registration.');
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMsg("Please complete the security check below before submitting.");
      return;
    }

    setErrorMsg(null);
    setPhase("submitting");
    setUploadProgress(0);

    try {
      const [fullLengthPhotoBase64, closeUpPhotoBase64, idProofBase64] = await Promise.all([
        fileToBase64(files.fullLengthPhoto),
        fileToBase64(files.closeUpPhoto),
        fileToBase64(files.idProof),
      ]);

      const result = await submitViaXhr(
        {
          dancerFirstName: get("dancerFirstName"),
          dancerLastName: get("dancerLastName"),
          contactNumber,
          fullLengthPhotoBase64,
          fullLengthPhotoMimeType: files.fullLengthPhoto.type,
          closeUpPhotoBase64,
          closeUpPhotoMimeType: files.closeUpPhoto.type,
          idProofBase64,
          idProofMimeType: files.idProof.type,
          tcsAccepted: tcsRead,
          signatureFullName: get("signatureFullName"),
          signatureDate: get("signatureDate"),
          agreeAndSubmit,
          turnstileToken: turnstileToken ?? "",
          freshnessCode: freshnessCode?.code ?? "",
          issuedAt: freshnessCode?.issuedAt ?? "",
          codeToken: freshnessCode?.token ?? "",
          website: get("website"),
        },
        setUploadProgress
      );

      setRegistrationId(result.registrationId);
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
        <p className="eyebrow">Registration closed</p>
        <p className="mt-3 font-display text-2xl text-sand">Registrations are now closed.</p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-lagoon/30 bg-lagoon/8 p-8 text-center">
        <p className="eyebrow text-lagoon">Registration received</p>
        <p className="mt-3 font-display text-2xl text-sand">Thanks for registering!</p>
        <p className="mt-3 text-sand-muted">
          Your registration reference is <span className="font-mono text-sand">{registrationId}</span>.
        </p>
        <p className="mt-4 text-sm text-sand-muted">
          Backstage accreditation is only granted after Kayal Events reviews and approves your
          registration. We&apos;ll be in touch if we need anything further.
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

        {/* ── Dancer details ── */}
        <section>
          <SectionHeading>Dancer details</SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Dancer first name">
              <input
                type="text"
                name="dancerFirstName"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Dancer last name">
              <input
                type="text"
                name="dancerLastName"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Contact number" error={fieldErrors.contactNumber}>
              <input
                type="tel"
                name="contactNumber"
                required
                disabled={isBusy}
                onBlur={handleBlur}
                className={cls("contactNumber")}
              />
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Documents ── */}
        <section>
          <div className="mb-5">
            <h2 className="eyebrow">Documents</h2>
            <p className="mt-1 text-sm text-sand-muted">
              JPEG or PNG, max 5MB each. Make sure photos are clear and well-lit.
            </p>
          </div>

          <div className="grid gap-5">
            <Field label="Full-length photo" error={fileErrors.fullLengthPhoto ?? undefined}>
              <input
                type="file"
                name="fullLengthPhotoFile"
                accept="image/jpeg,image/png"
                onChange={handleFileChange("fullLengthPhoto", "Full-Length Photo", PHOTO_ACCEPT_MIME)}
                disabled={isBusy}
                className={`${fileErrors.fullLengthPhoto ? inputErrCls : inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-lagoon/20 file:px-3 file:py-1.5 file:text-sand`}
              />
            </Field>

            <Field label="Close-up photo" error={fileErrors.closeUpPhoto ?? undefined}>
              <input
                type="file"
                name="closeUpPhotoFile"
                accept="image/jpeg,image/png"
                onChange={handleFileChange("closeUpPhoto", "Close-Up Photo", PHOTO_ACCEPT_MIME)}
                disabled={isBusy}
                className={`${fileErrors.closeUpPhoto ? inputErrCls : inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-lagoon/20 file:px-3 file:py-1.5 file:text-sand`}
              />
            </Field>

            <Field label="ID proof" hint="(JPEG, PNG, or PDF)" error={fileErrors.idProof ?? undefined}>
              <input
                type="file"
                name="idProofFile"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange("idProof", "ID Proof", ID_ACCEPT_MIME)}
                disabled={isBusy}
                className={`${fileErrors.idProof ? inputErrCls : inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-lagoon/20 file:px-3 file:py-1.5 file:text-sand`}
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

        {/* ── Terms & Conditions ── */}
        <section className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="eyebrow mb-4">Terms &amp; conditions</h2>
          <p className="mb-3 text-sm text-sand-muted">
            Please read the following carefully before submitting this form:
          </p>
          <ol className="mb-5 space-y-3 text-sm text-sand-muted">
            {TERMS.map((point, i) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-lagoon" aria-hidden="true">
                  {i + 1}.
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={tcsRead}
              onChange={(e) => setTcsRead(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 h-4 w-4 shrink-0 accent-lagoon disabled:opacity-50"
            />
            <span className="text-sm text-sand">
              I have read and agree to the terms and conditions outlined above.
            </span>
          </label>
        </section>

        {/* ── Signature / final acceptance ── */}
        <section className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="eyebrow mb-4">Digital acceptance</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <input
                type="text"
                name="signatureFullName"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Date">
              <input
                type="date"
                name="signatureDate"
                defaultValue={today}
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreeAndSubmit}
              onChange={(e) => setAgreeAndSubmit(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 h-4 w-4 shrink-0 accent-lagoon disabled:opacity-50"
            />
            <span className="text-sm text-sand">I Agree and Submit.</span>
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

        {/* ── Progress ── */}
        {isBusy && (
          <div className="rounded-full bg-surface-raised">
            <div
              className="h-2 rounded-full bg-lagoon transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isBusy || !tcsRead || !agreeAndSubmit || !freshnessCode}
            className="gradient-border coral-glow rounded-full bg-coral px-8 py-4 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {phase === "submitting" ? `Uploading… ${uploadProgress}%` : "Submit Registration"}
          </button>
        </div>

        <p className="text-xs text-sand-muted">
          Questions? Email{" "}
          <a href="mailto:kayaleventsofficial@gmail.com" className="text-lagoon underline">
            kayaleventsofficial@gmail.com
          </a>
        </p>
      </form>
    </>
  );
}
