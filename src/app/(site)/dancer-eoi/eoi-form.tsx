"use client";

import Script from "next/script";
import { useRef, useState } from "react";

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

const VIDEO_MAX_SECONDS = 30;
const VIDEO_MAX_MB = 50;
const ALLOWED_MIME = ["video/mp4", "video/quicktime", "video/webm"];

type Phase =
  | "form"
  | "uploading"
  | "submitting"
  | "success"
  | "error";

type UploadSession = {
  sessionUri: string;
  submissionId: string;
};

const inputCls =
  "w-full rounded-xl border border-border bg-marine-black px-4 py-3 text-sm text-sand placeholder:text-sand-muted/50 transition-colors focus:border-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon/50 focus:ring-offset-1 focus:ring-offset-marine-black disabled:opacity-50";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-5">{children}</h2>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-sand-muted">
        {label}
        {hint && <span className="ml-1 text-sand-muted/60">{hint}</span>}
      </span>
      <div className="gradient-border rounded-xl">{children}</div>
    </label>
  );
}

async function uploadChunked(
  file: File,
  sessionUri: string,
  onProgress: (pct: number) => void
): Promise<string> {
  const CHUNK = 5 * 1024 * 1024;
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK, file.size);
    const chunk = file.slice(offset, end);

    // Proxy through our server — Google Drive's resumable upload API
    // doesn't include CORS headers, so direct browser PUTs are blocked.
    const res = await fetch("/api/eoi/upload-chunk", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-session-uri": sessionUri,
        "x-content-range": `bytes ${offset}-${end - 1}/${file.size}`,
      },
      body: chunk,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `Upload error (${res.status}).`);
    }

    const result = (await res.json()) as {
      done: boolean;
      id?: string;
      nextOffset?: number;
    };

    if (result.done && result.id) {
      onProgress(100);
      return result.id;
    }

    offset = result.nextOffset ?? end;
    onProgress(Math.round((offset / file.size) * 100));
  }

  throw new Error("Upload ended without a file ID.");
}

export function EOIForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoLastModified, setVideoLastModified] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [declared, setDeclared] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVideoError(null);
    setVideoFile(null);
    setVideoDuration(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      setVideoError("Please upload an MP4, MOV, or WebM video.");
      return;
    }

    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setVideoError(`Video must be under ${VIDEO_MAX_MB} MB. Yours is ${(file.size / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (vid.duration > VIDEO_MAX_SECONDS) {
        setVideoError(`Video must be ${VIDEO_MAX_SECONDS}s or shorter. Yours is ${Math.round(vid.duration)}s.`);
        return;
      }
      setVideoFile(file);
      setVideoDuration(vid.duration);
      setVideoLastModified(file.lastModified);
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      setVideoError("Could not read this video. Please try another file.");
    };
    vid.src = url;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";

    // At least one performance link required
    if (!get("linkInstagram") && !get("linkYoutube") && !get("linkOther")) {
      setErrorMsg("Provide at least one performance link — Instagram, YouTube, or other.");
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMsg("Please complete the security check below before submitting.");
      return;
    }

    setErrorMsg(null);

    let videoFileId = "";
    let sid = "";

    try {
      if (videoFile) {
        // Create Drive upload session
        setPhase("uploading");
        setUploadPct(0);

        const sessionRes = await fetch("/api/eoi/create-upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: videoFile.name,
            contentType: videoFile.type,
            fileSize: videoFile.size,
            groupName: get("groupName"),
          }),
        });

        if (!sessionRes.ok) {
          const err = (await sessionRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Could not start upload. Please try again.");
        }

        const session = (await sessionRes.json()) as UploadSession;
        sid = session.submissionId;

        videoFileId = await uploadChunked(videoFile, session.sessionUri, setUploadPct);
      }

      // Submit form data
      setPhase("submitting");

      const submitRes = await fetch("/api/eoi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: sid,
          groupName: get("groupName"),
          profileAbout: get("profileAbout"),
          achievements: get("achievements"),
          numPerformers: get("numPerformers"),
          contactName: get("contactName"),
          contactEmail: get("contactEmail"),
          contactPhone: get("contactPhone"),
          linkInstagram: get("linkInstagram"),
          linkYoutube: get("linkYoutube"),
          linkOther: get("linkOther"),
          videoFileId,
          videoLastModified: videoFile?.lastModified ?? null,
          turnstileToken: turnstileToken ?? "",
          declarationChecked: declared,
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
          <a
            href="mailto:kayaleventsofficial@gmail.com"
            className="text-lagoon underline"
          >
            kayaleventsofficial@gmail.com
          </a>{" "}
          and include your reference number.
        </p>
      </div>
    );
  }

  const isBusy = phase === "uploading" || phase === "submitting";

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

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-10" noValidate>
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

            <Field label="Email *">
              <input
                type="email"
                name="contactEmail"
                required
                disabled={isBusy}
                className={inputCls}
              />
            </Field>

            <Field label="Phone *">
              <input
                type="tel"
                name="contactPhone"
                required
                disabled={isBusy}
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
            <p className="mt-1 text-sm text-sand-muted">At least one is required.</p>
          </div>
          <div className="space-y-5">
            <Field label="Instagram">
              <input
                type="url"
                name="linkInstagram"
                disabled={isBusy}
                placeholder="https://instagram.com/yourgroup"
                className={inputCls}
              />
            </Field>

            <Field label="YouTube">
              <input
                type="url"
                name="linkYoutube"
                disabled={isBusy}
                placeholder="https://youtube.com/@yourgroup"
                className={inputCls}
              />
            </Field>

            <Field label="Other" hint="(optional)">
              <input
                type="url"
                name="linkOther"
                disabled={isBusy}
                placeholder="Facebook, website, TikTok…"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <div className="hairline" />

        {/* ── Video ── */}
        <section>
          <div className="mb-4">
            <h2 className="eyebrow">Recent performance video</h2>
            <p className="mt-1 text-sm text-sand-muted">
              Upload a recent clip of your group performing — ideally shot within the last
              week. Or share a link in the Performance Links section above. Either works.
            </p>
            <p className="mt-1 text-xs text-sand-muted/60">
              MP4, MOV, or WebM · max {VIDEO_MAX_SECONDS}s · max {VIDEO_MAX_MB} MB
            </p>
          </div>

          <label className="block cursor-pointer">
            <input
              type="file"
              name="videoInput"
              accept={ALLOWED_MIME.join(",")}
              onChange={handleVideoChange}
              disabled={isBusy}
              className="hidden"
            />
            <div
              className={`gradient-border rounded-xl border border-dashed p-6 text-center transition-colors ${
                videoFile
                  ? "border-lagoon/50 bg-lagoon/5"
                  : "border-border bg-marine-black hover:border-lagoon/50"
              } ${isBusy ? "pointer-events-none opacity-50" : ""}`}
            >
              {videoFile ? (
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-lagoon">{videoFile.name}</p>
                  <p className="text-xs text-sand-muted">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    {videoDuration !== null && ` · ${Math.round(videoDuration)}s`}
                  </p>
                  <p className="text-xs text-sand-muted/60">Tap to change</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-sand">Tap to choose your video</p>
                  <p className="text-xs text-sand-muted">Optional — or share a link above</p>
                </div>
              )}
            </div>
          </label>

          {videoError && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {videoError}
            </p>
          )}

          {phase === "uploading" && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-sand-muted">
                <span>Uploading video…</span>
                <span>{uploadPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-lagoon transition-all duration-300"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          )}
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
            disabled={isBusy || !!videoError || !declared}
            className="gradient-border coral-glow rounded-full bg-coral px-8 py-4 text-sm font-semibold tracking-wide text-sand transition-all hover:scale-[1.02] hover:bg-coral-bright disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {phase === "uploading"
              ? `Uploading… ${uploadPct}%`
              : phase === "submitting"
              ? "Submitting…"
              : "Submit Application"}
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
