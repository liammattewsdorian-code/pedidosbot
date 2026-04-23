"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});

export async function createCheckoutSession(planId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const user = session.user as any;
  
  // Mapeo de IDs de productos de Stripe (estos los crearás luego en tu dashboard de Stripe)
  // Por ahora usamos nombres descriptivos que Stripe acepta en modo prueba
  const planNames: Record<string, string> = {
    BASICO: "Plan Básico PedidosBot",
    PRO: "Plan Pro PedidosBot",
    PREMIUM: "Plan Premium PedidosBot",
  };

  const planPrices: Record<string, number> = {
    BASICO: 2500,
    PRO: 4500,
    PREMIUM: 7500,
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "dom",
          product_data: { name: planNames[planId] },
          unit_amount: planPrices[planId] * 100, // Stripe usa centavos
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: { tenantId: user.tenantId, plan: planId },
  });

  redirect(checkoutSession.url!);
}