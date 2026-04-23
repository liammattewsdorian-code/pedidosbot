import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createCheckoutSession } from "@/../../stripe";

export default async function BillingPage() {
  const session = await auth();
  const user = session?.user as any;

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      plan: true,
      status: true,
      subscriptionEndsAt: true,
    }
  });

  const isExpired = tenant?.status === 'SUSPENDED' || 
    (tenant?.status === 'TRIAL' && tenant.subscriptionEndsAt && new Date() > tenant.subscriptionEndsAt);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Suscripción y Facturación</h1>
        <p className="text-slate-500">Gestiona el plan de tu negocio y los pagos.</p>
      </header>

      {isExpired && (
        <div className="mb-8 rounded-xl border-2 border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-lg font-bold">Tu periodo de prueba ha finalizado</h2>
          <p className="text-sm">Para seguir usando PedidosBot y que tu bot siga respondiendo a tus clientes, por favor elige un plan a continuación.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all ${
              tenant?.plan === plan.id 
                ? "border-brand ring-2 ring-brand/20 bg-brand/5" 
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
              <span className="text-slate-500 text-sm">/mes</span>
            </div>
            
            <ul className="mb-8 space-y-3 flex-1 text-sm text-slate-600">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>

            <form action={createCheckoutSession.bind(null, plan.id)}>
              <button 
                disabled={tenant?.plan === plan.id && !isExpired}
                className={`w-full rounded-lg py-3 text-sm font-bold transition ${
                  tenant?.plan === plan.id && !isExpired
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-brand text-white hover:bg-brand-dark"
                }`}
              >
                {tenant?.plan === plan.id ? 'Renovar Plan' : 'Cambiar a este plan'}
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
    name: "Básico",
    price: 2500,
    features: ["1 número WhatsApp", "Menú digital", "Toma de pedidos"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 4500,
    features: ["Todo lo Básico", "Delivery por zonas", "Control de fiao"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 7500,
    features: ["Todo lo Pro", "Inglés automático", "Analytics avanzados"],
  },
];