import type { TenantStatus, UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      tenantId: string | null;
      tenantSlug: string | null;
      tenantName: string | null;
      tenantStatus: TenantStatus | null;
      trialEndsAt: string | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    tenantStatus: TenantStatus | null;
    trialEndsAt: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantName?: string | null;
    tenantStatus?: TenantStatus | null;
    trialEndsAt?: string | null;
  }
}
