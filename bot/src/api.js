import { Router } from 'express';
import { EventEmitter } from 'events';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { sendTextMessage, verifyCredentials } from './meta/client.js';

export const orderEvents = new EventEmitter();

export function createApiRouter() {
  const router = Router();

  // Auth interna
  router.use((req, res, next) => {
    const secret = req.headers['x-api-secret'];
    if (!process.env.BOT_API_SECRET || secret !== process.env.BOT_API_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  });

  // Guardar/actualizar credenciales Meta de un tenant
  router.post('/sessions/:tenantId/credentials', async (req, res) => {
    const { tenantId } = req.params;
    const { phoneNumberId, accessToken, wabaId } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: 'phoneNumberId y accessToken son requeridos' });
    }

    try {
      // Verificar que las credenciales son válidas
      const info = await verifyCredentials(phoneNumberId, accessToken);
      if (!info) {
        return res.status(400).json({ error: 'Credenciales inválidas — verifica el Phone Number ID y el Access Token' });
      }

      await prisma.whatsAppSession.upsert({
        where: { tenantId },
        create: {
          tenantId,
          status: 'CONNECTED',
          phoneNumber: info.display_phone_number,
          metaPhoneNumberId: phoneNumberId,
          metaAccessToken: accessToken,
          metaWabaId: wabaId || null,
          lastConnectedAt: new Date(),
        },
        update: {
          status: 'CONNECTED',
          phoneNumber: info.display_phone_number,
          metaPhoneNumberId: phoneNumberId,
          metaAccessToken: accessToken,
          metaWabaId: wabaId || null,
          lastConnectedAt: new Date(),
        },
      });

      res.json({ ok: true, phoneNumber: info.display_phone_number, verifiedName: info.verified_name });
    } catch (err) {
      logger.error({ err }, 'Error saving Meta credentials');
      res.status(500).json({ error: err.message });
    }
  });

  // Desconectar (borrar credenciales)
  router.post('/sessions/:tenantId/disconnect', async (req, res) => {
    const { tenantId } = req.params;
    await prisma.whatsAppSession.upsert({
      where: { tenantId },
      create: { tenantId, status: 'DISCONNECTED' },
      update: { status: 'DISCONNECTED', metaPhoneNumberId: null, metaAccessToken: null, metaWabaId: null },
    });
    res.json({ ok: true });
  });

  // Estado actual
  router.get('/sessions/:tenantId', async (req, res) => {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId: req.params.tenantId },
      select: { status: true, phoneNumber: true, metaPhoneNumberId: true, metaWabaId: true, lastConnectedAt: true },
    });
    res.json(session || { status: 'DISCONNECTED' });
  });

  // Enviar mensaje manual desde el panel
  router.post('/sessions/:tenantId/send', async (req, res) => {
    const { to, message } = req.body;
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId: req.params.tenantId },
    });
    if (!session?.metaPhoneNumberId) {
      return res.status(404).json({ error: 'Sesión no configurada' });
    }
    try {
      await sendTextMessage(session.metaPhoneNumberId, session.metaAccessToken, to, message);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notificar despacho al cliente
  router.post('/sessions/:tenantId/orders/:orderId/dispatch', async (req, res) => {
    const { tenantId, orderId } = req.params;
    const session = await prisma.whatsAppSession.findUnique({ where: { tenantId } });
    if (!session?.metaPhoneNumberId) return res.status(404).json({ error: 'Sesión no activa' });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    try {
      await sendTextMessage(
        session.metaPhoneNumberId,
        session.metaAccessToken,
        order.customer.phone,
        `Tu pedido #${String(order.orderNumber).padStart(3, '0')} va en camino! 🛵`
      );
      await prisma.order.update({ where: { id: orderId }, data: { status: 'OUT_FOR_DELIVERY' } });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notificar que el pedido fue visto
  router.post('/sessions/:tenantId/orders/:orderId/mark-seen', async (req, res) => {
    const { tenantId, orderId } = req.params;
    const session = await prisma.whatsAppSession.findUnique({ where: { tenantId } });
    if (!session?.metaPhoneNumberId) return res.status(404).json({ error: 'Sesión no activa' });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    try {
      await sendTextMessage(
        session.metaPhoneNumberId,
        session.metaAccessToken,
        order.customer.phone,
        `Tu pedido está siendo preparado! 👨‍🍳`
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // SSE — eventos en tiempo real para el dashboard
  router.get('/sessions/:tenantId/events', (req, res) => {
    const { tenantId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onNewOrder = (data) => {
      if (data.tenantId === tenantId) {
        res.write(`data: ${JSON.stringify(data.order)}\n\n`);
      }
    };

    orderEvents.on('newOrder', onNewOrder);
    const keepAlive = setInterval(() => res.write(':keep-alive\n\n'), 30000);

    req.on('close', () => {
      orderEvents.off('newOrder', onNewOrder);
      clearInterval(keepAlive);
      res.end();
    });
  });

  return router;
}
