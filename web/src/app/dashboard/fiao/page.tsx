import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFiaoEntryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function FiaoPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) return null;

  const [entries, customers] = await Promise.all([
    prisma.fiaoEntry.findMany({
      where: { tenantId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.customer.findMany({
      where: { tenantId },
      include: {
        fiaoEntries: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
        },
      },
      orderBy: [{ totalOrders: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  type CustomerWithFiao = (typeof customers)[number];
  type CustomerRow = { id: string; name: string; phone: string; balance: number };
  const customersWithBalance: CustomerRow[] = customers
    .map((customer: CustomerWithFiao): CustomerRow => ({
      id: customer.id,
      name: customer.name || customer.phone,
      phone: customer.phone,
      balance: Number(customer.fiaoEntries[0]?.balance ?? 0),
    }))
    .filter((customer: CustomerRow) => customer.balance > 0)
    .sort((a: CustomerRow, b: CustomerRow) => b.balance - a.balance);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="mb-1 text-3xl font-bold">Control de fiao</h1>
      <p className="mb-8 text-slate-500">
        Registra abonos, ajustes manuales y revisa balances por cliente.
      </p>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Clientes con balance"
          value={customersWithBalance.length.toString()}
        />
        <SummaryCard
          label="Balance pendiente"
          value={money(customersWithBalance.reduce((sum, customer) => sum + customer.balance, 0))}
        />
        <SummaryCard
          label="Movimientos recientes"
          value={entries.length.toString()}
        />
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Registrar movimiento</h2>
        <form action={createFiaoEntryAction} className="grid gap-3 md:grid-cols-2">
          <select name="customerId" required className="rounded-lg border px-4 py-2">
            <option value="">Selecciona un cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {(customer.name || customer.phone) + " - " + customer.phone}
              </option>
            ))}
          </select>
          <select name="mode" defaultValue="PAYMENT" className="rounded-lg border px-4 py-2">
            <option value="PAYMENT">Abono</option>
            <option value="ADJUSTMENT">Ajuste manual</option>
          </select>
          <select name="direction" defaultValue="decrease" className="rounded-lg border px-4 py-2">
            <option value="decrease">Reducir balance</option>
            <option value="increase">Aumentar balance</option>
          </select>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Monto"
            className="rounded-lg border px-4 py-2"
          />
          <input
            name="notes"
            placeholder="Nota opcional"
            className="rounded-lg border px-4 py-2 md:col-span-2"
          />
          <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white md:col-span-2">
            Guardar movimiento
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Balances actuales</h2>
        {customersWithBalance.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            No hay balances pendientes.
          </div>
        ) : (
          <div className="space-y-3">
            {customersWithBalance.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div>
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-sm text-slate-500">{customer.phone}</div>
                </div>
                <div className="text-right font-semibold text-amber-700">
                  {money(customer.balance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Movimientos recientes</h2>
        {entries.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            Aun no hay movimientos de fiao registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div>
                  <div className="font-semibold">
                    {entry.customer.name || entry.customer.phone}
                  </div>
                  <div className="text-sm text-slate-500">
                    {entry.type}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${Number(entry.amount) < 0 ? "text-red-700" : "text-slate-900"}`}>
                    {signedMoney(Number(entry.amount))}
                  </div>
                  <div className="text-sm text-slate-500">
                    Balance: {money(Number(entry.balance))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function money(amount: number) {
  return amount.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
  });
}

function signedMoney(amount: number) {
  const absolute = money(Math.abs(amount));
  if (amount < 0) return `- ${absolute}`;
  if (amount > 0) return `+ ${absolute}`;
  return absolute;
}
