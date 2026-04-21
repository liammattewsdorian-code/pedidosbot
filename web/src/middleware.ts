export { auth as middleware } from "@/lib/auth";

// Protege todas las rutas que comiencen con /dashboard
export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
