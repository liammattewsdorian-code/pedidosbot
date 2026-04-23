import { prisma } from '../lib/prisma.js';
import { tenantLogger } from '../lib/logger.js';
import { routeByState } from '../flows/router.js';
import { isWithinBusinessHours } from '../lib/schedule.js';
import { transcribeAudio } from '../lib/openai.js';

/**
 * Entry point para cada mensaje entrante. Carga el tenant, identifica al cliente
 * y lo pasa al router del flujo según su estado de conversación.
 */
export async function handleIncomingMessage(tenantId, client, message) {
  // Ignorar mensajes de grupos, status, propios
  if (message.fromMe) return;
  if (message.from.endsWith('@g.us')) return;
  if (message.from === 'status@broadcast') return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { deliveryZones: { where: { active: true } } },
  });

  if (!tenant) return;

  // Verificación de Trial y Plan
  const isExpired = tenant.planStatus === 'TRIAL' && 
                    tenant.trialEndsAt && 
                    new Date() > new Date(tenant.trialEndsAt);
  
  if (tenant.planStatus === 'EXPIRED' || isExpired) {
    return; // El bot ignora el mensaje si el negocio no está al día
  }

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

  // Soporte para Notas de Voz (Whisper)
  if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
    try {
      const media = await message.downloadMedia();
      const transcription = await transcribeAudio(media.data);
      if (transcription) {
        message.body = transcription; // El bot ahora "lee" lo que el cliente dijo
        log.info({ transcription }, 'Audio transcripto con éxito');
      }
    } catch (err) {
      log.error({ err }, 'Error al transcribir nota de voz');
    }
  }

  // Fuera de horario: responder mensaje automático (opcional)
  const withinHours = isWithinBusinessHours(tenant.schedule, tenant.timezone);
  if (!withinHours && tenant.closedMessage) {
    await message.reply(tenant.closedMessage);
    return;
  }

  // Palabras clave globales que resetean el flujo
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
  // Extrae solo los dígitos para evitar problemas con @c.us o formatos internacionales
  return from.replace(/\D/g, '');
}
