# PedidosBot — Plan de Lanzamiento
**Producto:** SaaS de WhatsApp ordering para negocios dominicanos  
**Dominio:** rapidoycriollo.com  
**Stack:** Next.js 15 + Node.js + PostgreSQL (Neon) + Meta Cloud API  
**Deploy:** Vercel (web) + Render (bot) + GitHub (código)

---

## Estado Actual (24 abril 2026)

| Componente | Estado | Notas |
|---|---|---|
| Web (rapidoycriollo.com) | ✅ Live | Vercel, Root Dir = `web` |
| Bot (Render) | ✅ Corriendo | `https://pedidosbot-w5vz.onrender.com` |
| Base de datos (Neon) | ✅ Activa | Schema completo con Stripe |
| Auth / Login / Signup | ✅ Funciona | NextAuth v5 |
| Dashboard multi-tenant | ✅ Funciona | Stats reales |
| Panel Super Admin | ✅ Funciona | `/dashboard/admin` |
| Billing (UI) | ✅ Existe | 3 planes DOP |
| BOT_API_SECRET | ❌ Mismatch | Render tiene valor de 65 chars |
| META_WEBHOOK_VERIFY_TOKEN | ❌ Mismatch | Render tiene valor desconocido |
| WhatsApp conectado | ❌ Pendiente | Bloqueado por SECRET mismatch |
| Stripe | ❌ Sin cuenta | No hay STRIPE_SECRET_KEY |
| Render auto-deploy | ❌ Manual | No está conectado a GitHub auto |

---

## BLOQUE 1 — Arreglar Variables de Entorno en Render
**Prioridad: CRÍTICA — Bloquea todo lo demás**

### Pasos exactos:
1. Ir a `https://dashboard.render.com/web/srv-d7k7ge2qqhas73bv8t50/env`
2. Cambiar `BOT_API_SECRET` → `pedidosbot_internal_2024`
3. Cambiar `META_WEBHOOK_VERIFY_TOKEN` → `pedidosbot_verify_token`
4. Hacer clic en **Save Changes**
5. Esperar redeploy (~2 min) — verificar en logs: `length=24`

### Verificación:
```bash
curl https://pedidosbot-w5vz.onrender.com/health
# Debe responder: {"ok":true,"mode":"meta-cloud-api",...}

curl "https://pedidosbot-w5vz.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=pedidosbot_verify_token&hub.challenge=TEST"
# Debe responder: TEST
```

---

## BLOQUE 2 — Conectar Meta Webhook
**Prioridad: CRÍTICA**

### Pasos exactos:
1. Ir a `https://developers.facebook.com/apps/1513085507075749/whatsapp-business/wa-dev-console`
2. Menú izquierdo → **Configuración**
3. En **URL de devolución de llamada**: `https://pedidosbot-w5vz.onrender.com/webhook`
4. En **Token de verificación**: `pedidosbot_verify_token`
5. Clic en **Verificar y guardar** ← debe mostrar ✅ verde
6. Bajar en la página → campo **messages** → activar toggle **Suscribirse**

### Datos del número:
- Phone Number ID: `1050880474779772`
- Número: `+1 829-640-3859`
- Nombre: El Arepero
- Token: el `EAAVgJ...` generado (dura 24h — para producción necesitas System User Token)

---

## BLOQUE 3 — Conectar WhatsApp en el Panel
**Prioridad: CRÍTICA**

### Pasos:
1. Ir a `https://rapidoycriollo.com/dashboard/whatsapp`
2. Ingresar:
   - **Phone Number ID**: `1050880474779772`
   - **Access Token**: `EAAVgJ...` (el token de Meta)
   - **WABA ID**: opcional, dejarlo vacío
3. Clic en **Conectar**
4. Debe aparecer ✅ "Conectado: +1 829-640-3859 (El Arepero)"

### Si falla:
- Verificar que Render esté despierto (hacer GET a /health primero)
- Verificar que BOT_API_SECRET coincida en ambos lados
- El token temporal dura 24h — si expiró, generar uno nuevo en Meta

---

## BLOQUE 4 — Token Permanente de Meta (System User)
**Prioridad: ALTA — El token temporal expira cada 24h**

### Pasos:
1. Ir a `https://business.facebook.com` → tu Business → **Configuración del sistema**
2. **Usuarios del sistema** → **Agregar** → tipo: Admin
3. **Generar token de acceso** → selecciona tu app → permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
4. Copiar el token permanente (empieza con `EAAxxxxxxx` pero no expira)
5. Actualizar el token en `rapidoycriollo.com/dashboard/whatsapp`

---

## BLOQUE 5 — Configurar Auto-Deploy en Render
**Prioridad: MEDIA**

Actualmente Render no se actualiza automáticamente cuando hago push a GitHub.

### Opción A — Desde Render Dashboard:
1. Render → tu servicio → **Settings**
2. Buscar **"Auto-Deploy"** → activar **"Yes"**

### Opción B — Ya funciona con GitHub Actions (verificar):
- Si hay un archivo `.github/workflows/`, ya está configurado

---

## BLOQUE 6 — Stripe (Pagos de Suscripción)
**Prioridad: ALTA para venta**

### Pasos cuando tengas la cuenta de Stripe:

**6.1 — Crear productos en Stripe:**
- Plan Básico: RD$2,500/mes → ID del precio
- Plan Pro: RD$4,500/mes → ID del precio  
- Plan Premium: RD$7,500/mes → ID del precio

**6.2 — Actualizar código con Price IDs:**
Archivo: `web/src/app/actions/stripe.ts`
```typescript
const PRICE_IDS: Record<string, string> = {
  BASICO: "price_xxxxxxxxxx",
  PRO: "price_xxxxxxxxxx",
  PREMIUM: "price_xxxxxxxxxx",
};
```

**6.3 — Configurar variables en Vercel:**
- `STRIPE_SECRET_KEY` = `sk_live_xxx...`
- `STRIPE_WEBHOOK_SECRET` = (del dashboard de Stripe → Webhooks)

**6.4 — Registrar webhook en Stripe:**
- URL: `https://rapidoycriollo.com/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`, `customer.subscription.updated`

---

## BLOQUE 7 — Publicar App en Meta (Producción Real)
**Prioridad: ALTA**

Actualmente la app de Meta está en modo desarrollo. Solo usuarios admin/desarrolladores pueden probarla.

### Pasos:
1. Meta Developer → tu app → **Revisión de la app**
2. Agregar permiso: `whatsapp_business_messaging`
3. Enviar para revisión con descripción del uso
4. Tiempo de aprobación: 1-5 días hábiles

**Nota:** Sin esto, solo tú puedes probar el bot. Los clientes reales no recibirán mensajes.

---

## BLOQUE 8 — DNS y Dominio Final
**Prioridad: MEDIA (ya funciona pero verificar)**

### Verificar:
- `rapidoycriollo.com` → apunta a Vercel ✅ (confirmado)
- `www.rapidoycriollo.com` → verificar redirección
- `bot.rapidoycriollo.com` → CNAME a `pedidosbot-w5vz.onrender.com` (opcional, para URL más limpia)

---

## BLOQUE 9 — Contenido del Negocio (El Arepero)
**Prioridad: MEDIA**

### En el panel `rapidoycriollo.com/dashboard`:
- [ ] Agregar productos al menú con precios y fotos
- [ ] Configurar zonas de delivery con costos
- [ ] Configurar horarios de atención
- [ ] Configurar mensaje de bienvenida personalizado
- [ ] Configurar `ownerPhone` para recibir notificaciones

---

## BLOQUE 10 — Mejoras Técnicas Pendientes
**Prioridad: BAJA (para después del lanzamiento)**

### Código:
- [ ] Eliminar archivos huérfanos: `bot/src/handlers/page.tsx`, `page.tsx` raíz, `stripe.ts` raíz, `route.ts` raíz
- [ ] OG images reales (actualmente son 1x1px)
- [ ] Dashboard de analytics (modelo existe en DB, falta UI)
- [ ] Email al dueño cuando llega un pedido
- [ ] Onboarding guiado para nuevos tenants

### Infraestructura:
- [ ] Upgrade Render a plan pago (eliminar cold start de 50s)
- [ ] Configurar uptime monitor (ej. UptimeRobot pings cada 5 min para mantener bot despierto)

---

## Orden Recomendado Esta Semana

```
Hoy:
  1. ✅ Arreglar Render env vars (BOT_API_SECRET + META_WEBHOOK_VERIFY_TOKEN)
  2. ✅ Verificar Meta webhook
  3. ✅ Conectar WhatsApp en panel
  4. ✅ Prueba real: enviar mensaje al +1 829-640-3859 desde otro número

Mañana:
  5. Generar System User Token (permanente)
  6. Activar auto-deploy en Render
  7. Agregar menú y productos en el panel

Esta semana:
  8. Crear cuenta Stripe + configurar planes
  9. Publicar app en Meta para producción
  10. Primer cliente de prueba real
```

---

## Variables de Entorno — Referencia Completa

### Render (bot):
```env
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
BOT_API_SECRET=pedidosbot_internal_2024
META_WEBHOOK_VERIFY_TOKEN=pedidosbot_verify_token
BOT_PUBLIC_URL=https://pedidosbot-w5vz.onrender.com
BOT_PORT=3010
NODE_ENV=production
```

### Vercel (web):
```env
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
AUTH_SECRET=[valor existente]
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://rapidoycriollo.com
BOT_API_URL=https://pedidosbot-w5vz.onrender.com
BOT_API_SECRET=pedidosbot_internal_2024
NEXT_PUBLIC_BOT_WEBHOOK_URL=https://pedidosbot-w5vz.onrender.com/webhook
STRIPE_SECRET_KEY=[cuando tengas cuenta]
STRIPE_WEBHOOK_SECRET=[cuando tengas cuenta]
```

---

## Comandos Útiles (ejecutar desde VSCode)

```bash
# Aplicar schema a Neon
npx prisma db push --schema=prisma/schema.prisma

# Ver datos en la DB
npx prisma studio

# Test webhook local con ngrok
ngrok http 3010

# Verificar bot en Render
curl https://pedidosbot-w5vz.onrender.com/health

# Test webhook verification
curl "https://pedidosbot-w5vz.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=pedidosbot_verify_token&hub.challenge=TEST"
```

---

*Última actualización: 24 abril 2026*
