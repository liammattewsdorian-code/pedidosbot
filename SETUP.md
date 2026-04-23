# Setup PedidosBot

## 1. Crear base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea un proyecto nuevo: `pedidosbot`
2. Copia la `DATABASE_URL` que te da
3. Configura las variables de entorno en el archivo `.env`:

### Variables Requeridas

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | Conexión a Neon PostgreSQL |
| `OPENAI_API_KEY` | Para Whisper (transcripción de audio) |
| `META_WEBHOOK_VERIFY_TOKEN` | Token para validar el webhook de Meta |
| `BOT_API_SECRET` | Secreto para comunicación Bot <-> Web |
| `AUTH_SECRET` | Requerido por NextAuth para la seguridad de la sesión |
| `NEXT_PUBLIC_APP_URL` | URL de producción (https://rapidoycriollo.com) |
| `BOT_API_URL` | URL del servicio del bot en producción |
| `CLIENT_KEY` | Llave de cliente para integraciones externas (Solo Prod/Preview) |

## 2. Instalar dependencias

```bash
# Bot service
cd bot
npm install
npx prisma generate --schema=../prisma/schema.prisma
npx prisma db push --schema=../prisma/schema.prisma

# Panel web
cd ../web
npm install
```

## 3. Arrancar en desarrollo

Terminal 1 (bot):
```bash
cd bot
npm run dev
```

Terminal 2 (panel):
```bash
cd web
npm run dev
```

- Panel: http://localhost:3000
- Bot API: http://localhost:3001/health

## 4. Crear primer tenant (seed manual)

Por ahora sin UI de onboarding — insertar directamente en DB:

```sql
INSERT INTO "Tenant" (id, slug, name, "businessType", plan, status, "whatsappNumber", "ownerPhone")
VALUES (
  'clxxxxx',
  'elarepero',
  'EL AREPERO',
  'RESTAURANT',
  'BASICO',
  'ACTIVE',
  '18296403859',
  '18296403859'
);
```

O usa Prisma Studio: `cd bot && npx prisma studio --schema=../prisma/schema.prisma`

## 5. Conectar WhatsApp (Meta Cloud API)

Este bot utiliza la API oficial de Meta para mayor estabilidad. Para conectar un negocio:

1. Crea una App en Meta for Developers (Tipo: Negocios).
2. Agrega el producto **WhatsApp**.
3. En **WhatsApp > Configuración de la API**, obtén el **Identificador de número de teléfono** (Phone Number ID).
4. Genera un **Token de acceso** (puedes usar el temporal para pruebas).
5. En el panel de PedidosBot, ingresa estos valores en la sección de conexión.
6. ¡Listo! El bot empezará a responder vía Meta Cloud API.

## Deploy producción (cuando esté listo)

- **DB**: Neon ya está en prod (mismo cluster que dev o uno nuevo)
- **Bot service**: Render / Railway / VPS (necesita Chrome)
- **Web**: Vercel
- **Dominio**: Configurado en Namecheap apuntando a Vercel:
  - A Record: `@` -> `76.76.21.21`
  - CNAME: `www` -> `cname.vercel-dns.com`
- **URL Final**: https://rapidoycriollo.com
- **Sesiones del Bot**: volumen persistente requerido para `./sessions/` (si no usas Meta Cloud API)

## Roadmap inmediato

- [x] Auth completa (NextAuth con credentials)
- [x] Onboarding: crear tenant desde el panel
- [x] Dashboard en vivo (SSE)
- [x] CRUD de productos/categorías
- [x] Detalle de pedidos y despacho
- [ ] Integración Stripe para pagos de suscripción
- [ ] Multi-idioma (ES/EN) en el bot
- [ ] Voice note transcription (Whisper)
