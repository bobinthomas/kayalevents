import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

const VIDEO_MAX_BYTES = 10 * 1024 * 1024; // 10MB — mirrors Config.gs VIDEO_MAX_BYTES

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

export async function POST(req: NextRequest) {
  const appsScriptUrl = getRuntimeEnv("REEL_CONTEST_APPS_SCRIPT_URL") ?? "";

  if (!appsScriptUrl) {
    return NextResponse.json({ error: "Reel contest not configured." }, { status: 503 });
  }

  let body: {
    turnstileToken?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    state?: string;
    team?: string;
    description?: string;
    videoBase64?: string;
    videoMimeType?: string;
    videoFileName?: string;
    driveLink?: string;
    tcsAccepted?: boolean;
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

  const required = ["fullName", "email", "phone", "state", "team"] as const;
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

  const hasFile = Boolean(body.videoBase64);
  const hasLink = Boolean(body.driveLink);

  if (hasFile === hasLink) {
    return NextResponse.json(
      { error: "Provide either a video file or a Google Drive link — not both." },
      { status: 400 }
    );
  }

  if (hasFile) {
    // Rough size check on the base64 string (~4/3 expansion) — Apps Script re-checks the
    // decoded bytes; this just avoids a wasted round trip for obviously oversized uploads.
    const approxBytes = (body.videoBase64!.length * 3) / 4;
    if (approxBytes > VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Video file is larger than 10MB. Use the Google Drive link option instead." },
        { status: 400 }
      );
    }
  }

  if (hasLink && !/drive\.google\.com/i.test(body.driveLink!)) {
    return NextResponse.json(
      { error: "Drive link must be a drive.google.com share link." },
      { status: 400 }
    );
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
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        state: body.state,
        team: body.team,
        description: body.description ?? "",
        videoBase64: body.videoBase64 ?? "",
        videoMimeType: body.videoMimeType ?? "",
        videoFileName: body.videoFileName ?? "",
        driveLink: body.driveLink ?? "",
        tcsAccepted: body.tcsAccepted,
        freshnessCode: body.freshnessCode ?? "",
        issuedAt: body.issuedAt ?? "",
        codeToken: body.codeToken ?? "",
      }),
    });

    const data = (await res.json()) as { error?: string; entryId?: string };

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
