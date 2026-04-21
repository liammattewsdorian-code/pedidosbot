import { prisma } from '../lib/prisma.js';

export async function addressFlow({ tenant, customer, conversation, message }) {
  let address = (message.body || '').trim();

  // Soporte para ubicación GPS (Pin de WhatsApp)
  if (message.type === 'location' && message.location) {
    const { latitude, longitude } = message.location;
    address = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  if (address.length < 10 && message.type !== 'location') {
    await message.reply(
      `La dirección parece muy corta. Por favor escríbela completa con referencias.`
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
      .map((z, i) => `*${i + 1}.* ${z.name} — ${formatMoney(z.fee, tenant.currency)}`)
      .join('\n');
    await message.reply(
      `¿En qué zona estás?\n\n${list}\n\n_Responde con el número._`
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
  const selectedIndex = Number.parseInt(text, 10) - 1;
  const zones = tenant.deliveryZones || [];
  const zone = zones[selectedIndex];

  if (!zone) {
    const list = zones
      .map((item, index) => `*${index + 1}.* ${item.name} - ${formatMoney(item.fee, tenant.currency)}`)
      .join("\n");

    await message.reply(
      `Responde con el numero de tu zona.\n\n${list}`
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
  const methods = [
    `*1.* 💵 Efectivo`,
    `*2.* 🏦 Transferencia (Banreservas / Popular / BHD)`,
  ];
  if (tenant.fiaoEnabled) methods.push(`*3.* 📓 Fiao`);

  await message.reply(
    `💳 ¿Cómo vas a *pagar*?\n\n${methods.join('\n')}\n\n_Responde con el número._`
  );
  return { nextState: 'ASKING_PAYMENT', context };
}

function formatMoney(amount, currency = 'DOP') {
  return Number(amount).toLocaleString('es-DO', { style: 'currency', currency });
}
