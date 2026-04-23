// middleware.ts  (place in project root, next to package.json)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const PROTECTED_ROUTES = ["/generate", "/summarize"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect specific routes
  if (!PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Forward the browser's cookies to the Flask /me endpoint
    const cookieHeader = request.headers.get("cookie") || "";
    const res = await fetch(`${BACKEND_URL}/me`, {
      headers: { cookie: cookieHeader },
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      if ("emailAddress" in data) {
        return NextResponse.next(); // authenticated ✅
      }
    }
  } catch {
    // backend unreachable — redirect to login
  }

  // Not authenticated — redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/generate/:path*", "/summarize/:path*"],
};