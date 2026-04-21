"use server";

import { auth } from "@/lib/auth";
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

  const extraField = STATUS_FIELDS[status];
  const data: any = { status };
  if (extraField) data[extraField] = new Date();

  await prisma.order.updateMany({
    where: { id: orderId, tenantId },
    data,
  });
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}
