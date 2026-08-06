import { NextResponse } from "next/server";

/**
 * Per-event ticket enquiries, submitted from the "Contact for Details" modal
 * shown when an event has no ticket URL set up yet.
 *
 * Delivery: email via Resend when RESEND_API_KEY is set (to
 * kayaleventsofficial@gmail.com), with console logging as the
 * pre-provisioning fallback so submissions are never silently lost.
 */
const DESTINATION = process.env.INQUIRY_EMAIL ?? "kayaleventsofficial@gmail.com";

interface EventInquiryPayload {
  eventName?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  website?: string; // honeypot
}

export async function POST(request: Request) {
  let body: EventInquiryPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Honeypot: silently accept bot submissions without processing
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const eventName = body.eventName?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim();
  if (!eventName || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inquiry = {
    eventName,
    name,
    email,
    phone: body.phone?.trim() || "—",
    message: body.message?.trim() || "—",
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
        subject: `Ticket enquiry — ${inquiry.eventName} (${inquiry.name})`,
        text: [
          `Event: ${inquiry.eventName}`,
          `Name: ${inquiry.name}`,
          `Email: ${inquiry.email}`,
          `Phone: ${inquiry.phone}`,
          ``,
          inquiry.message,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("Event inquiry email delivery failed", await res.text());
      return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
    }
  } else {
    console.log("[event-inquiry] received (no email provider configured)", inquiry);
  }

  return NextResponse.json({ ok: true });
}
