import type { NextAuthConfig } from "next-auth";
import { TenantStatus, UserRole } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.tenantStatus = user.tenantStatus;
        token.trialEndsAt = user.trialEndsAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = typeof token.id === "string" ? token.id : "";
      session.user.role = typeof token.role === "string" ? (token.role as UserRole) : UserRole.OWNER;
      session.user.tenantId = typeof token.tenantId === "string" ? token.tenantId : null;
      session.user.tenantSlug = typeof token.tenantSlug === "string" ? token.tenantSlug : null;
      session.user.tenantName = typeof token.tenantName === "string" ? token.tenantName : null;
      session.user.tenantStatus =
        typeof token.tenantStatus === "string"
          ? (token.tenantStatus as TenantStatus)
          : null;
      session.user.trialEndsAt =
        typeof token.trialEndsAt === "string" ? token.trialEndsAt : null;
      return session;
    },
  },
};
