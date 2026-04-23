import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");

  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const user = req.auth?.user;
  const isExpired = user?.tenantStatus === "SUSPENDED";
  const trialEndsAt = typeof user?.trialEndsAt === "string" ? user.trialEndsAt : null;
  const trialEnded = user?.tenantStatus === "TRIAL" && trialEndsAt !== null
    ? Date.now() > new Date(trialEndsAt).getTime()
    : false;

  if (isDashboardPage && (isExpired || trialEnded)) {
    const isBillingPage = req.nextUrl.pathname.startsWith("/dashboard/billing");

    if (!isBillingPage) {
      return NextResponse.redirect(new URL("/dashboard/billing", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
