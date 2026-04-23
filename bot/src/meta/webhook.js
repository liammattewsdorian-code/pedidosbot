import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { handleIncomingMessage } from '../handlers/messageHandler.js';
import { MetaMessage, buildFakeClient } from './MessageAdapter.js';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'pedidosbot_verify_token';

export function createWebhookRouter() {
  const router = Router();

  // GET — Meta verifica el webhook una sola vez al configurarlo
  router.get('/', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Meta webhook verified');
      return res.status(200).send(challenge);
    }

    logger.warn({ mode, token }, 'Webhook verification failed or accessed via browser');
    res.status(403).send('Forbidden: This endpoint is for Meta Webhook verification. ' + 
                         'If you are testing, make sure your token matches.');
  });

  // POST — Meta envía mensajes entrantes aquí
  router.post('/', async (req, res) => {
    // Responder 200 inmediatamente (Meta requiere < 5s)
    res.sendStatus(200);

    try {
      const body = req.body;
      if (body.object !== 'whatsapp_business_account') return;

      for (const entry of body.entry || []) {
        const wabaId = entry.id;
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;

          const value         = change.value;
          const phoneNumberId = value.metadata?.phone_number_id;

          for (const msg of value.messages || []) {
            await processIncoming(phoneNumberId, wabaId, msg);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Webhook processing error');
    }
  });

  return router;
}

async function processIncoming(phoneNumberId, wabaId, msg) {
  // Ignorar mensajes de grupos
  if (msg.from?.endsWith('@g.us')) return;

  // Buscar tenant por phoneNumberId, con fallback a wabaId (sandbox de Meta usa IDs distintos)
  let session = await prisma.whatsAppSession.findFirst({
    where: { metaPhoneNumberId: phoneNumberId },
  });

  if (!session && wabaId) {
    session = await prisma.whatsAppSession.findFirst({
      where: { metaWabaId: wabaId, status: 'CONNECTED' },
    });
    if (session) {
      logger.info({ phoneNumberId, wabaId }, 'Tenant found via WABA ID fallback');
    }
  }

  if (!session) {
    logger.warn({ phoneNumberId, wabaId }, 'No tenant found for incoming message');
    return;
  }

  const { tenantId, metaAccessToken, metaPhoneNumberId } = session;
  const sendingPhoneNumberId = metaPhoneNumberId || phoneNumberId;

  // Extraer ID de media si existe (audio, imagen, etc.)
  const mediaId = msg.audio?.id || msg.voice?.id || msg.image?.id || msg.document?.id || msg.video?.id;

  // Extraer texto o ID de interacción
  const bodyText = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || msg.text?.body || msg.caption || '';

  const message = new MetaMessage({
    from:          msg.from,
    body:          bodyText, // Ya está correcto
    type:          msg.type,
    phoneNumberId: sendingPhoneNumberId,
    accessToken:   metaAccessToken,
    mediaId:       mediaId,
    location:      msg.location,
  });

  const fakeClient = buildFakeClient(sendingPhoneNumberId, metaAccessToken);

  await handleIncomingMessage(tenantId, fakeClient, message);
}
