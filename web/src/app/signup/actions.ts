"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

const schema = z.object({
  businessName: z.string().min(2).max(80),
  businessType: z.enum(["COLMADO", "RESTAURANT", "PHARMACY", "BAKERY", "OTHER"]),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Número inválido — solo dígitos (ej: 18296403859)"),
  ownerName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signupAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("Ya existe una cuenta con ese email")}`);
  }

  const slug = slugify(data.businessName) + "-" + Math.random().toString(36).slice(2, 6);
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        slug,
        name: data.businessName,
        businessType: data.businessType,
        plan: "TRIAL",
        status: "TRIAL",
        whatsappNumber: data.whatsappNumber,
        ownerPhone: data.whatsappNumber,
        subscriptionStartedAt: new Date(),
        subscriptionEndsAt: trialEnd,
        welcomeMessage: `¡Hola! 👋 Bienvenido a *${data.businessName}*.\n\n¿En qué te puedo ayudar hoy?`,
      },
    });

    await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.ownerName,
        password: hashedPassword,
        role: "OWNER",
        tenantId: tenant.id,
      },
    });
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirectTo: "/dashboard",
  });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}
