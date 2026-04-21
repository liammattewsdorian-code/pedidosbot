import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderBoard } from "@/components/dashboard/OrderBoard";
import { updateOrderStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  const initialOrders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: true,
      items: true,
      deliveryZone: true,
    },
  });

  return (
    <main className="px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Gestión de Pedidos</h1>
        <p className="text-slate-500">
          Confirma, prepara y despacha los pedidos de WhatsApp en tiempo real.
        </p>
      </header>

      <OrderBoard
        initialOrders={JSON.parse(JSON.stringify(initialOrders))}
        updateStatus={updateOrderStatusAction}
      />
    </main>
  );
}
