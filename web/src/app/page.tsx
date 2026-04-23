import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <Image 
            src="/logo-pedidosbot.png" 
            alt="PedidosBot Logo" 
            width={90} 
            height={90} 
            priority
            className="rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_rgba(34,197,94,0.45)] transition-shadow duration-500"
          />
        </Link>
        <div className="flex gap-4">
          <Link href="/login" className="text-slate-700 hover:text-brand font-medium">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-block bg-brand-light text-brand-dark px-3 py-1 rounded-full text-sm font-medium mb-6">
          🇩🇴 Hecho en RD · Para negocios de Punta Cana y todo el país
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Tu WhatsApp que <span className="text-brand">vende solo</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Bot inteligente que atiende a tus clientes 24/7, toma pedidos, maneja fiao
          y organiza tu delivery. Para colmados, restaurantes y cualquier negocio.
        </p>
        <div className="flex gap-4 justify-center flex-wrap items-center">
          <Link
            href="/signup"
            className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Probar 14 días gratis
          </Link>
          <Link
            href="https://wa.me/18296403859?text=Hola!%20Quiero%20ver%20la%20demo%20de%20PedidosBot"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-sm"
          >
            <span>📱</span> Ver Demo en Vivo
          </Link>
          <a
            href="https://wa.me/18296403859?text=Hola!%20Necesito%20hablar%20con%20un%20asesor%20de%20PedidosBot"
            className="bg-white border-2 border-slate-300 hover:border-brand text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Contacto Directo
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section id="precios" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-3">Precios simples</h2>
        <p className="text-center text-slate-600 mb-12">Sin contratos. Cancela cuando quieras.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-8 ${
                p.featured
                  ? "bg-brand text-white ring-4 ring-brand/30 scale-105"
                  : "bg-white border border-slate-200"
              }`}
            >
              <h3 className="font-bold text-xl mb-2">{p.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">RD${p.price.toLocaleString()}</span>
                <span className={p.featured ? "text-white/80" : "text-slate-500"}>/mes</span>
              </div>
              <ul className="space-y-2 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center py-3 rounded-lg font-semibold ${
                  p.featured ? "bg-white text-brand" : "bg-brand text-white hover:bg-brand-dark"
                }`}
              >
                Empezar
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        PedidosBot · Hecho con 🥥 en Punta Cana, RD
      </footer>
    </main>
  );
}

const FEATURES = [
  { icon: "🤖", title: "Atención 24/7", desc: "Tu bot nunca duerme. Responde saludos, horarios, menú y precios automáticamente." },
  { icon: "🛒", title: "Pedidos automáticos", desc: "Los clientes hacen su pedido por WhatsApp y le llega formateado al dueño." },
  { icon: "📓", title: "Control de fiao", desc: "Adiós a la libreta. El bot lleva cuenta de quién debe cuánto y les recuerda." },
  { icon: "🏍️", title: "Delivery por zonas", desc: "Define tus zonas con costos distintos. El cliente sabe lo que paga antes de pedir." },
  { icon: "🇺🇸", title: "Inglés automático", desc: "Ideal para Punta Cana: el bot habla español e inglés con tus clientes turistas." },
  { icon: "📊", title: "Panel de control", desc: "Ves pedidos, ventas, clientes frecuentes y edita tu menú desde el celular." },
];

const PLANS = [
  {
    name: "Básico",
    price: 2500,
    featured: false,
    features: ["1 número de WhatsApp", "Menú digital", "Toma de pedidos", "FAQ automático", "Soporte por WhatsApp"],
  },
  {
    name: "Pro",
    price: 4500,
    featured: true,
    features: ["Todo lo del Básico", "Delivery por zonas", "Control de fiao", "Panel de control", "Notificaciones al dueño"],
  },
  {
    name: "Premium",
    price: 7500,
    featured: false,
    features: ["Todo lo del Pro", "Inglés automático", "Reservas de mesa", "Analytics avanzados", "Hasta 3 números"],
  },
];
