import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Asegurarse que Image esté importado

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();

  // Verificación de seguridad: Solo ADMIN puede entrar
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [tenants, totalOrders, totalUsers] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">PedidosBot Master Control</h1>
          <p className="text-slate-500 text-lg">Administración global de la plataforma</p>
        </div>
        <Link href="/" className="text-brand font-medium hover:underline">Ir al Inicio</Link>
      </header>

      {/* Estadísticas Globales */}
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 uppercase font-semibold text-brand">Total Negocios</div>
          <div className="text-4xl font-bold mt-2">{tenants.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 uppercase font-semibold text-blue-600">Pedidos Totales</div>
          <div className="text-4xl font-bold mt-2">{totalOrders}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 uppercase font-semibold text-purple-600">Usuarios</div>
          <div className="text-4xl font-bold mt-2">{totalUsers}</div>
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
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Pedidos</th>
                <th className="px-6 py-4 text-right">Productos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{t.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-bold">{t.plan}</span>
                  </td>
                  <td className="px-6 py-4 italic text-sm text-slate-600">
                    {t.status}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{t._count.orders}</td>
                  <td className="px-6 py-4 text-right font-medium">{t._count.products}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}