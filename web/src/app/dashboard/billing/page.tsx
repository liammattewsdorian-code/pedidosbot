import { redirect } from "next/navigation";
import { createCheckoutSession } from "@/app/actions/stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      plan: true,
      status: true,
      subscriptionEndsAt: true,
    },
  });

  const subscriptionEndsAt = tenant?.subscriptionEndsAt ?? null;
  const isExpired =
    tenant?.status === "SUSPENDED" ||
    (tenant?.status === "TRIAL" &&
      subscriptionEndsAt !== null &&
      new Date() > subscriptionEndsAt);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Suscripcion y Facturacion</h1>
        <p className="text-slate-500">Gestiona el plan de tu negocio y los pagos.</p>
      </header>

      {isExpired && (
        <div className="mb-8 rounded-xl border-2 border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-lg font-bold">Tu periodo de prueba ha finalizado</h2>
          <p className="text-sm">
            Para seguir usando PedidosBot y que tu bot siga respondiendo a tus clientes,
            elige un plan a continuacion.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all ${
              tenant?.plan === plan.id
                ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                : "border-slate-200 bg-white"
            }`}
          >
            {tenant?.plan === plan.id && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase text-white">
                Tu Plan Actual
              </span>
            )}

            <h3 className="text-xl font-bold">{plan.name}</h3>
            <div className="my-4">
              <span className="text-3xl font-bold">RD${plan.price.toLocaleString()}</span>
              <span className="text-sm text-slate-500">/mes</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-500">+</span> {feature}
                </li>
              ))}
            </ul>

            <form action={createCheckoutSession.bind(null, plan.id)}>
              <button
                disabled={tenant?.plan === plan.id && !isExpired}
                className={`w-full rounded-lg py-3 text-sm font-bold transition ${
                  tenant?.plan === plan.id && !isExpired
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-brand text-white hover:bg-brand-dark"
                }`}
              >
                {tenant?.plan === plan.id ? "Renovar Plan" : "Cambiar a este plan"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}

const PLANS = [
  {
    id: "BASICO",
    name: "Basico",
    price: 2500,
    features: ["1 numero WhatsApp", "Menu digital", "Toma de pedidos"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 4500,
    features: ["Todo lo Basico", "Delivery por zonas", "Control de fiao"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 7500,
    features: ["Todo lo Pro", "Ingles automatico", "Analytics avanzados"],
  },
];
