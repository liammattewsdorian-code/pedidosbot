import Link from "next/link";
import { signupAction } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
          Empieza con PedidosBot
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500">
          Tu WhatsApp vendera solo en minutos.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={signupAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre del negocio
            </label>
            <input
              name="businessName"
              required
              placeholder="Colmado El Cruce"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipo de negocio
            </label>
            <select
              name="businessType"
              defaultValue="COLMADO"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="COLMADO">Colmado</option>
              <option value="RESTAURANT">Restaurante</option>
              <option value="PHARMACY">Farmacia</option>
              <option value="BAKERY">Panaderia</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              WhatsApp del negocio
            </label>
            <input
              name="whatsappNumber"
              required
              placeholder="18296403859"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre del dueno
            </label>
            <input
              name="ownerName"
              required
              placeholder="Juan Perez"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email de acceso
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contrasena
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button className="w-full rounded-lg bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-dark">
            Crear mi negocio
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-bold text-brand">
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  );
}
