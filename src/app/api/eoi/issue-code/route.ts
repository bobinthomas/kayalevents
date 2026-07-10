import { NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.EOI_APPS_SCRIPT_URL ?? "";

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "EOI not configured." }, { status: 503 });
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=issueCode`, {
      // Apps Script redirects; follow automatically
      redirect: "follow",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Code service unavailable." }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Code service unavailable." }, { status: 502 });
  }
}
