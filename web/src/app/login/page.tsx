import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; redirect?: string }> }) {
  const { error, redirect } = await searchParams;
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <span className="text-3xl">🤖</span>
          <span className="font-bold text-xl">PedidosBot</span>
        </Link>
        <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            Email o contraseña incorrectos
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="redirect" value={redirect || "/dashboard"} />
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input name="password" type="password" required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <button type="submit"
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition">
            Entrar
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6 text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-brand font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
