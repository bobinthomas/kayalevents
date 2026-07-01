import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Serve /dancer-eoi content at the root path — supports both
  // eoi.kayalevents.com.au/ and the staging workers.dev URL.
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/dancer-eoi", request.url));
  }
}

export const config = {
  matcher: ["/"],
};
