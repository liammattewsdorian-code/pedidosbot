import { Router } from 'express';
import { EventEmitter } from 'events';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { sendTextMessage, verifyCredentials } from './meta/client.js';

export const orderEvents = new EventEmitter();

export function createApiRouter() {
  const router = Router();

  router.use((req, res, next) => {
    const secret = req.headers['x-api-secret'];
    if (!process.env.BOT_API_SECRET || secret !== process.env.BOT_API_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  });

  router.post('/sessions/:tenantId/credentials', async (req, res) => {
    const { tenantId } = req.params;
    const { phoneNumberId, accessToken, wabaId } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: 'phoneNumberId y accessToken son requeridos' });
    }

    try {
      const info = await verifyCredentials(phoneNumberId, accessToken);
      if (!info) {
        return res
          .status(400)
          .json({ error: 'Credenciales invalidas. Verifica el Phone Number ID y el Access Token.' });
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

      res.json({
        ok: true,
        phoneNumber: info.display_phone_number,
        verifiedName: info.verified_name,
      });
    } catch (err) {
      logger.error({ err }, 'Error saving Meta credentials');
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/sessions/:tenantId/disconnect', async (req, res) => {
    const { tenantId } = req.params;
    await prisma.whatsAppSession.upsert({
      where: { tenantId },
      create: { tenantId, status: 'DISCONNECTED' },
      update: {
        status: 'DISCONNECTED',
        metaPhoneNumberId: null,
        metaAccessToken: null,
        metaWabaId: null,
      },
    });
    res.json({ ok: true });
  });

  router.get('/sessions/:tenantId', async (req, res) => {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId: req.params.tenantId },
      select: {
        status: true,
        phoneNumber: true,
        metaPhoneNumberId: true,
        metaWabaId: true,
        lastConnectedAt: true,
      },
    });
    res.json(session || { status: 'DISCONNECTED' });
  });

  router.post('/sessions/:tenantId/send', async (req, res) => {
    const { to, message } = req.body;
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenantId: req.params.tenantId },
    });
    if (!session?.metaPhoneNumberId) {
      return res.status(404).json({ error: 'Sesion no configurada' });
    }

    try {
      await sendTextMessage(session.metaPhoneNumberId, session.metaAccessToken, to, message);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/sessions/:tenantId/orders/:orderId/dispatch', async (req, res) => {
    const { tenantId, orderId } = req.params;
    const session = await prisma.whatsAppSession.findUnique({ where: { tenantId } });
    if (!session?.metaPhoneNumberId) return res.status(404).json({ error: 'Sesion no activa' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    try {
      await sendTextMessage(
        session.metaPhoneNumberId,
        session.metaAccessToken,
        order.customer.phone,
        `Tu pedido #${String(order.orderNumber).padStart(3, '0')} va en camino!`
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/sessions/:tenantId/orders/:orderId/mark-seen', async (req, res) => {
    const { tenantId, orderId } = req.params;
    const session = await prisma.whatsAppSession.findUnique({ where: { tenantId } });
    if (!session?.metaPhoneNumberId) return res.status(404).json({ error: 'Sesion no activa' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    try {
      await sendTextMessage(
        session.metaPhoneNumberId,
        session.metaAccessToken,
        order.customer.phone,
        `Recibimos tu pedido #${String(order.orderNumber).padStart(3, '0')} y pronto te confirmaremos los siguientes pasos.`
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

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
