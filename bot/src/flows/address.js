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
    const list = zones
      .map((z, i) => `*${i + 1}.* ${z.name} — ${formatMoney(z.fee, tenant.currency, isEnglish)}`)
      .join('\n');
    
    const question = isEnglish ? "¿In which area are you?" : "¿En qué zona estás?";
    const footer = isEnglish ? "_Reply with the number._" : "_Responde con el número._";

    await message.reply(
      `${question}\n\n${list}\n\n${footer}`
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
  const methods = isEnglish ? [
    `*1.* 💵 Cash`,
    `*2.* 🏦 Transfer`,
  ] : [
    `*1.* 💵 Efectivo`,
    `*2.* 🏦 Transferencia (Banreservas / Popular / BHD)`,
  ];
  if (tenant.fiaoEnabled) methods.push(isEnglish ? `*3.* 📓 Credit (Fiao)` : `*3.* 📓 Fiao`);

  const question = isEnglish ? "💳 How would you like to *pay*?" : "💳 ¿Cómo vas a *pagar*?";
  const footer = isEnglish ? "_Reply with the number._" : "_Responde con el número._";

  await message.reply(
    `${question}\n\n${methods.join('\n')}\n\n${footer}`
  );
  return { nextState: 'ASKING_PAYMENT', context };
}
