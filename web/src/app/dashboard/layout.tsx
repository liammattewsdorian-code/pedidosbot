import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="flex h-screen bg-[#0b0f14] text-gray-200 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f172a] border-r border-gray-800">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-sm font-bold text-white">
              PB
            </div>
            <span className="font-bold text-white text-lg">PedidosBot</span>
          </Link>
        </div>

        {/* Negocio actual */}
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Negocio</p>
          <p className="text-sm font-semibold text-gray-200 truncate">{user.tenantName || "Mi negocio"}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {isSuperAdmin && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors mt-4 border border-purple-500/20"
            >
              <span className="text-base">⚡</span>
              Master Control
            </Link>
          )}
        </nav>

        {/* Plan + Usuario */}
        <div className="border-t border-gray-800 px-4 py-4 space-y-3">
          <Link href="/dashboard/billing" className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
            <div>
              <p className="text-xs text-gray-400">Plan actual</p>
              <p className="text-sm font-bold text-green-400">{user.tenantPlan || "TRIAL"}</p>
            </div>
            <span className="text-gray-500 text-xs">→</span>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 truncate max-w-[100px]">{user.name || "Usuario"}</p>
                <p className="text-[10px] text-gray-500">Administrador</p>
              </div>
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1">
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}

const NAV_LINKS = [
  { href: "/dashboard",            icon: "🏠", label: "Inicio" },
  { href: "/dashboard/orders",     icon: "📦", label: "Pedidos" },
  { href: "/dashboard/menu",       icon: "🧾", label: "Menú" },
  { href: "/dashboard/fiao",       icon: "💳", label: "Fiao" },
  { href: "/dashboard/zones",      icon: "🗺️",  label: "Zonas" },
  { href: "/dashboard/whatsapp",   icon: "📱", label: "WhatsApp" },
  { href: "/dashboard/settings",   icon: "⚙️",  label: "Configuración" },
  { href: "/dashboard/billing",    icon: "💰", label: "Facturación" },
];
