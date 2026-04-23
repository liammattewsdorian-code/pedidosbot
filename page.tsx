import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();

  // Verificación de seguridad: Solo ADMIN puede entrar
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [tenants, totalOrders, totalUsers, activeSessions] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        whatsAppSession: { select: { status: true } },
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  const connectedSessions = tenants.filter(t => t.whatsAppSession?.status === 'CONNECTED').length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Master Control</h1>
          <p className="text-slate-500 text-lg">Gestión global de PedidosBot 🇩🇴</p>
        </div>
        <Link href="/dashboard" className="bg-white border px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 transition">
          Regresar a mi Dashboard
        </Link>
      </header>

      {/* Estadísticas Globales */}
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Negocios Totales</div>
          <div className="text-4xl font-bold mt-2">{tenants.length}</div>
          <div className="text-sm text-green-600 font-medium mt-2">{connectedSessions} con WhatsApp conectado</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 text-blue-600">Volumen Total</div>
          <div className="text-4xl font-bold mt-2">{totalOrders}</div>
          <div className="text-sm text-slate-400 mt-2">Pedidos procesados en total</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 text-purple-600">Base de Usuarios</div>
          <div className="text-4xl font-bold mt-2">{totalUsers}</div>
          <div className="text-sm text-slate-400 mt-2">Administradores y Staff</div>
        </div>
      </div>

      {/* Lista de Tenants */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold">Negocios Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Negocio</th>
                <th className="px-6 py-4">Plan / Billing</th>
                <th className="px-6 py-4 text-center">Bot Status</th>
                <th className="px-6 py-4 text-right">Actividad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 font-mono">/{t.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.plan === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.plan}
                      </span>
                      <span className={`text-xs font-medium ${
                        t.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        ● {t.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      t.whatsAppSession?.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-400'
                    } mr-2`} />
                    <span className="text-sm text-slate-600">{t.whatsAppSession?.status || 'SIN CONFIGURAR'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold">{t._count.orders} pedidos</div>
                    <div className="text-xs text-slate-400">{t._count.products} productos</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/tenants/${t.id}`} className="text-brand text-sm font-bold hover:underline">
                      Gestionar
                    </Link>
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