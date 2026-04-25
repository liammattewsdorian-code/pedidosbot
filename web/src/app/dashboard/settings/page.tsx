import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTenantSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

export default async function SettingsPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      businessType: true,
      whatsappNumber: true,
      ownerPhone: true,
      address: true,
      city: true,
      plan: true,
      timezone: true,
      currency: true,
      language: true,
      exchangeRate: true, // Añadimos la tasa de cambio
      deliveryEnabled: true,
      fiaoEnabled: true,
      welcomeMessage: true,
      closedMessage: true,
      googleMapsUrl: true,
      instagramUrl: true,
      websiteUrl: true,
      logoUrl: true,
      schedule: true,
    },
  });

  if (!tenant) return null;

  const schedule = (tenant.schedule as Record<string, any>) ?? {};

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="mb-1 text-3xl font-bold text-white">Configuración</h1>
      <p className="mb-8 text-gray-400">
        Edita los datos del negocio, horarios y mensajes del bot.
      </p>

      <form action={updateTenantSettingsAction} className="space-y-8">

        {/* ── Datos del negocio ── */}
        <Card title="Datos del negocio">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del negocio">
              <input name="name" defaultValue={tenant.name} required className={input} />
            </Field>
            <Field label="Tipo de negocio">
              <select name="businessType" defaultValue={tenant.businessType} className={input}>
                <option value="RESTAURANT">Restaurante</option>
                <option value="COLMADO">Colmado</option>
                <option value="PHARMACY">Farmacia</option>
                <option value="BAKERY">Panadería</option>
                <option value="OTHER">Otro</option>
              </select>
            </Field>
            <Field label="WhatsApp del negocio">
              <input name="whatsappNumber" defaultValue={tenant.whatsappNumber} required className={input} placeholder="18091234567" />
            </Field>
            <Field label="Teléfono personal del dueño">
              <input name="ownerPhone" defaultValue={tenant.ownerPhone || ""} className={input} placeholder="18091234567" />
            </Field>
            <Field label="Ciudad">
              <input name="city" defaultValue={tenant.city || ""} className={input} placeholder="Punta Cana" />
            </Field>
            <Field label="Dirección">
              <input name="address" defaultValue={tenant.address || ""} className={input} placeholder="Calle 5, Bávaro" />
            </Field>
          </div>
        </Card>

        {/* ── Operación ── */}
        <Card title="Operación">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Zona horaria">
              <select name="timezone" defaultValue={tenant.timezone} className={input}>
                <option value="America/Santo_Domingo">Santo Domingo (AST)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="America/Chicago">Chicago (CST)</option>
                <option value="America/Los_Angeles">Los Angeles (PST)</option>
                <option value="America/Bogota">Bogotá (COT)</option>
                <option value="America/Mexico_City">México DF (CST)</option>
                <option value="America/Lima">Lima (PET)</option>
                <option value="America/Santiago">Santiago (CLT)</option>
              </select>
            </Field>
            <Field label="Tasa de cambio (DOP a USD)">
              <input name="exchangeRate" defaultValue={tenant.exchangeRate?.toString() || "60.00"} type="number" step="0.01" required className={input} />
              <p className="mt-1 text-xs text-slate-500">Para mostrar precios en USD a clientes en inglés.</p>
            </Field>
            <Field label="Moneda">
              <select name="currency" defaultValue={tenant.currency} className={input}>
                <option value="DOP">DOP — Peso dominicano</option>
                <option value="USD">USD — Dólar americano</option>
                <option value="EUR">EUR — Euro</option>
                <option value="COP">COP — Peso colombiano</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="PEN">PEN — Sol peruano</option>
              </select>
            </Field>
            <Field label="Idioma del bot">
              <select name="language" defaultValue={tenant.language} className={input}>
                <option value="ES">Español</option>
                <option value="EN">English</option>
                <option value="BOTH">Ambos (auto)</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Toggle
              name="deliveryEnabled"
              defaultChecked={tenant.deliveryEnabled}
              title="Delivery activo"
              desc="Permite pedir con dirección y zona."
            />
            <Toggle
              name="fiaoEnabled"
              defaultChecked={tenant.fiaoEnabled}
              title="Fiao activo"
              desc="Habilita balance y cobros en el bot."
            />
          </div>
        </Card>

        {/* ── Horario ── */}
        <Card title="Horario de atención">
          <p className="mb-4 text-sm text-gray-500">
            Si no defines horario, el bot responde 24/7. Marca "Cerrado" para los días que no trabajes.
          </p>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const day = schedule[key] as any;
              const isClosed = day?.closed === true;
              const open = isClosed ? "" : (day?.open ?? "08:00");
              const close = isClosed ? "" : (day?.close ?? "22:00");
              return (
                <div key={key} className="grid grid-cols-[6rem_auto_auto_1fr] items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3">
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      name={`schedule_${key}_closed`}
                      defaultChecked={isClosed}
                      className="h-4 w-4 rounded"
                    />
                    Cerrado
                  </label>
                  <Field label="Abre">
                    <input
                      type="time"
                      name={`schedule_${key}_open`}
                      defaultValue={open || "08:00"}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    />
                  </Field>
                  <Field label="Cierra">
                    <input
                      type="time"
                      name={`schedule_${key}_close`}
                      defaultValue={close || "22:00"}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Mensajes del bot ── */}
        <Card title="Mensajes del bot">
          <div className="space-y-4">
            <Field label="Mensaje de bienvenida">
              <textarea
                name="welcomeMessage"
                defaultValue={tenant.welcomeMessage || ""}
                rows={4}
                placeholder="¡Hola! Bienvenido a {nombre}. ¿En qué te puedo ayudar?"
                className={`${input} resize-none`}
              />
            </Field>
            <Field label="Mensaje fuera de horario">
              <textarea
                name="closedMessage"
                defaultValue={tenant.closedMessage || ""}
                rows={3}
                placeholder="Estamos cerrados por el momento. Nuestro horario es..."
                className={`${input} resize-none`}
              />
            </Field>
          </div>
        </Card>

        {/* ── Redes sociales ── */}
        <Card title="Redes y presencia online">
          <div className="grid gap-4">
            <Field label="Google Maps URL">
              <input name="googleMapsUrl" defaultValue={tenant.googleMapsUrl || ""} className={input} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="Instagram URL">
              <input name="instagramUrl" defaultValue={tenant.instagramUrl || ""} className={input} placeholder="https://instagram.com/tunegocio" />
            </Field>
            <Field label="Sitio web">
              <input name="websiteUrl" defaultValue={tenant.websiteUrl || ""} className={input} placeholder="https://tunegocio.com" />
            </Field>
            <Field label="Logo URL">
              <input name="logoUrl" defaultValue={tenant.logoUrl || ""} className={input} placeholder="https://cdn.tunegocio.com/logo.png" />
            </Field>
          </div>
        </Card>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between rounded-xl bg-gray-800/30 border border-gray-800 px-5 py-4 text-sm text-gray-400">
          <div>
            <div className="font-semibold text-gray-200">Plan actual</div>
            <div>{tenant.plan}</div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-green-500 hover:bg-green-600 px-6 py-2.5 font-semibold text-white transition"
          >
            Guardar cambios
          </button>
        </div>

      </form>
    </main>
  );
}

const input = "w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
      <h2 className="mb-5 text-base font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      {children}
    </label>
  );
}

function Toggle({
  name, defaultChecked, title, desc,
}: { name: string; defaultChecked: boolean; title: string; desc: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/30 p-4 transition hover:border-green-500/30">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded accent-green-500" />
      <div>
        <div className="font-semibold text-gray-200">{title}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
    </label>
  );
}
