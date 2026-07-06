import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function GET() {
  const appsScriptUrl = getRuntimeEnv("REEL_CONTEST_APPS_SCRIPT_URL") ?? "";

  if (!appsScriptUrl) {
    return NextResponse.json({ error: "Reel contest not configured." }, { status: 503 });
  }

  try {
    const res = await fetch(`${appsScriptUrl}?action=issueCode`, {
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
