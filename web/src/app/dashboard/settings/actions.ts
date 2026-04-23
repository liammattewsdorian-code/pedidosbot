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

function nullable(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalUrl(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    new URL(text);
    return text;
  } catch {
    return null;
  }
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function updateTenantSettingsAction(formData: FormData) {
  const tenantId = await getTenantId();

  const name = String(formData.get("name") || "").trim();
  const whatsappNumber = String(formData.get("whatsappNumber") || "").replace(/\D/g, "");
  const exchangeRate = Number(formData.get("exchangeRate") || 0);

  if (!name || !whatsappNumber || exchangeRate <= 0) {
    throw new Error("Nombre, WhatsApp y tasa de cambio son obligatorios");
  }

  // Construir schedule JSON desde los campos del formulario
  const schedule: Record<string, { open: string; close: string } | { closed: true }> = {};
  for (const day of DAYS) {
    if (formData.get(`schedule_${day}_closed`) === "on") {
      schedule[day] = { closed: true };
    } else {
      const open = String(formData.get(`schedule_${day}_open`) || "08:00");
      const close = String(formData.get(`schedule_${day}_close`) || "22:00");
      schedule[day] = { open, close };
    }
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      whatsappNumber,
      ownerPhone: nullable(formData.get("ownerPhone")),
      city: nullable(formData.get("city")),
      address: nullable(formData.get("address")),
      timezone: String(formData.get("timezone") || "America/Santo_Domingo"),
      currency: String(formData.get("currency") || "DOP"),
      language: (formData.get("language") as any) || "ES",
      exchangeRate,
      businessType: (formData.get("businessType") as any) || "RESTAURANT",
      welcomeMessage: nullable(formData.get("welcomeMessage")),
      closedMessage: nullable(formData.get("closedMessage")),
      googleMapsUrl: optionalUrl(formData.get("googleMapsUrl")),
      instagramUrl: optionalUrl(formData.get("instagramUrl")),
      websiteUrl: optionalUrl(formData.get("websiteUrl")),
      logoUrl: optionalUrl(formData.get("logoUrl")),
      deliveryEnabled: formData.get("deliveryEnabled") === "on",
      fiaoEnabled: formData.get("fiaoEnabled") === "on",
      schedule,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/whatsapp");
}
