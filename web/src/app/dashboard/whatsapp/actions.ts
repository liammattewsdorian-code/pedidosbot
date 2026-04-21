"use server";

import { auth } from "@/lib/auth";
import { botApi } from "@/lib/bot-api";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) throw new Error("No autenticado");
  return tenantId;
}

export async function saveMetaCredentialsAction(formData: FormData) {
  const tenantId = await getTenantId();
  const phoneNumberId = String(formData.get("phoneNumberId") || "").trim();
  const accessToken   = String(formData.get("accessToken") || "").trim();
  const wabaId        = String(formData.get("wabaId") || "").trim() || undefined;

  if (!phoneNumberId || !accessToken) {
    throw new Error("Phone Number ID y Access Token son obligatorios");
  }

  const result = await botApi.saveCredentials(tenantId, phoneNumberId, accessToken, wabaId);
  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard");
  return result;
}

export async function disconnectMetaAction() {
  const tenantId = await getTenantId();
  await botApi.disconnect(tenantId);
  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard");
}
