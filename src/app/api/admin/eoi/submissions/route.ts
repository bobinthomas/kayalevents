import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function POST(req: NextRequest) {
  const appsScriptUrl =
    getRuntimeEnv("EOI_APPS_SCRIPT_URL") ?? process.env.EOI_APPS_SCRIPT_URL ?? "";

  if (!appsScriptUrl) {
    return NextResponse.json({ error: "EOI not configured." }, { status: 503 });
  }

  let token: string;
  try {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  try {
    const res = await fetch(appsScriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ action: "adminGetSubmissions", token }),
    });

    const data = (await res.json()) as { error?: string } | unknown[];

    if (!res.ok || (typeof data === "object" && !Array.isArray(data) && "error" in data)) {
      const err = (data as { error?: string }).error ?? "Failed to load submissions.";
      return NextResponse.json({ error: err }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable." }, { status: 502 });
  }
}
