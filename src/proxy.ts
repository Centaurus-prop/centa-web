import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session-token";
import { findRouteRule } from "@/lib/dashboard-routes";

const PROTECTED_ROUTES = ["/dashboard", "/api/auth/me"] as const;

function unauthorized(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "No autenticado" }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const roleRule = findRouteRule(pathname);

  if (!isProtected && !roleRule) {
    return NextResponse.next();
  }

  if (!token) {
    return unauthorized(request, pathname);
  }

  let payload: Awaited<ReturnType<typeof verifySessionToken>> = null;
  try {
    payload = await verifySessionToken(token);
  } catch (error) {
    console.error("[proxy] verifySessionToken threw", error);
    return unauthorized(request, pathname);
  }
  if (!payload) {
    return unauthorized(request, pathname);
  }

  if (roleRule && !roleRule.allowedRoles.includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/me"],
};
