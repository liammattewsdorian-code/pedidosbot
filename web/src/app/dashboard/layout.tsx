"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/dashboard",          icon: "🏠", label: "Inicio" },
  { href: "/dashboard/orders",   icon: "📦", label: "Pedidos" },
  { href: "/dashboard/menu",     icon: "🧾", label: "Menú" },
  { href: "/dashboard/fiao",     icon: "💳", label: "Fiao" },
  { href: "/dashboard/zones",    icon: "🗺️",  label: "Zonas" },
  { href: "/dashboard/whatsapp", icon: "📱", label: "WhatsApp" },
  { href: "/dashboard/settings", icon: "⚙️",  label: "Config" },
  { href: "/dashboard/billing",  icon: "💰", label: "Facturación" },
];

const BOTTOM_NAV = [
  { href: "/dashboard",        icon: "🏠", label: "Inicio" },
  { href: "/dashboard/orders", icon: "📦", label: "Pedidos" },
  { href: "/dashboard/menu",   icon: "🧾", label: "Menú" },
  { href: "/dashboard/fiao",   icon: "💳", label: "Fiao" },
  { href: "/dashboard/settings", icon: "⚙️", label: "Config" },
];

export default function DashboardLayoutClient({
  children,
  userName,
  tenantName,
  tenantPlan,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  userName: string;
  tenantName: string;
  tenantPlan: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-[#0b0f14] text-gray-200 overflow-hidden">

      {/* ─── SIDEBAR (desktop) ─── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[#0f172a] border-r border-gray-800">
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-sm font-bold text-white">PB</div>
            <span className="font-bold text-white text-lg">PedidosBot</span>
          </Link>
        </div>

        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Negocio</p>
          <p className="text-sm font-semibold text-gray-200 truncate">{tenantName || "Mi negocio"}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(link.href)
                  ? "bg-green-500/10 text-green-400 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          {isSuperAdmin && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mt-2 border border-purple-500/20 ${
                pathname === "/dashboard/admin"
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-purple-400 hover:bg-purple-500/10"
              }`}
            >
              <span>⚡</span> Master Control
            </Link>
          )}
        </nav>

        <div className="border-t border-gray-800 px-4 py-4 space-y-3">
          <Link href="/dashboard/billing" className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
            <div>
              <p className="text-xs text-gray-400">Plan actual</p>
              <p className="text-sm font-bold text-green-400">{tenantPlan || "TRIAL"}</p>
            </div>
            <span className="text-gray-500 text-xs">→</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                {(userName || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 truncate max-w-[90px]">{userName || "Usuario"}</p>
                <p className="text-[10px] text-gray-500">Administrador</p>
              </div>
            </div>
            <button
              onClick={() => startTransition(() => signOut({ callbackUrl: "/" }))}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE OVERLAY ─── */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f172a] border-r border-gray-800 flex flex-col z-50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-sm font-bold text-white">PB</div>
                <span className="font-bold text-white text-lg">PedidosBot</span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xl p-1">✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-green-500/10 text-green-400 font-medium"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-800 px-4 py-4">
              <button
                onClick={() => startTransition(() => signOut({ callbackUrl: "/" }))}
                className="w-full text-sm text-red-400 hover:text-red-300 py-2 border border-red-500/20 rounded-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── MAIN ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-gray-800 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-xs font-bold text-white">PB</div>
            <span className="font-bold text-white">PedidosBot</span>
          </Link>
          <Link href="/dashboard/billing" className="text-xs text-green-400 font-semibold border border-green-500/30 px-2 py-1 rounded-lg">
            {tenantPlan || "TRIAL"}
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-gray-800 flex z-30">
          {BOTTOM_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] transition-colors ${
                isActive(link.href) ? "text-green-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-xl leading-none">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>

    </div>
  );
}
