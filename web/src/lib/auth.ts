import NextAuth from "next-auth";
import type { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { 
            tenant: { 
              select: { 
                id: true, 
                slug: true, 
                name: true,
                status: true,
                subscriptionEndsAt: true 
              } 
            } 
          },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const authUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId ?? null,
          tenantSlug: user.tenant?.slug ?? null,
          tenantName: user.tenant?.name ?? null,
          tenantStatus: user.tenant?.status ?? null,
          trialEndsAt: user.tenant?.subscriptionEndsAt?.toISOString() ?? null,
        };

        return authUser;
      },
    }),
  ],
});
