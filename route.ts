import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      // El usuario completó el pago inicial
      const tenantId = session.metadata.tenantId;
      const plan = session.metadata.plan; // BASICO, PRO, PREMIUM

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planStatus: "ACTIVE",
          plan: plan,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      // Suscripción cancelada o pago fallido tras varios intentos
      const subscriptionId = session.id;
      await prisma.tenant.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { planStatus: "EXPIRED" },
      });
      break;
    }

    case "invoice.payment_failed": {
      // El pago falló, podrías marcar como PAST_DUE pero aquí lo simplificamos
      const customerId = session.customer as string;
      await prisma.tenant.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planStatus: "PAST_DUE" },
      });
      break;
    }
    
    case "customer.subscription.updated": {
       // Cambio de plan (Upgrade/Downgrade)
       const tenantId = session.metadata?.tenantId;
       if (tenantId && session.status === 'active') {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { planStatus: 'ACTIVE' }
          });
       }
       break;
    }
  }

  return NextResponse.json({ received: true });
}