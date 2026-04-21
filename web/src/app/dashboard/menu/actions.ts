"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const session = await auth();
  const id = (session?.user as any)?.tenantId as string | undefined;
  if (!id) throw new Error("No autenticado");
  return id;
}

export async function createCategoryAction(formData: FormData) {
  const tenantId = await getTenantId();
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim() || null;
  if (!name) return;

  const count = await prisma.category.count({ where: { tenantId } });
  await prisma.category.create({
    data: { tenantId, name, emoji, order: count },
  });
  revalidatePath("/dashboard/menu");
}

export async function deleteCategoryAction(id: string) {
  const tenantId = await getTenantId();
  await prisma.category.deleteMany({ where: { id, tenantId } });
  revalidatePath("/dashboard/menu");
}

export async function createProductAction(formData: FormData) {
  const tenantId = await getTenantId();
  const categoryId = String(formData.get("categoryId") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  if (!name || !categoryId || price <= 0) return;

  const cat = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  if (!cat) throw new Error("Categoría inválida");

  const count = await prisma.product.count({ where: { categoryId } });
  await prisma.product.create({
    data: { tenantId, categoryId, name, description, price, order: count },
  });
  revalidatePath("/dashboard/menu");
}

export async function toggleProductAction(id: string) {
  const tenantId = await getTenantId();
  const p = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { available: !p.available } });
  revalidatePath("/dashboard/menu");
}

export async function deleteProductAction(id: string) {
  const tenantId = await getTenantId();
  await prisma.product.deleteMany({ where: { id, tenantId } });
  revalidatePath("/dashboard/menu");
}
