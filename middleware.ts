import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COTIZADOR_COOKIE, isValidSessionToken } from "@/lib/cotizador/auth";

const CANONICAL_HOST = "www.renovatio.lat";

/** Rutas del cotizador que no requieren sesión. */
function isCotizadorPublicPath(pathname: string): boolean {
  return (
    pathname === "/cotizador/login" ||
    pathname.startsWith("/api/cotizador/auth") ||
    pathname === "/api/cotizador/health"
  );
}

function isCotizadorProtectedPath(pathname: string): boolean {
  return (
    (pathname === "/cotizador" ||
      pathname.startsWith("/cotizador/") ||
      pathname.startsWith("/api/cotizador")) &&
    !isCotizadorPublicPath(pathname)
  );
}

/**
 * Un solo dominio canónico: www.renovatio.lat
 * - renovatio.lat (sin www) → www
 * - advanced.renovatio.lat (legacy) → www/calculadora
 * Además protege /cotizador (herramienta interna) con password compartida.
 */
export async function middleware(request: NextRequest) {
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

  if (isCotizadorProtectedPath(url.pathname)) {
    const appPassword = process.env.APP_PASSWORD;
    // Sin APP_PASSWORD configurada (desarrollo local) no se bloquea el acceso.
    if (appPassword) {
      const token = request.cookies.get(COTIZADOR_COOKIE)?.value;
      const valid = await isValidSessionToken(token, appPassword);
      if (!valid) {
        if (url.pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const loginUrl = url.clone();
        loginUrl.pathname = "/cotizador/login";
        loginUrl.search = `?next=${encodeURIComponent(url.pathname)}`;
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
