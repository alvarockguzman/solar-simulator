import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.renovatio.lat";

/**
 * Un solo dominio canónico: www.renovatio.lat
 * - renovatio.lat (sin www) → www
 * - advanced.renovatio.lat (legacy) → www/calculadora
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const url = request.nextUrl.clone();

  if (host === "advanced.renovatio.lat") {
    url.host = CANONICAL_HOST;
    const path = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/calculadora${path}`;
    return NextResponse.redirect(url, 308);
  }

  if (host === "renovatio.lat") {
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
