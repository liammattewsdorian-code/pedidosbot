import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Lógica de Trial/Billing (Simplificada)
  // En una implementación real, podrías verificar el estado del tenant aquí
  // o directamente en los Server Components del Dashboard.
  const user = req.auth?.user as any;
  
  // Lógica de expiración (Trial o Plan)
  const isExpired = user?.tenantStatus === 'EXPIRED';
  const trialEnded = user?.tenantStatus === 'TRIAL' && 
                     user?.trialEndsAt && 
                     new Date() > new Date(user.trialEndsAt);

  if (isDashboardPage && (isExpired || trialEnded)) {
    // Si la página no es la de facturación, redirigir a /billing
    const isBillingPage = req.nextUrl.pathname.startsWith('/dashboard/billing');
    
    if (!isBillingPage) {
      return NextResponse.redirect(new URL('/dashboard/billing', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};