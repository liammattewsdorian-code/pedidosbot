import { Router } from 'express';
import { handleIncomingMessage } from '../handlers/messageHandler.js';

export function createWebhookRouter() {
  const router = Router();

  // GET: Verificación de Meta
  router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    res.sendStatus(403);
  });

  // POST: Recepción de mensajes
  router.post('/', async (req, res) => {
    // Aquí procesarías el body de Meta y llamarías a handleIncomingMessage
    // Por ahora respondemos 200 para que Meta no reintente
    res.sendStatus(200);
  });

  return router;
}