import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Izinkan akses ke /coming-soon, /api, dan _next
  if (
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }
  // Redirect semua route lain ke coming-soon
  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};