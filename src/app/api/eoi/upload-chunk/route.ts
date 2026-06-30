import { NextRequest, NextResponse } from "next/server";

const DRIVE_UPLOAD_PREFIX =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&";

export async function POST(req: NextRequest) {
  const sessionUri = req.headers.get("x-session-uri") ?? "";

  if (!sessionUri.startsWith(DRIVE_UPLOAD_PREFIX)) {
    return NextResponse.json({ error: "Invalid upload session." }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") ?? "application/octet-stream";
  const contentRange = req.headers.get("x-content-range");

  const fwdHeaders: Record<string, string> = { "Content-Type": contentType };
  if (contentRange) fwdHeaders["Content-Range"] = contentRange;

  try {
    const body = await req.arrayBuffer();

    const res = await fetch(sessionUri, {
      method: "PUT",
      headers: fwdHeaders,
      body,
    });

    if (res.status === 200 || res.status === 201) {
      const data = (await res.json()) as { id: string };
      return NextResponse.json({ done: true, id: data.id });
    }

    // 308 = Google Drive "Resume Incomplete" (not a real redirect).
    // Translate to 200 so browsers don't follow it as a redirect.
    if (res.status === 308) {
      const range = res.headers.get("Range") ?? "";
      const m = range.match(/bytes=0-(\d+)/);
      const nextOffset = m ? parseInt(m[1], 10) + 1 : 0;
      return NextResponse.json({ done: false, nextOffset });
    }

    return NextResponse.json(
      { error: `Upload failed (${res.status}).` },
      { status: 502 }
    );
  } catch {
    return NextResponse.json({ error: "Upload proxy unavailable." }, { status: 502 });
  }
}
