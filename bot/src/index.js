import 'dotenv/config';
import express from 'express';
import { logger } from './lib/logger.js';
import { createApiRouter } from './api.js';
import { createWebhookRouter } from './meta/webhook.js';

const PORT = process.env.BOT_PORT || 3010;

async function main() {
  logger.info('PedidosBot service starting (Meta Cloud API mode)');

  const app = express();
  app.use(express.json());

  // Webhook de Meta (GET para verificación, POST para mensajes)
  app.use('/webhook', createWebhookRouter());

  // API interna para el panel web
  app.use('/api', createApiRouter());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, mode: 'meta-cloud-api', uptime: process.uptime() });
  });

  app.listen(PORT, () => {
    logger.info(`HTTP server listening on :${PORT}`);
    logger.info(`Webhook URL: ${process.env.BOT_PUBLIC_URL ?? 'http://localhost:' + PORT}/webhook`);
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Bot crashed on startup');
  process.exit(1);
});
