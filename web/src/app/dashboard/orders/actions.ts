"use server";

import { auth } from "@/lib/auth";
import { botApi } from "@/lib/bot-api";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const STATUS_FIELDS: Record<string, string> = {
  CONFIRMED: "confirmedAt",
  PREPARING: "preparingAt",
  READY: "readyAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
};

export async function updateOrderStatusAction(orderId: string, status: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) throw new Error("No autenticado");

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  const extraField = STATUS_FIELDS[status];
  const data: any = { status };
  if (extraField) data[extraField] = new Date();

  await prisma.order.update({
    where: { id: order.id },
    data,
  });

  if (status === "OUT_FOR_DELIVERY") {
    await botApi.dispatchOrder(tenantId, order.id);
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}
