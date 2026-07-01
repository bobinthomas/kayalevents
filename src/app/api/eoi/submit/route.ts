import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.EOI_APPS_SCRIPT_URL ?? "";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET ?? "";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // skip in dev if no secret configured

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "EOI not configured." }, { status: 503 });
  }

  let body: {
    turnstileToken?: string;
    groupName?: string;
    profileAbout?: string;
    achievements?: string;
    numPerformers?: string | number;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    location?: string;
    linkInstagram?: string;
    linkYoutube?: string;
    linkOther?: string;
    declarationChecked?: boolean;
    freshnessCode?: string;
    issuedAt?: string;
    codeToken?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Turnstile (server-side)
  const ip = req.headers.get("CF-Connecting-IP") ?? req.headers.get("x-forwarded-for") ?? "";
  const tsOk = await verifyTurnstile(body.turnstileToken ?? "", ip);
  if (!tsOk) {
    return NextResponse.json(
      { error: "Security check failed. Please refresh and try again." },
      { status: 403 }
    );
  }

  const required = [
    "groupName",
    "profileAbout",
    "achievements",
    "numPerformers",
    "contactName",
    "contactEmail",
    "contactPhone",
  ] as const;

  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  if (!body.linkInstagram && !body.linkYoutube && !body.linkOther) {
    return NextResponse.json(
      { error: "At least one performance link is required." },
      { status: 400 }
    );
  }

  if (!body.declarationChecked) {
    return NextResponse.json({ error: "Declaration must be checked." }, { status: 400 });
  }

  // Honeypot: if body has 'website' field with content, reject silently
  if ("website" in body && body.website) {
    return NextResponse.json({ submissionId: body.submissionId, success: true });
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        action: "submit",
        groupName: body.groupName,
        profileAbout: body.profileAbout,
        achievements: body.achievements,
        numPerformers: body.numPerformers,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        location: body.location ?? "",
        linkInstagram: body.linkInstagram ?? "",
        linkYoutube: body.linkYoutube ?? "",
        linkOther: body.linkOther ?? "",
        declarationChecked: body.declarationChecked,
      }),
    });

    const data = (await res.json()) as { error?: string; submissionId?: string };

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
