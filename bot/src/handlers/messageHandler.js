import { prisma } from '../lib/prisma.js';
import { tenantLogger } from '../lib/logger.js';
import { routeByState } from '../flows/router.js';
import { isWithinBusinessHours } from '../lib/schedule.js';
import { transcribeAudio } from '../lib/openai.js';

export async function handleIncomingMessage(tenantId, client, message) {
  if (message.fromMe) return;
  if (message.from.endsWith('@g.us')) return;
  if (message.from === 'status@broadcast') return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { deliveryZones: { where: { active: true } } },
  });
  if (!tenant || !isTenantOperational(tenant)) return;

  const log = tenantLogger(tenant.id, tenant.slug);
  const phone = normalizePhone(message.from);

  const customer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    create: { tenantId, phone },
    update: {},
  });

  const conversation = await prisma.conversation.upsert({
    where: { customerId: customer.id },
    create: { tenantId, customerId: customer.id, state: 'MAIN_MENU' },
    update: { lastMessageAt: new Date() },
  });

  log.debug(
    { from: phone, state: conversation.state, text: message.body?.slice(0, 80) },
    'Incoming message'
  );

  if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
    try {
      const media = await message.downloadMedia();
      const transcription = await transcribeAudio(media.data);
      if (transcription) {
        message.body = transcription;
        log.info({ transcription }, 'Audio transcribed successfully');
      }
    } catch (err) {
      log.error({ err }, 'Error transcribing voice note');
    }
  }

  const withinHours = isWithinBusinessHours(tenant.schedule, tenant.timezone);
  if (!withinHours && tenant.closedMessage) {
    await message.reply(tenant.closedMessage);
    return;
  }

  const text = (message.body || '').trim().toLowerCase();
  const resetKeywords = ['cancelar', 'salir', 'menu', 'menú', 'inicio', 'cancel', 'exit', 'start'];

  if (resetKeywords.includes(text)) {
    await prisma.conversation.update({
      where: { customerId: customer.id },
      data: { state: 'MAIN_MENU', context: {} },
    });
    conversation.state = 'MAIN_MENU';
    conversation.context = {};
  }

  await routeByState({ tenant, customer, conversation, client, message });
}

function normalizePhone(from) {
  return from.replace(/\D/g, '');
}

function isTenantOperational(tenant) {
  if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
    return false;
  }

  if (tenant.status === 'TRIAL' && tenant.subscriptionEndsAt) {
    return new Date(tenant.subscriptionEndsAt) >= new Date();
  }

  return true;
}
