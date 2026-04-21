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

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createZoneAction(formData: FormData) {
  const tenantId = await getTenantId();
  const name = String(formData.get("name") || "").trim();
  const fee = Number(formData.get("fee") || 0);

  if (!name || fee < 0) {
    throw new Error("Zona invalida");
  }

  await prisma.deliveryZone.create({
    data: {
      tenantId,
      name,
      fee,
      minOrder: optionalNumber(formData.get("minOrder")),
      estimatedMinutes: optionalNumber(formData.get("estimatedMinutes")),
      active: true,
    },
  });

  revalidatePath("/dashboard/zones");
}

export async function updateZoneAction(id: string, formData: FormData) {
  const tenantId = await getTenantId();
  const name = String(formData.get("name") || "").trim();
  const fee = Number(formData.get("fee") || 0);

  if (!name || fee < 0) {
    throw new Error("Zona invalida");
  }

  await prisma.deliveryZone.updateMany({
    where: { id, tenantId },
    data: {
      name,
      fee,
      minOrder: optionalNumber(formData.get("minOrder")),
      estimatedMinutes: optionalNumber(formData.get("estimatedMinutes")),
    },
  });

  revalidatePath("/dashboard/zones");
}

export async function toggleZoneAction(id: string) {
  const tenantId = await getTenantId();
  const zone = await prisma.deliveryZone.findFirst({
    where: { id, tenantId },
  });

  if (!zone) return;

  await prisma.deliveryZone.update({
    where: { id: zone.id },
    data: { active: !zone.active },
  });

  revalidatePath("/dashboard/zones");
}

export async function deleteZoneAction(id: string) {
  const tenantId = await getTenantId();
  const zone = await prisma.deliveryZone.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!zone) return;

  if (zone._count.orders > 0) {
    await prisma.deliveryZone.update({
      where: { id: zone.id },
      data: { active: false },
    });
  } else {
    await prisma.deliveryZone.delete({
      where: { id: zone.id },
    });
  }

  revalidatePath("/dashboard/zones");
}
