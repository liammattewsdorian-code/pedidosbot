import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  const userRole = (session?.user as any)?.role || "STAFF";
  const isStaff = userRole === "STAFF";
  if (!tenantId) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    totalCustomers,
    revenueToday,
    whatsappSession,
    pendingOrders,
    totalProducts,
    totalZones,
    pendingFiao,
    tenant,
  ] = await Promise.all([
    prisma.order.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: { gte: todayStart },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    prisma.whatsAppSession.findUnique({ where: { tenantId } }),
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
      select: {
        name: true,
        plan: true,
        deliveryEnabled: true,
        fiaoEnabled: true,
      },
    }),
  ]);

  const revenue = Number(revenueToday._sum.total ?? 0);
  const connected = whatsappSession?.status === "CONNECTED";
  const outstandingFiao = pendingFiao.reduce(
    (sum, entry) => sum + Number(entry.balance),
    0
  );
  const readiness = [
    { label: "WhatsApp conectado", ok: connected },
    { label: "Catalogo cargado", ok: totalProducts > 0 },
    { label: "Zonas listas", ok: !tenant?.deliveryEnabled || totalZones > 0 },
    { label: "Fiao habilitado", ok: !tenant?.fiaoEnabled || outstandingFiao >= 0 },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-brand">
            Panel operativo
          </p>
          <h1 className="text-3xl font-bold">
            Resumen de {tenant?.name || "tu negocio"}
          </h1>
          <p className="text-sm text-slate-500">
            {isStaff ? "Vista de operador" : "Control total del negocio"}
          </p>
        </div>

        {!isStaff && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Plan actual
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {tenant?.plan || "TRIAL"}
          </div>
          {!connected && (
            <Link
              href="/dashboard/whatsapp"
              className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Conectar WhatsApp
            </Link>
          )}
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Pedidos hoy" value={ordersToday.toString()} />
        <Stat label="Ventas hoy" value={money(revenue)} />
        <Stat label="Clientes totales" value={totalCustomers.toString()} />
        <Stat
          label="Estado del bot"
          value={connected ? "En linea" : "Desconectado"}
          accent={connected ? "text-green-600" : "text-red-600"}
        />
      </div>

      {pendingOrders > 0 && (
        <Link
          href="/dashboard/orders"
          className="mb-6 block rounded-xl border-2 border-amber-300 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <div className="font-bold text-amber-900">
            Tienes {pendingOrders} pedido{pendingOrders > 1 ? "s" : ""} sin confirmar
          </div>
          <div className="text-sm text-amber-800">Ver pedidos pendientes</div>
        </Link>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Estado del negocio</h2>
            <span className="text-sm text-slate-500">Chequeo rapido</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {readiness.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="text-sm font-medium text-slate-700">{item.label}</div>
                <div
                  className={`mt-1 text-sm font-semibold ${
                    item.ok ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {item.ok ? "Listo" : "Pendiente"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Indicadores</h2>
          <div className="space-y-4">
            <Metric label="Productos activos" value={totalProducts.toString()} />
            <Metric label="Zonas activas" value={totalZones.toString()} />
            <Metric
              label="Balance pendiente de fiao"
              value={money(outstandingFiao)}
            />
          </div>
        </section>
      </div>

      <h2 className="mb-3 text-lg font-bold">Secciones</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.filter(s => !isStaff || !s.adminOnly).map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
          >
            <div className="mb-3 text-3xl">{section.icon}</div>
            <div className="mb-1 font-bold">{section.title}</div>
            <div className="text-sm text-slate-500">{section.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function money(n: number) {
  return n.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  });
}

const SECTIONS = [
  {
    icon: "P",
    title: "Conectar WhatsApp",
    desc: "Escanea el QR para vincular tu numero",
    href: "/dashboard/whatsapp",
    adminOnly: true,
  },
  {
    icon: "M",
    title: "Menu / Productos",
    desc: "Edita tu catalogo, precios y categorias",
    href: "/dashboard/menu",
    adminOnly: false,
  },
  {
    icon: "O",
    title: "Pedidos",
    desc: "Ver, confirmar y gestionar pedidos",
    href: "/dashboard/orders",
    adminOnly: false,
  },
  {
    icon: "F",
    title: "Fiao",
    desc: "Control de creditos por cliente",
    href: "/dashboard/fiao",
    adminOnly: false,
  },
  {
    icon: "Z",
    title: "Zonas de delivery",
    desc: "Define zonas y costos de entrega",
    href: "/dashboard/zones",
    adminOnly: true,
  },
  {
    icon: "C",
    title: "Configuracion",
    desc: "Horario, datos del negocio y mensajes",
    href: "/dashboard/settings",
    adminOnly: true,
  },
];
