import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pedidosbot.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PedidosBot — Ventas y pedidos por WhatsApp para tu negocio",
    template: "%s | PedidosBot",
  },
  description:
    "Automatiza tus pedidos por WhatsApp. Bot inteligente para colmados, restaurantes y delivery en República Dominicana. Gratis hasta 1,000 conversaciones al mes. Sin riesgo de ban.",
  keywords: [
    "bot de pedidos WhatsApp",
    "WhatsApp Business bot",
    "pedidos online colmado",
    "sistema de pedidos restaurante",
    "delivery República Dominicana",
    "automatizar ventas WhatsApp",
    "bot para negocios RD",
    "chatbot pedidos",
    "gestión de pedidos WhatsApp",
    "colmado digital",
  ],
  authors: [{ name: "PedidosBot" }],
  creator: "PedidosBot",
  publisher: "PedidosBot",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: APP_URL,
    siteName: "PedidosBot",
    title: "PedidosBot — Ventas y pedidos por WhatsApp para tu negocio",
    description:
      "Tu negocio toma pedidos solo por WhatsApp las 24 horas. Sin apps, sin complicaciones. Gratis hasta 1,000 conversaciones al mes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PedidosBot — Bot de pedidos para WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PedidosBot — Pedidos por WhatsApp automáticos",
    description:
      "Automatiza tus ventas por WhatsApp. Ideal para colmados, restaurantes y delivery en RD.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
