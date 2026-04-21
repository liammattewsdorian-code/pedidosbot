import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) return null;

  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      customer: true,
      items: true,
      deliveryZone: true,
    },
  });

  if (!order) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold">Pedido no encontrado</h1>
        <p className="mt-2 text-slate-500">
          El pedido no existe o no pertenece a este negocio.
        </p>
        <Link href="/dashboard/orders" className="mt-6 inline-block text-brand font-semibold">
          Volver a pedidos
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/dashboard/orders" className="text-sm font-medium text-brand">
        Volver a pedidos
      </Link>

      <header className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Pedido #{String(order.orderNumber).padStart(3, "0")}
          </h1>
          <p className="text-slate-500">
            Estado actual: {statusLabel(order.status)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
          <div className="text-xs uppercase tracking-wide text-slate-300">Total</div>
          <div className="text-2xl font-bold">{money(Number(order.total))}</div>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Cliente</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Nombre" value={order.customer.name || "Sin nombre"} />
          <InfoCard label="Telefono" value={order.customer.phone} />
          <InfoCard label="Direccion" value={order.deliveryAddress || order.customer.address || "Sin direccion"} />
          <InfoCard label="Zona" value={order.deliveryZone?.name || "No definida"} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
              <div>
                <div className="font-semibold">{item.quantity}x {item.name}</div>
                <div className="text-sm text-slate-500">
                  {money(Number(item.price))} c/u
                </div>
              </div>
              <div className="font-semibold">{money(Number(item.subtotal))}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function money(amount: number) {
  return amount.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
  });
}

function statusLabel(status: string) {
  return (
    {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmado",
      PREPARING: "Preparando",
      READY: "Listo",
      OUT_FOR_DELIVERY: "En camino",
      DELIVERED: "Entregado",
      CANCELLED: "Cancelado",
    }[status] || status
  );
}
