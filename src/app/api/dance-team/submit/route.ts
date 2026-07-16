import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5MB — mirrors Config.gs PHOTO_MAX_BYTES
const PHOTO_ALLOWED_MIME = ["image/jpeg", "image/png"];
const ID_ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = getRuntimeEnv("TURNSTILE_SECRET") ?? "";
  if (!secret) return true; // skip in dev if no secret configured

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

type FileField = {
  base64Key: "fullLengthPhotoBase64" | "closeUpPhotoBase64" | "idProofBase64";
  mimeKey: "fullLengthPhotoMimeType" | "closeUpPhotoMimeType" | "idProofMimeType";
  label: string;
  allowedMime: string[];
};

const FILE_FIELDS: FileField[] = [
  { base64Key: "fullLengthPhotoBase64", mimeKey: "fullLengthPhotoMimeType", label: "Full-Length Photo", allowedMime: PHOTO_ALLOWED_MIME },
  { base64Key: "closeUpPhotoBase64", mimeKey: "closeUpPhotoMimeType", label: "Close-Up Photo", allowedMime: PHOTO_ALLOWED_MIME },
  { base64Key: "idProofBase64", mimeKey: "idProofMimeType", label: "ID Proof", allowedMime: ID_ALLOWED_MIME },
];

export async function POST(req: NextRequest) {
  const appsScriptUrl = getRuntimeEnv("DANCE_TEAM_APPS_SCRIPT_URL") ?? "";

  if (!appsScriptUrl) {
    return NextResponse.json({ error: "Dance team registration not configured." }, { status: 503 });
  }

  let body: {
    turnstileToken?: string;
    dancerFirstName?: string;
    dancerLastName?: string;
    contactNumber?: string;
    fullLengthPhotoBase64?: string;
    fullLengthPhotoMimeType?: string;
    closeUpPhotoBase64?: string;
    closeUpPhotoMimeType?: string;
    idProofBase64?: string;
    idProofMimeType?: string;
    tcsAccepted?: boolean;
    signatureFullName?: string;
    signatureDate?: string;
    agreeAndSubmit?: boolean;
    freshnessCode?: string;
    issuedAt?: string;
    codeToken?: string;
    website?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: if the hidden field has content, pretend success and drop it.
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const ip = req.headers.get("CF-Connecting-IP") ?? req.headers.get("x-forwarded-for") ?? "";
  const tsOk = await verifyTurnstile(body.turnstileToken ?? "", ip);
  if (!tsOk) {
    return NextResponse.json(
      { error: "Security check failed. Please refresh and try again." },
      { status: 403 }
    );
  }

  const required = ["dancerFirstName", "dancerLastName", "contactNumber", "signatureFullName", "signatureDate"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  if (!body.tcsAccepted) {
    return NextResponse.json(
      { error: "You must accept the Terms & Conditions." },
      { status: 400 }
    );
  }

  if (!body.agreeAndSubmit) {
    return NextResponse.json(
      { error: 'You must check "I Agree and Submit" to register.' },
      { status: 400 }
    );
  }

  for (const field of FILE_FIELDS) {
    const base64 = body[field.base64Key];
    const mime = body[field.mimeKey];

    if (!base64 || !mime) {
      return NextResponse.json({ error: `Missing file: ${field.label}` }, { status: 400 });
    }

    if (!field.allowedMime.includes(mime)) {
      return NextResponse.json(
        {
          error: `${field.label} must be a JPEG or PNG${field.allowedMime.includes("application/pdf") ? " image, or a PDF." : " image."}`,
        },
        { status: 400 }
      );
    }

    // Rough size check on the base64 string (~4/3 expansion) — Apps Script re-checks the
    // decoded bytes; this just avoids a wasted round trip for obviously oversized uploads.
    const approxBytes = (base64.length * 3) / 4;
    if (approxBytes > PHOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: `${field.label} is larger than 5MB.` },
        { status: 400 }
      );
    }
  }

  try {
    const res = await fetch(appsScriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        action: "submit",
        dancerFirstName: body.dancerFirstName,
        dancerLastName: body.dancerLastName,
        contactNumber: body.contactNumber,
        fullLengthPhotoBase64: body.fullLengthPhotoBase64,
        fullLengthPhotoMimeType: body.fullLengthPhotoMimeType,
        closeUpPhotoBase64: body.closeUpPhotoBase64,
        closeUpPhotoMimeType: body.closeUpPhotoMimeType,
        idProofBase64: body.idProofBase64,
        idProofMimeType: body.idProofMimeType,
        tcsAccepted: body.tcsAccepted,
        signatureFullName: body.signatureFullName,
        signatureDate: body.signatureDate,
        agreeAndSubmit: body.agreeAndSubmit,
        freshnessCode: body.freshnessCode ?? "",
        issuedAt: body.issuedAt ?? "",
        codeToken: body.codeToken ?? "",
      }),
    });

    const data = (await res.json()) as { error?: string; registrationId?: string };

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error ?? "Submission failed. Please try again." },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Submission service unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }
}
