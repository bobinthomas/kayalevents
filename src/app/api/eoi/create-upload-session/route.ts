import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.EOI_APPS_SCRIPT_URL ?? "";
const VIDEO_MAX_MB = 50;
const ALLOWED_MIME = ["video/mp4", "video/quicktime", "video/webm"];

export const runtime = "edge";

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "EOI not configured." }, { status: 503 });
  }

  let body: {
    filename?: string;
    contentType?: string;
    fileSize?: number;
    groupName?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { filename, contentType, fileSize, groupName } = body;

  if (!filename || !contentType || !fileSize || !groupName) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!ALLOWED_MIME.includes(contentType)) {
    return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
  }

  if (fileSize > VIDEO_MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "File too large." }, { status: 400 });
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
        action: "createUploadSession",
        filename,
        contentType,
        fileSize,
        groupName,
      }),
    });

    const data = (await res.json()) as { error?: string; sessionUri?: string; submissionId?: string };

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error ?? "Upload session creation failed." },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Upload service unavailable." }, { status: 502 });
  }
}
