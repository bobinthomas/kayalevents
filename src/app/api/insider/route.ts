import { NextResponse } from "next/server";

/**
 * Kayal Insider presale list capture (R5).
 *
 * Provider-agnostic: forwards to the email platform once configured
 * (PRD Open Question 3 — Mailchimp/Brevo/Klaviyo). Until then submissions
 * are accepted and logged so the form UX can ship and be tested end-to-end.
 *
 * Configure via env:
 *  - BREVO_API_KEY + BREVO_LIST_ID  (double opt-in template recommended)
 */
export async function POST(request: Request) {
  let body: { email?: string; phone?: string; source?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Honeypot: silently accept bot submissions without processing
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const subscriber = {
    email,
    phone: body.phone?.trim() || undefined,
    source: body.source ?? "general",
    consentAt: new Date().toISOString(),
  };

  const brevoKey = process.env.BREVO_API_KEY;
  const brevoListId = process.env.BREVO_LIST_ID;

  if (brevoKey && brevoListId) {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: subscriber.email,
        attributes: {
          SMS: subscriber.phone,
          SOURCE: subscriber.source,
        },
        listIds: [Number(brevoListId)],
        updateEnabled: true,
      }),
    });
    if (!res.ok && res.status !== 204) {
      console.error("Brevo subscription failed", await res.text());
      return NextResponse.json({ error: "Subscription failed" }, { status: 502 });
    }
  } else {
    // Pre-provider stub: keep a server-side record for later import
    console.log("[insider] subscription (no provider configured)", subscriber);
  }

  return NextResponse.json({ ok: true });
}
