import { prisma } from '../lib/prisma.js';
import { formatMoney } from '../lib/utils.js';

export async function addressFlow({ tenant, customer, conversation, message }) {
  const isEnglish = conversation.context?.isEnglish;
  let address = (message.body || '').trim();

  // Soporte para ubicación GPS (Pin de WhatsApp)
  if (message.type === 'location' && message.location) {
    const { latitude, longitude } = message.location;
    address = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  if (address.length < 10 && message.type !== 'location') {
    const errorMsg = isEnglish 
      ? "The address seems too short. Please provide a full address with landmarks."
      : "La dirección parece muy corta. Por favor escríbela completa con referencias.";
    await message.reply(
      errorMsg
    );
    return { nextState: 'ASKING_ADDRESS' };
  }

  // Guardar dirección del cliente para futuras órdenes
  await prisma.customer.update({
    where: { id: customer.id },
    data: { address },
  });

  // Preguntar zona de delivery si el tenant tiene zonas configuradas
  const zones = tenant.deliveryZones || [];
  const context = { ...conversation.context, deliveryAddress: address };

  if (zones.length > 1) {
    const rows = zones.map((z, i) => ({
      id: String(i + 1),
      title: z.name,
      description: formatMoney(z.fee, tenant.currency, isEnglish, tenant.exchangeRate)
    }));

    await message.sendList(
      isEnglish ? "Please select your delivery area" : "Por favor selecciona tu zona de entrega",
      isEnglish ? "See Areas" : "Ver Zonas",
      [{ title: isEnglish ? "Delivery Zones" : "Zonas de Delivery", rows }],
      tenant.name
    );

    return { nextState: 'ASKING_ZONE', context };
  }

  const zone = zones[0];
  const deliveryFee = zone ? Number(zone.fee) : 0;
  context.deliveryFee = deliveryFee;
  context.deliveryZoneId = zone?.id;

  return askPaymentMethod({ tenant, message, context });
}

export async function zoneFlow({ tenant, conversation, message }) {
  const text = (message.body || "").trim();
  const isEnglish = conversation.context?.isEnglish;
  const selectedIndex = Number.parseInt(text, 10) - 1;
  const zones = tenant.deliveryZones || [];
  const zone = zones[selectedIndex];

  if (!zone) {
    const list = zones
      .map((item, index) => `*${index + 1}.* ${item.name} - ${formatMoney(item.fee, tenant.currency, isEnglish)}`)
      .join("\n");

    const errorMsg = isEnglish ? "Please reply with the number of your area." : "Responde con el numero de tu zona.";
    await message.reply(
      `${errorMsg}\n\n${list}`
    );
    return { nextState: "ASKING_ZONE", context: conversation.context };
  }

  const context = {
    ...conversation.context,
    deliveryZoneId: zone.id,
    deliveryFee: Number(zone.fee),
  };

  return askPaymentMethod({ tenant, message, context });
}

async function askPaymentMethod({ tenant, message, context }) {
  const isEnglish = context.isEnglish;

  const buttons = [
    { id: '1', title: isEnglish ? '💵 Cash' : '💵 Efectivo' },
    { id: '2', title: isEnglish ? '🏦 Transfer' : '🏦 Transferencia' }
  ];

  if (tenant.fiaoEnabled) {
    buttons.push({ id: '3', title: isEnglish ? '📓 Credit (Fiao)' : '📓 Fiao' });
  }

  const question = isEnglish ? "💳 How would you like to pay?" : "💳 ¿Cómo vas a pagar?";
  await message.sendButtons(question, buttons);

  return { nextState: 'ASKING_PAYMENT', context };
}
