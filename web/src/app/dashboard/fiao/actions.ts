"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTenantId() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) throw new Error("No autenticado");
  return tenantId;
}

export async function createFiaoEntryAction(formData: FormData) {
  const tenantId = await getTenantId();
  const customerId = String(formData.get("customerId") || "");
  const mode = String(formData.get("mode") || "PAYMENT");
  const direction = String(formData.get("direction") || "decrease");
  const amount = Number(formData.get("amount") || 0);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!customerId || amount <= 0) {
    throw new Error("Movimiento invalido");
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
  });
  if (!customer) {
    throw new Error("Cliente invalido");
  }

  const lastEntry = await prisma.fiaoEntry.findFirst({
    where: { tenantId, customerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const previousBalance = Number(lastEntry?.balance ?? 0);

  let type: "PAYMENT" | "ADJUSTMENT" = "PAYMENT";
  let storedAmount = amount;
  let nextBalance = previousBalance;

  if (mode === "PAYMENT") {
    type = "PAYMENT";
    nextBalance = Math.max(0, previousBalance - amount);
  } else {
    type = "ADJUSTMENT";
    const delta = direction === "increase" ? amount : -amount;
    storedAmount = delta;
    nextBalance = Math.max(0, previousBalance + delta);
  }

  await prisma.fiaoEntry.create({
    data: {
      tenantId,
      customerId,
      type,
      amount: storedAmount,
      balance: nextBalance,
      notes,
    },
  });

  revalidatePath("/dashboard/fiao");
}
