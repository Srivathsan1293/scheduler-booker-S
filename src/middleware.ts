import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-server";
import * as Sentry from "@sentry/nextjs";

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request,
    });

    // Add cache control headers for protected routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }

    const supabase = createSupabaseMiddlewareClient(request.cookies);

    // Refresh session if expired - handle auth errors gracefully
    let session = null;
    let hasAuthError = false;
    try {
      const { data, error } = await supabase.auth.getSession();
      session = data.session;
      // Detect invalid token errors
      if (
        error?.message?.includes("refresh_token_not_found") ||
        error?.message?.includes("Invalid Refresh Token")
      ) {
        hasAuthError = true;
        session = null;
      }
    } catch (error) {
      // Invalid/expired tokens - treat as no session but capture unexpected issues
      Sentry.captureException(error, {
        tags: { segment: "middleware", stage: "getSession" },
        extra: { pathname: request.nextUrl.pathname },
      });
      hasAuthError = true;
      session = null;
    }

    // Clear invalid auth cookies if detected
    if (hasAuthError) {
      const authCookies = request.cookies
        .getAll()
        .filter((c) => c.name.includes("sb-"));
      authCookies.forEach((cookie) => {
        response.cookies.delete(cookie.name);
      });
    }

    // If accessing protected routes without session, redirect to login
    if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If accessing auth pages with session, redirect to dashboard
    if (
      session &&
      (request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If accessing onboarding with completed onboarding, redirect to dashboard
    if (
      session &&
      request.nextUrl.pathname === "/onboarding" &&
      session.user?.user_metadata?.onboarded
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { segment: "middleware", type: "edge" },
      extra: { pathname: request.nextUrl.pathname },
    });
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/invite/:path*",
    "/login",
    "/signup",
    "/onboarding",
  ],
};
