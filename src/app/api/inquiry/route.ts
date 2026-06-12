import { NextResponse } from "next/server";

/**
 * B2B inquiry submissions (R6).
 *
 * Delivery: email via Resend when RESEND_API_KEY is set (to
 * kayaleventsofficial@gmail.com), with console logging as the
 * pre-provisioning fallback so submissions are never silently lost
 * in development.
 */
const DESTINATION = process.env.INQUIRY_EMAIL ?? "kayaleventsofficial@gmail.com";

interface InquiryPayload {
  name?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  preferredDate?: string;
  city?: string;
  budget?: string;
  message?: string;
  website?: string; // honeypot
}

export async function POST(request: Request) {
  let body: InquiryPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Honeypot: silently accept bot submissions without processing
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();
  if (!name || !email || !message || !body.eventType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inquiry = {
    name,
    email,
    phone: body.phone?.trim() || "—",
    eventType: body.eventType,
    preferredDate: body.preferredDate || "—",
    city: body.city || "—",
    budget: body.budget || "—",
    message,
    receivedAt: new Date().toISOString(),
  };

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.INQUIRY_FROM ?? "Kayal Events <inquiries@kayalevents.com.au>",
        to: [DESTINATION],
        reply_to: inquiry.email,
        subject: `New ${inquiry.eventType} inquiry — ${inquiry.name}`,
        text: [
          `Name: ${inquiry.name}`,
          `Email: ${inquiry.email}`,
          `Phone: ${inquiry.phone}`,
          `Event type: ${inquiry.eventType}`,
          `Preferred date: ${inquiry.preferredDate}`,
          `City: ${inquiry.city}`,
          `Budget: ${inquiry.budget}`,
          ``,
          inquiry.message,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("Inquiry email delivery failed", await res.text());
      return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
    }
  } else {
    console.log("[inquiry] received (no email provider configured)", inquiry);
  }

  return NextResponse.json({ ok: true });
}
