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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
              PB
            </div>
            <div>
              <div className="font-bold text-slate-900">PedidosBot</div>
              <div className="text-xs text-slate-500">{user.tenantName}</div>
            </div>
          </Link>

          <nav className="hidden gap-2 text-sm lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-500">Panel del negocio</div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-red-200 hover:text-red-600"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/orders", label: "Pedidos" },
  { href: "/dashboard/fiao", label: "Fiao" },
  { href: "/dashboard/zones", label: "Zonas" },
  { href: "/dashboard/settings", label: "Config" },
];
