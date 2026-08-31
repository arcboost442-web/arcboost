import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET_KEY = "arcboost2025dev"; // ganti dengan key rahasia kamu

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Selalu izinkan route ini
  if (
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon")
  ) {
    return NextResponse.next();
  }

  // Kalau ada ?dev=arcboost2025dev di URL → set cookie dan izinkan
  if (searchParams.get("dev") === SECRET_KEY) {
    const response = NextResponse.next();
    response.cookies.set("dev_access", SECRET_KEY, { maxAge: 60 * 60 * 24 }); // 24 jam
    return response;
  }

  // Kalau sudah punya cookie → izinkan
  if (request.cookies.get("dev_access")?.value === SECRET_KEY) {
    return NextResponse.next();
  }

  // Redirect ke coming soon
  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};