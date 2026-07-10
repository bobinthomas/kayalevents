"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { TermsModal } from "./terms-modal";

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

const VIDEO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_DURATION_SECONDS = 90;
const VIDEO_ACCEPT_MIME = ["video/mp4", "video/quicktime"];

const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return /^[+\d][\d\s\-().]+$/.test(v.trim()) && digits.length >= 8;
}

function isValidDriveLink(v: string) {
  return /drive\.google\.com/i.test(v.trim());
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata."));
    };
    video.src = url;
  });
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
): Promise<{ entryId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/reel-contest/submit");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: { error?: string; entryId?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Unexpected response from server."));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && !data.error) {
        resolve({ entryId: data.entryId ?? "" });
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
  deadline: string;
};

type Phase = "closed" | "form" | "submitting" | "success";
type UploadMode = "file" | "link";

const inputCls =
  "w-full rounded-xl border border-border bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black disabled:opacity-50";

const inputErrCls =
  "w-full rounded-xl border border-red-500/60 bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:ring-offset-1 focus:ring-offset-marine-black disabled:opacity-50";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-5">{children}</h2>;
}

function Field({
  label,
  labelMl,
  hint,
  error,
  children,
}: {
  label: string;
  labelMl?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-sand-muted">
        {label}
        {labelMl && <span className="ml-1.5 text-sand-muted/60">· {labelMl}</span>}
        {hint && <span className="ml-1 text-sand-muted/60">{hint}</span>}
      </span>
      <div className={error ? "rounded-xl" : "gradient-border rounded-xl"}>{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function ReelContestForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [freshnessCode, setFreshnessCode] = useState<FreshnessCode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [entryId, setEntryId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [tcsAccepted, setTcsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reel-contest/issue-code")
      .then((r) => r.json())
      .then((data: FreshnessCode) => {
        if (Date.now() > new Date(data.deadline).getTime()) {
          setPhase("closed");
          return;
        }
        setFreshnessCode(data);
      })
      .catch(() => {
        setErrorMsg("Could not load the entry form. Please refresh and try again.");
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
    if (name === "email") error = value && !isValidEmail(value) ? "Please enter a valid email address." : "";
    if (name === "phone")
      error =
        value && !isValidPhone(value)
          ? "Please enter a valid phone number (e.g. 0412 345 678 or +61 412 345 678)."
          : "";
    if (name === "driveLink")
      error = value && !isValidDriveLink(value) ? "Must be a drive.google.com share link." : "";
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  }

  function cls(name: string) {
    return fieldErrors[name] ? inputErrCls : inputCls;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    setSelectedFile(null);
    if (!file) return;

    if (!VIDEO_ACCEPT_MIME.includes(file.type)) {
      setFileError("Only MP4 or MOV files are accepted.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setFileError(
        `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 10MB. Use the Google Drive link option instead.`
      );
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_DURATION_SECONDS + 2) {
        setFileError(`Video is ${Math.round(duration)}s — max is 90 seconds. Trim it and try again.`);
        return;
      }
    } catch {
      // Couldn't read metadata (unusual codec/browser) — let the server be the final check.
    }

    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";

    const errors: Record<string, string> = {};
    const email = get("email");
    const phone = get("phone");
    const driveLink = get("driveLink");
    if (email && !isValidEmail(email)) errors.email = "Please enter a valid email address.";
    if (phone && !isValidPhone(phone))
      errors.phone = "Please enter a valid phone number (e.g. 0412 345 678 or +61 412 345 678).";
    if (uploadMode === "link" && driveLink && !isValidDriveLink(driveLink))
      errors.driveLink = "Must be a drive.google.com share link.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    if (uploadMode === "file" && !selectedFile) {
      setErrorMsg("Choose a video file to upload, or switch to the Google Drive link option.");
      return;
    }
    if (uploadMode === "link" && !driveLink) {
      setErrorMsg("Paste your Google Drive share link.");
      return;
    }

    if (!get("team")) {
      setErrorMsg("Choose Team Mohanlal or Team Chithra.");
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
      let videoBase64 = "";
      let videoMimeType = "";
      let videoFileName = "";
      if (uploadMode === "file" && selectedFile) {
        videoBase64 = await fileToBase64(selectedFile);
        videoMimeType = selectedFile.type;
        videoFileName = selectedFile.name;
      }

      const result = await submitViaXhr(
        {
          fullName: get("fullName"),
          email,
          phone,
          state: get("state"),
          team: get("team"),
          description: get("description"),
          videoBase64,
          videoMimeType,
          videoFileName,
          driveLink: uploadMode === "link" ? driveLink : "",
          turnstileToken: turnstileToken ?? "",
          tcsAccepted,
          freshnessCode: freshnessCode?.code ?? "",
          issuedAt: freshnessCode?.issuedAt ?? "",
          codeToken: freshnessCode?.token ?? "",
          website: get("website"),
        },
        setUploadProgress
      );

      setEntryId(result.entryId);
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
        <p className="eyebrow">Entries closed</p>
        <p className="mt-3 font-display text-2xl text-sand">Submissions are now closed.</p>
        <p className="mt-2 text-sand-muted">
          The deadline was 18 July 2026, 11:59 pm AEST. Winners will be announced from
          3 August 2026 on our official Instagram and Facebook pages.
        </p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-lagoon/30 bg-lagoon/8 p-8 text-center">
        <p className="eyebrow text-lagoon">Entry received</p>
        <p className="mt-3 font-display text-2xl text-sand">Thanks for entering #KayalReelFest!</p>
        <p className="mt-3 text-sand-muted">
          Your entry reference is <span className="font-mono text-sand">{entryId}</span>.
        </p>
        <p className="mt-4 text-sm text-sand-muted">
          Follow{" "}
          <a
            href="https://instagram.com/kayalevents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lagoon underline"
          >
            @kayalevents
          </a>{" "}
          — featured entries and the Team Mohanlal vs Team Chithra scoreboard will be posted
          there throughout the contest.
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

        {/* ── About you ── */}
        <section>
          <SectionHeading>About you</SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" labelMl="പേര്">
              <input
                type="text"
                name="fullName"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Email" labelMl="ഇമെയിൽ" error={fieldErrors.email}>
              <input
                type="email"
                name="email"
                required
                disabled={isBusy}
                onBlur={handleBlur}
                className={cls("email")}
              />
            </Field>

            <Field label="Phone" labelMl="ഫോൺ" error={fieldErrors.phone}>
              <input
                type="tel"
                name="phone"
                required
                disabled={isBusy}
                onBlur={handleBlur}
                className={cls("phone")}
              />
            </Field>

            <Field label="State / territory" labelMl="സംസ്ഥാനം">
              <select name="state" required disabled={isBusy} className={inputCls}>
                <option value="">Select…</option>
                {AU_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Team ── */}
        <section>
          <SectionHeading>Pick your team · ടീം തിരഞ്ഞെടുക്കുക</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                value: "Mohanlal",
                title: "Team Lalettan",
                desc: "Dialogues, iconic scenes, dance to his songs.",
              },
              {
                value: "Chithra",
                title: "Team ChithraChechi",
                desc: "Melodies, lip-syncs, creative videos to K.S. Chithra songs.",
              },
            ].map((t) => (
              <label
                key={t.value}
                className="gradient-border flex cursor-pointer flex-col gap-1.5 rounded-xl p-4 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="team"
                    value={t.value}
                    required
                    disabled={isBusy}
                    className="accent-lagoon"
                  />
                  <span className="font-display text-lg text-sand">{t.title}</span>
                </span>
                <span className="text-xs text-sand-muted">{t.desc}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="hairline" />

        {/* ── Your reel ── */}
        <section>
          <div className="mb-5">
            <h2 className="eyebrow">Your reel · നിങ്ങളുടെ റീൽ</h2>
            <p className="mt-1 text-sm text-sand-muted">
              Up to 60 seconds, portrait preferred, MP4 or MOV. Under 10MB, upload it
              directly — larger files, share a Google Drive link instead (set sharing to
              &ldquo;Anyone with the link can view&rdquo;).
            </p>
          </div>

          <div className="mb-4 flex gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="uploadMode"
                checked={uploadMode === "file"}
                onChange={() => setUploadMode("file")}
                disabled={isBusy}
                className="accent-lagoon"
              />
              Upload video (max 10MB)
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="uploadMode"
                checked={uploadMode === "link"}
                onChange={() => setUploadMode("link")}
                disabled={isBusy}
                className="accent-lagoon"
              />
              I have a Google Drive link
            </label>
          </div>

          {uploadMode === "file" ? (
            <Field label="Video file" error={fileError ?? undefined}>
              <input
                type="file"
                name="videoFile"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                disabled={isBusy}
                className={`${fileError ? inputErrCls : inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-lagoon/20 file:px-3 file:py-1.5 file:text-sand`}
              />
            </Field>
          ) : (
            <Field label="Google Drive link" error={fieldErrors.driveLink}>
              <input
                type="url"
                name="driveLink"
                placeholder="https://drive.google.com/…"
                onBlur={handleBlur}
                disabled={isBusy}
                className={cls("driveLink")}
              />
            </Field>
          )}

          {selectedFile && !fileError && (
            <p className="mt-2 text-xs text-lagoon">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB) ready to
              upload.
            </p>
          )}

          <div className="mt-5">
            <Field label="Short description" hint="(optional)" labelMl="ഒരു ചെറിയ വിവരണം">
              <textarea
                name="description"
                rows={3}
                disabled={isBusy}
                placeholder="What's in your reel?"
                className={inputCls}
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
          {tcsAccepted ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-sand">
                <span className="text-lagoon">✓</span> You&apos;ve read and
                accepted the Terms &amp; Conditions.
              </p>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                disabled={isBusy}
                className="text-xs text-lagoon underline disabled:opacity-50"
              >
                Review
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-sand-muted">
                You must read the full Terms &amp; Conditions before entering —
                confirms you are an Australian resident aged 18 or over.
              </p>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                disabled={isBusy}
                className="gradient-border rounded-full border border-lagoon px-6 py-2.5 text-sm font-semibold text-sand transition hover:bg-lagoon/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Read &amp; Accept Terms &amp; Conditions
              </button>
            </div>
          )}
        </section>

        <TermsModal
          open={showTerms}
          alreadyAccepted={tcsAccepted}
          onClose={() => setShowTerms(false)}
          onAccept={() => {
            setTcsAccepted(true);
            setShowTerms(false);
          }}
        />

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
            disabled={isBusy || !tcsAccepted || !freshnessCode}
            className="gradient-border coral-glow rounded-full bg-coral px-8 py-4 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {phase === "submitting" ? `Uploading… ${uploadProgress}%` : "Submit Entry"}
          </button>
          <p className="text-xs text-sand-muted">Entries close: 18 July 2026, 11:59 pm AEST</p>
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
