import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-200">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-[#0b0f14]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-sm font-bold text-white">PB</div>
            <span className="font-bold text-white text-lg">PedidosBot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Probar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          🇩🇴 Hecho en RD · Para colmados, restaurantes y negocios dominicanos
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Tu WhatsApp que<br />
          <span className="text-green-400">vende solo las 24 horas</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bot inteligente que atiende clientes, toma pedidos, maneja el fiao y organiza tu delivery.
          Sin apps, sin complicaciones — solo WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Probar 14 días gratis
          </Link>
          <a
            href="https://wa.me/18296403859?text=Hola!%20Quiero%20ver%20la%20demo%20de%20PedidosBot"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
          >
            📱 Ver demo en vivo
          </a>
        </div>

        <p className="text-gray-500 text-sm mt-6">Sin tarjeta de crédito · Cancela cuando quieras</p>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-y border-gray-800 bg-[#0f172a] py-8">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap justify-center gap-8 text-center">
          {[
            { n: "24/7", label: "Atención automática" },
            { n: "+100", label: "Negocios activos" },
            { n: "0", label: "Apps que instalar" },
            { n: "14 días", label: "Prueba gratis" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.n}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-3">Así de fácil funciona</h2>
        <p className="text-gray-400 text-center mb-12">Configuras una vez, el bot trabaja solo para siempre</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "1", icon: "📋", title: "Carga tu menú", desc: "Agrega tus productos, precios y fotos desde el panel en minutos." },
            { n: "2", icon: "📱", title: "Conecta WhatsApp", desc: "Vincula tu número de WhatsApp Business con la API oficial de Meta." },
            { n: "3", icon: "🤖", title: "El bot trabaja solo", desc: "Recibe pedidos, responde preguntas y notifica al dueño automáticamente." },
          ].map((step) => (
            <div key={step.n} className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
              <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold flex items-center justify-center mb-4">
                {step.n}
              </div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#0f172a] border-y border-gray-800 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-white text-center mb-3">Todo lo que tu negocio necesita</h2>
          <p className="text-gray-400 text-center mb-12">Sin complicaciones técnicas</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 bg-[#111827] rounded-2xl border border-gray-800 hover:border-green-500/30 transition-colors">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-3">Precios simples</h2>
        <p className="text-gray-400 text-center mb-12">Sin contratos. Cancela cuando quieras.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 relative ${
                p.featured
                  ? "bg-green-500 text-white ring-2 ring-green-400/50"
                  : "bg-[#111827] border border-gray-800"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              <h3 className={`font-bold text-xl mb-1 ${p.featured ? "text-white" : "text-white"}`}>{p.name}</h3>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${p.featured ? "text-white" : "text-white"}`}>
                  RD${p.price.toLocaleString()}
                </span>
                <span className={`text-sm ${p.featured ? "text-white/70" : "text-gray-500"}`}>/mes</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${p.featured ? "text-white/90" : "text-gray-300"}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${p.featured ? "text-white" : "text-green-400"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                  p.featured
                    ? "bg-white text-green-600 hover:bg-gray-100"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                Empezar ahora
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#0f172a] border-t border-gray-800 py-20">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para vender más sin esfuerzo?</h2>
          <p className="text-gray-400 mb-8">Empieza hoy, configura en 10 minutos y tu bot estará atendiendo clientes esta misma noche.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Crear cuenta gratis
            </Link>
            <a
              href="https://wa.me/18296403859?text=Hola!%20Necesito%20informacion%20sobre%20PedidosBot"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-xs font-bold text-white">PB</div>
            <span className="font-semibold text-white">PedidosBot</span>
          </div>
          <p className="text-gray-500 text-sm">Hecho con 🥥 en Punta Cana, República Dominicana</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Iniciar sesión</Link>
            <Link href="/signup" className="hover:text-gray-300 transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

const FEATURES = [
  { icon: "🤖", title: "Atención 24/7", desc: "Responde saludos, horarios, menú y preguntas frecuentes sin que hagas nada." },
  { icon: "🛒", title: "Pedidos automáticos", desc: "El cliente hace su pedido por WhatsApp y te llega al panel en tiempo real." },
  { icon: "📓", title: "Control de fiao", desc: "Adiós a la libreta. El bot lleva la cuenta de quién debe cuánto." },
  { icon: "🏍️", title: "Delivery por zonas", desc: "Define zonas con costos distintos. El cliente paga justo antes de confirmar." },
  { icon: "🇺🇸", title: "Inglés automático", desc: "El bot detecta si el cliente escribe en inglés y responde automáticamente." },
  { icon: "📊", title: "Panel de control", desc: "Gestiona pedidos, ventas y catálogo desde cualquier dispositivo." },
];

const PLANS = [
  {
    name: "Básico",
    price: 2500,
    featured: false,
    features: ["1 número WhatsApp", "Menú digital", "Toma de pedidos", "FAQ automático", "Soporte WhatsApp"],
  },
  {
    name: "Pro",
    price: 4500,
    featured: true,
    features: ["Todo lo del Básico", "Delivery por zonas", "Control de fiao", "Panel completo", "Notificaciones al dueño"],
  },
  {
    name: "Premium",
    price: 7500,
    featured: false,
    features: ["Todo lo del Pro", "Inglés automático", "Analytics avanzados", "Hasta 3 números", "Soporte prioritario"],
  },
];
