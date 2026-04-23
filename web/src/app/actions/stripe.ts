"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Stripe no esta configurado");
  }

  return new Stripe(apiKey, {
    apiVersion: "2024-11-20.acacia" as any,
  });
}

export async function createCheckoutSession(planId: string) {
  const stripe = getStripeClient();
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const planNames: Record<string, string> = {
    BASICO: "Plan Basico PedidosBot",
    PRO: "Plan Pro PedidosBot",
    PREMIUM: "Plan Premium PedidosBot",
  };

  const planPrices: Record<string, number> = {
    BASICO: 2500,
    PRO: 4500,
    PREMIUM: 7500,
  };

  if (!session.user.tenantId || !planNames[planId] || !planPrices[planId]) {
    throw new Error("Plan invalido");
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "dop",
          product_data: { name: planNames[planId] },
          unit_amount: planPrices[planId] * 100,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: { tenantId: session.user.tenantId, plan: planId },
  });

  redirect(checkoutSession.url!);
}
