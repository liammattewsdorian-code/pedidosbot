import { prisma } from '../lib/prisma.js';
import { formatMoney } from '../lib/utils.js';

export async function addressFlow({ tenant, customer, conversation, message }) {
  const isEnglish = conversation.context?.isEnglish;
  let address = (message.body || '').trim();

  if (message.type === 'location' && message.location) {
    const { latitude, longitude } = message.location;
    address = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  if (address.length < 10 && message.type !== 'location') {
    const errorMsg = isEnglish
      ? 'The address seems too short. Please provide a full address with landmarks.'
      : 'La direccion parece muy corta. Por favor escribela completa con referencias.';
    await message.reply(errorMsg);
    return { nextState: 'ASKING_ADDRESS' };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { address },
  });

  const zones = tenant.deliveryZones || [];
  const context = { ...conversation.context, deliveryAddress: address };

  if (zones.length > 1) {
    const rows = zones.map((z, i) => ({
      id: String(i + 1),
      title: z.name,
      description: formatMoney(z.fee, tenant.currency, isEnglish, tenant.exchangeRate),
    }));

    await message.sendList(
      isEnglish ? 'Please select your delivery area' : 'Por favor selecciona tu zona de entrega',
      isEnglish ? 'See Areas' : 'Ver Zonas',
      [{ title: isEnglish ? 'Delivery Zones' : 'Zonas de Delivery', rows }],
      tenant.name
    );

    return { nextState: 'ASKING_ZONE', context };
  }

  const zone = zones[0];
  return continueWithZone({ tenant, message, context, zone });
}

export async function zoneFlow({ tenant, conversation, message }) {
  const text = (message.body || '').trim();
  const isEnglish = conversation.context?.isEnglish;
  const selectedIndex = Number.parseInt(text, 10) - 1;
  const zones = tenant.deliveryZones || [];
  const zone = zones[selectedIndex];

  if (!zone) {
    const list = zones
      .map(
        (item, index) =>
          `*${index + 1}.* ${item.name} - ${formatMoney(item.fee, tenant.currency, isEnglish, tenant.exchangeRate)}`
      )
      .join('\n');

    const errorMsg = isEnglish
      ? 'Please reply with the number of your area.'
      : 'Responde con el numero de tu zona.';
    await message.reply(`${errorMsg}\n\n${list}`);
    return { nextState: 'ASKING_ZONE', context: conversation.context };
  }

  const context = {
    ...conversation.context,
    deliveryAddress: conversation.context?.deliveryAddress,
  };

  return continueWithZone({ tenant, message, context, zone });
}

async function askPaymentMethod({ tenant, message, context }) {
  const isEnglish = context.isEnglish;

  const buttons = [
    { id: '1', title: isEnglish ? 'Cash' : 'Efectivo' },
    { id: '2', title: isEnglish ? 'Transfer' : 'Transferencia' },
  ];

  if (tenant.fiaoEnabled) {
    buttons.push({ id: '3', title: isEnglish ? 'Credit (Fiao)' : 'Fiao' });
  }

  const question = isEnglish ? 'How would you like to pay?' : 'Como vas a pagar?';
  await message.sendButtons(question, buttons);

  return { nextState: 'ASKING_PAYMENT', context };
}

async function continueWithZone({ tenant, message, context, zone }) {
  const isEnglish = context.isEnglish;
  const subtotal = (context.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const minOrder = zone?.minOrder ? Number(zone.minOrder) : 0;

  if (zone?.id) {
    context.deliveryZoneId = zone.id;
    context.deliveryFee = Number(zone.fee);
    context.estimatedMinutes = zone.estimatedMinutes ?? null;
  }

  if (minOrder > 0 && subtotal < minOrder) {
    const shortBy = minOrder - subtotal;
    const reply = isEnglish
      ? `This area requires a minimum order of *${formatMoney(minOrder, tenant.currency, true, tenant.exchangeRate)}*.\n\nYou need *${formatMoney(shortBy, tenant.currency, true, tenant.exchangeRate)}* more to continue with delivery.`
      : `Esta zona requiere un pedido minimo de *${formatMoney(minOrder, tenant.currency, false, tenant.exchangeRate)}*.\n\nTe faltan *${formatMoney(shortBy, tenant.currency, false, tenant.exchangeRate)}* para continuar con el delivery.`;

    await message.reply(reply);
    return { nextState: 'ORDERING', context };
  }

  return askPaymentMethod({ tenant, message, context });
}
