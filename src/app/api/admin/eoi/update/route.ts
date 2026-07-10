import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function POST(req: NextRequest) {
  const appsScriptUrl =
    getRuntimeEnv("EOI_APPS_SCRIPT_URL") ?? process.env.EOI_APPS_SCRIPT_URL ?? "";

  if (!appsScriptUrl) {
    return NextResponse.json({ error: "EOI not configured." }, { status: 503 });
  }

  let body: { token?: string; submissionId?: string; status?: string; reviewerNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.token) return NextResponse.json({ error: "Missing token." }, { status: 401 });
  if (!body.submissionId) return NextResponse.json({ error: "Missing submissionId." }, { status: 400 });

  const validStatuses = ["Pending", "Shortlisted", "Rejected"];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const res = await fetch(appsScriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        action: "adminUpdateSubmission",
        token: body.token,
        submissionId: body.submissionId,
        status: body.status,
        reviewerNotes: body.reviewerNotes ?? "",
      }),
    });

    const data = (await res.json()) as { error?: string; ok?: boolean };

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error ?? "Update failed." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable." }, { status: 502 });
  }
}
