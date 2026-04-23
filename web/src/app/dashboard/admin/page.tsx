import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/dashboard/orders");
  }

  const [tenants, totalOrders, totalUsers] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        sessions: { select: { status: true } },
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  const connectedSessions = tenants.filter((t) => t.sessions?.[0]?.status === "CONNECTED").length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-slate-50 px-6 py-10">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Master Control</h1>
          <p className="text-lg text-slate-500">Gestion global de PedidosBot</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50"
        >
          Ir a mi Dashboard
        </Link>
      </header>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">
            Negocios Totales
          </div>
          <div className="mt-2 text-4xl font-bold">{tenants.length}</div>
          <div className="mt-2 text-sm font-medium text-green-600">
            {connectedSessions} bots en linea
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
            Pedidos Totales
          </div>
          <div className="mt-2 text-4xl font-bold">{totalOrders}</div>
          <div className="mt-2 text-sm text-slate-400">Procesados globalmente</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-600">
            Usuarios
          </div>
          <div className="mt-2 text-4xl font-bold">{totalUsers}</div>
          <div className="mt-2 text-sm text-slate-400">Duenos y staff</div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold">Negocios Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Negocio</th>
                <th className="px-6 py-4">Plan / Billing</th>
                <th className="px-6 py-4 text-center">Bot Status</th>
                <th className="px-6 py-4 text-right">Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="font-mono text-xs text-slate-400">/{t.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          t.plan === "PREMIUM"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.plan}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          t.status === "ACTIVE" ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`mr-2 inline-flex h-2.5 w-2.5 rounded-full ${
                        t.sessions?.[0]?.status === "CONNECTED" ? "bg-green-500" : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm font-medium text-slate-600">
                      {t.sessions?.[0]?.status || "SIN SESION"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold">{t._count.orders} pedidos</div>
                    <div className="text-xs text-slate-400">{t._count.products} productos</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
