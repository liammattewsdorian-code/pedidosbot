# PedidosBot 🇩🇴

SaaS multi-tenant de bots de WhatsApp para colmados, restaurantes y negocios de Punta Cana.

## Estructura

```
pedidosbot/
├── prisma/          → Schema de base de datos compartido
├── bot/             → Servicio Node.js con whatsapp-web.js (multi-sesión)
└── web/             → Panel de administración Next.js para los dueños
```

## Arquitectura

- **Una sesión de WhatsApp por cliente (tenant)**: cada negocio mantiene su propio número
- **Base de datos central (Neon Postgres)** con `tenant_id` en cada tabla
- **Panel web** donde el dueño edita su menú, ve pedidos, gestiona fiao
- **Bot service** escalable: 1 VPS = ~20-30 sesiones activas

## Planes

| Plan | Precio/mes | Features |
|------|-----------|----------|
| Básico | RD$2,500 | Atención auto + menú + pedidos |
| Pro | RD$4,500 | + Delivery + fiao + panel |
| Premium | RD$7,500 | + Inglés + reservas + analytics |

## Stack

- Node.js + whatsapp-web.js (bot)
- Next.js 15 + NextAuth (panel)
- Prisma + Neon Postgres (DB)
- Puppeteer headless (WhatsApp web)
