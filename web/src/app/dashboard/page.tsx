import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    ordersToday,
    ordersYesterday,
    totalCustomers,
    revenueToday,
    revenueYesterday,
    whatsappSession,
    pendingOrders,
    totalProducts,
    totalZones,
    pendingFiao,
    tenant,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: yesterdayStart, lt: todayStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.whatsAppSession.findFirst({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId, status: "PENDING" } }),
    prisma.product.count({ where: { tenantId, available: true } }),
    prisma.deliveryZone.count({ where: { tenantId, active: true } }),
    prisma.fiaoEntry.findMany({
      where: { tenantId },
      distinct: ["customerId"],
      orderBy: [{ customerId: "asc" }, { createdAt: "desc" }],
      select: { balance: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, plan: true, deliveryEnabled: true, fiaoEnabled: true },
    }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, phone: true } } },
    }),
  ]);

  const revenue = Number(revenueToday._sum.total ?? 0);
  const revenueYest = Number(revenueYesterday._sum.total ?? 0);
  const connected = whatsappSession?.status === "CONNECTED";
  const outstandingFiao = pendingFiao.reduce((s, e) => s + Number(e.balance), 0);
  const pctRevenue = revenueYest > 0 ? Math.round(((revenue - revenueYest) / revenueYest) * 100) : null;
  const pctOrders = ordersYesterday > 0 ? Math.round(((ordersToday - ordersYesterday) / ordersYesterday) * 100) : null;
  const conversion = totalCustomers > 0 ? Math.round((ordersToday / totalCustomers) * 100) : 0;

  const statusColor: Record<string, string> = {
    PENDING:   "bg-yellow-500/20 text-yellow-400",
    CONFIRMED: "bg-blue-500/20 text-blue-400",
    PREPARING: "bg-purple-500/20 text-purple-400",
    READY:     "bg-cyan-500/20 text-cyan-400",
    DELIVERED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
  };

  const statusLabel: Record<string, string> = {
    PENDING:   "Pendiente",
    CONFIRMED: "Confirmado",
    PREPARING: "Preparando",
    READY:     "Listo",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            ¡Hola, {(session.user?.name || tenant?.name || "").split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Aquí tienes el resumen de tu negocio</p>
        </div>
        {pendingOrders > 0 && (
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-2 rounded-lg hover:bg-yellow-500/15 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            {pendingOrders} pedido{pendingOrders > 1 ? "s" : ""} pendiente{pendingOrders > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Ventas hoy"      value={money(revenue)}            trend={pctRevenue} icon="💵" color="green" />
        <KpiCard label="Pedidos hoy"     value={ordersToday.toString()}    trend={pctOrders}  icon="📦" color="blue" />
        <KpiCard label="Clientes"        value={totalCustomers.toString()}                    icon="👥" color="purple" />
        <KpiCard label="Conversión"      value={`${conversion}%`}                             icon="📈" color="orange" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Pedidos recientes</h2>
            <Link href="/dashboard/orders" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">Aún no hay pedidos.</p>
              <p className="text-gray-500 text-xs mt-1">Configura tu menú y comparte tu número de WhatsApp.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-10">
                      #{String(order.orderNumber).padStart(3, "0")}
                    </span>
                    <span className="text-sm font-medium text-gray-200">
                      {order.customer?.name || order.customer?.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{money(Number(order.total))}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[order.status] ?? "bg-gray-700 text-gray-400"}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* WhatsApp */}
          <div className={`bg-[#111827] rounded-2xl border p-5 ${connected ? "border-green-500/30" : "border-gray-800"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${connected ? "bg-green-500/20" : "bg-gray-700/50"}`}>
                📱
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">WhatsApp</p>
                <p className={`text-xs ${connected ? "text-green-400" : "text-gray-500"}`}>
                  {connected ? "Conectado y funcionando" : "Sin conexión"}
                </p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            </div>
            {!connected && (
              <Link href="/dashboard/whatsapp" className="mt-4 block text-center text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors">
                Conectar ahora
              </Link>
            )}
          </div>

          {/* Indicadores */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Indicadores</h3>
            <QuickStat label="Productos activos" value={totalProducts.toString()} icon="🧾" />
            <QuickStat label="Zonas de delivery"  value={totalZones.toString()}    icon="🗺️" />
            <QuickStat label="Fiao pendiente"     value={money(outstandingFiao)}   icon="💳" />
          </div>

          {/* Checklist */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Estado del negocio</h3>
            <div className="space-y-2.5">
              <CheckItem ok={connected}                                            label="WhatsApp conectado" />
              <CheckItem ok={totalProducts > 0}                                   label="Catálogo cargado" />
              <CheckItem ok={!tenant?.deliveryEnabled || totalZones > 0}          label="Zonas configuradas" />
              <CheckItem ok={!tenant?.fiaoEnabled || outstandingFiao >= 0}        label="Fiao activo" />
            </div>
          </div>

        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="bg-[#111827] border border-gray-800 hover:border-green-500/40 hover:bg-[#1a2235] rounded-2xl p-5 transition-all group"
          >
            <div className="text-2xl mb-3">{q.icon}</div>
            <p className="text-sm font-semibold text-gray-200 group-hover:text-white">{q.label}</p>
            <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}

function KpiCard({ label, value, trend, icon, color }: {
  label: string; value: string; trend?: number | null; icon: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const bg = { green: "bg-green-500/10 text-green-400", blue: "bg-blue-500/10 text-blue-400", purple: "bg-purple-500/10 text-purple-400", orange: "bg-orange-500/10 text-orange-400" };
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${bg[color]}`}>{icon}</div>
        {trend != null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend}% vs ayer
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mt-4">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm flex items-center gap-2"><span>{icon}</span>{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${ok ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-500"}`}>
        {ok ? "✓" : "○"}
      </span>
      <span className={ok ? "text-gray-300" : "text-gray-500"}>{label}</span>
    </div>
  );
}

function money(n: number) {
  return n.toLocaleString("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 });
}

const QUICK_LINKS = [
  { icon: "🧾", label: "Menú",          desc: "Gestiona productos",   href: "/dashboard/menu" },
  { icon: "📦", label: "Pedidos",       desc: "Ver y confirmar",      href: "/dashboard/orders" },
  { icon: "💳", label: "Fiao",          desc: "Créditos por cliente", href: "/dashboard/fiao" },
  { icon: "⚙️",  label: "Configuración", desc: "Horario y mensajes",  href: "/dashboard/settings" },
];
