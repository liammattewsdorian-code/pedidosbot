import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createZoneAction,
  deleteZoneAction,
  toggleZoneAction,
  updateZoneAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ZonesPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) return null;

  const zones = await prisma.deliveryZone.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="mb-1 text-3xl font-bold">Zonas de delivery</h1>
      <p className="mb-8 text-slate-500">
        Administra costos de entrega, minimo por zona y tiempos estimados.
      </p>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Nueva zona</h2>
        <form action={createZoneAction} className="grid gap-3 md:grid-cols-5">
          <input name="name" required placeholder="Bavaro Centro" className="rounded-lg border px-4 py-2" />
          <input name="fee" type="number" min="0" step="0.01" required placeholder="150" className="rounded-lg border px-4 py-2" />
          <input name="minOrder" type="number" min="0" step="0.01" placeholder="500" className="rounded-lg border px-4 py-2" />
          <input name="estimatedMinutes" type="number" min="0" placeholder="25" className="rounded-lg border px-4 py-2" />
          <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
            Crear zona
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {zones.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            Todavia no hay zonas configuradas.
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <form
                key={zone.id}
                action={updateZoneAction.bind(null, zone.id)}
                className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
              >
                <input name="name" defaultValue={zone.name} className="rounded-lg border px-4 py-2" />
                <input name="fee" type="number" min="0" step="0.01" defaultValue={Number(zone.fee)} className="rounded-lg border px-4 py-2" />
                <input name="minOrder" type="number" min="0" step="0.01" defaultValue={zone.minOrder ? Number(zone.minOrder) : ""} className="rounded-lg border px-4 py-2" />
                <input name="estimatedMinutes" type="number" min="0" defaultValue={zone.estimatedMinutes ?? ""} className="rounded-lg border px-4 py-2" />
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    Guardar
                  </button>
                  <button
                    formAction={toggleZoneAction.bind(null, zone.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      zone.active
                        ? "bg-amber-100 text-amber-900"
                        : "bg-green-100 text-green-900"
                    }`}
                  >
                    {zone.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    formAction={deleteZoneAction.bind(null, zone.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="text-sm text-slate-500 md:col-span-5">
                  {zone.active ? "Zona activa" : "Zona inactiva"} ·{" "}
                  {zone.estimatedMinutes
                    ? `${zone.estimatedMinutes} min estimados`
                    : "Tiempo no definido"}
                </div>
              </form>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
