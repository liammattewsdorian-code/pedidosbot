import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripeConfig() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    throw new Error("Stripe no esta configurado");
  }

  return {
    stripe: new Stripe(apiKey, {
      apiVersion: "2024-11-20.acacia" as any,
    }),
    webhookSecret,
  };
}

export async function POST(req: Request) {
  let stripe: Stripe;
  let webhookSecret: string;

  try {
    const config = getStripeConfig();
    stripe = config.stripe;
    webhookSecret = config.webhookSecret;
  } catch (err: any) {
    return new NextResponse(err.message, { status: 503 });
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const tenantId = session.metadata.tenantId;
      const plan = session.metadata.plan;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: "ACTIVE",
          plan,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscriptionId = session.id;
      await prisma.tenant.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: "SUSPENDED" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const customerId = session.customer as string;
      await prisma.tenant.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "SUSPENDED" },
      });
      break;
    }

    case "customer.subscription.updated": {
      const tenantId = session.metadata?.tenantId;
      if (tenantId && session.status === "active") {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { status: "ACTIVE" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
