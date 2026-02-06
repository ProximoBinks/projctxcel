import { NextResponse } from "next/server";
import { verifyAuthToken } from "./lib/auth";

export async function middleware(request) {
  const response = NextResponse.next();

  applySecurityHeaders(response);

  const pathname = request.nextUrl.pathname;

  const needsAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const needsTutor =
    pathname.startsWith("/tutor") &&
    pathname !== "/tutor/login" &&
    pathname !== "/tutor/signup";

  if (needsAdmin || needsTutor) {
    return await handleProtectedRoute(request, { needsAdmin, needsTutor });
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/quotes/")) {
    response.headers.set("X-API-Version", "1.0");
  }

  return response;
}

async function handleProtectedRoute(request, { needsAdmin, needsTutor }) {
  const token = request.cookies.get("auth_token")?.value;
  const loginPath = needsAdmin ? "/admin/login" : "/tutor/login";

  if (!token) {
    const redirect = NextResponse.redirect(new URL(loginPath, request.url));
    applySecurityHeaders(redirect);
    return redirect;
  }

  const session = await verifyAuthToken(token);
  if (!session) {
    const redirect = NextResponse.redirect(new URL(loginPath, request.url));
    applySecurityHeaders(redirect);
    return redirect;
  }

  if (needsAdmin && session.type !== "admin") {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    applySecurityHeaders(redirect);
    return redirect;
  }

  if (needsTutor && session.type !== "tutor") {
    const redirect = NextResponse.redirect(new URL("/tutor/login", request.url));
    applySecurityHeaders(redirect);
    return redirect;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Middleware-Executed", "true");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
};
