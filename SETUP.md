# Setup PedidosBot

## 1. Crear base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea un proyecto nuevo: `pedidosbot`
2. Copia la `DATABASE_URL`
3. Configura las variables de entorno en `.env`

### Variables requeridas

| Variable | Descripcion |
| :--- | :--- |
| `DATABASE_URL` | Conexion a Neon PostgreSQL |
| `OPENAI_API_KEY` | Para transcripcion de audio |
| `META_WEBHOOK_VERIFY_TOKEN` | Token para validar el webhook de Meta |
| `BOT_API_SECRET` | Secreto para comunicacion Bot <-> Web |
| `AUTH_SECRET` | Requerido por NextAuth |
| `NEXT_PUBLIC_APP_URL` | URL publica del panel web |
| `BOT_API_URL` | URL base del servicio del bot |
| `NEXT_PUBLIC_BOT_WEBHOOK_URL` | URL publica exacta del webhook, por ejemplo `https://tu-bot.com/webhook` |
| `CLIENT_KEY` | Llave de cliente para integraciones externas |

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
- Bot API: http://localhost:3010/health

## 4. Crear primer tenant

Ya existe onboarding desde el panel (`/signup`), pero si quieres sembrar uno manual:

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

Tambien puedes usar Prisma Studio:

```bash
npx prisma studio --schema=prisma/schema.prisma
```

## 5. Conectar WhatsApp (Meta Cloud API)

1. Crea una app en Meta for Developers
2. Agrega el producto **WhatsApp**
3. En **WhatsApp > Configuracion de la API**, copia el **Phone Number ID**
4. Genera un **Access Token**
5. En el panel de PedidosBot, guarda esas credenciales
6. Configura en Meta el webhook publico del bot, por ejemplo `https://tu-bot.com/webhook`
7. Usa `META_WEBHOOK_VERIFY_TOKEN` como token de verificacion

## Deploy de produccion

- **DB**: Neon
- **Bot service**: Render / Railway / VPS
- **Web**: Vercel
- **Webhook publico**: define `NEXT_PUBLIC_BOT_WEBHOOK_URL=https://tu-bot.com/webhook`
- **URL final panel**: por ejemplo `https://rapidoycriollo.com`

## Roadmap inmediato

- [x] Auth con NextAuth
- [x] Onboarding desde panel
- [x] Dashboard en vivo con SSE
- [x] CRUD de productos y categorias
- [x] Detalle de pedidos y despacho
- [x] Transcripcion de audio con OpenAI
- [ ] Integracion Stripe para suscripciones
- [ ] Analytics avanzados
- [ ] Reservas
- [ ] Gestion de multiples numeros por tenant
