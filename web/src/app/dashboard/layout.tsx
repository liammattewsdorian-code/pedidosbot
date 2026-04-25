import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SidebarClient from "./_components/SidebarClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;

  return (
    <SidebarClient
      userName={user.name || ""}
      tenantName={user.tenantName || ""}
      tenantPlan={user.tenantPlan || user.role || "TRIAL"}
      isSuperAdmin={user.role === "SUPER_ADMIN"}
    >
      {children}
    </SidebarClient>
  );
}
