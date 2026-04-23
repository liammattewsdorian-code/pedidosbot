import { prisma } from '../lib/prisma.js';
import { formatSchedule } from '../lib/schedule.js';
import { formatMoney } from '../lib/utils.js';

export async function mainMenuFlow({ tenant, customer, conversation, message }) {
  const text = (message.body || '').trim().toLowerCase();
  const isEnglish = resolveLanguagePreference(tenant, customer.phone, text, conversation.context?.isEnglish);

  if (!customer.name && !text.match(/^[1-9]$/)) {
    if (isEnglish) {
      return sendEnglishGreeting({ tenant, message });
    }

    const greeting =
      tenant.welcomeMessage || `Hola! Bienvenido a *${tenant.name}*.\n\nEn que te puedo ayudar hoy?`;

    const rows = [
      { id: '1', title: 'Pedir ahora', description: 'Ver menu y ordenar' },
      { id: '2', title: 'Ubicacion', description: 'Donde estamos?' },
      { id: '3', title: 'Horario', description: 'Consulta cuando abrimos' },
      { id: '4', title: 'Hablar con alguien', description: 'Atencion humana' },
    ];
    if (tenant.fiaoEnabled) {
      rows.push({ id: '5', title: 'Mi Fiao', description: 'Consultar balance' });
    }

    await message.sendList(greeting, 'Ver opciones', [{ title: 'Menu principal', rows }], tenant.name);
    return { nextState: 'MAIN_MENU', context: { isEnglish } };
  }

  switch (text) {
    case '1': {
      const categories = await prisma.category.findMany({
        where: { tenantId: tenant.id, active: true },
        include: {
          products: {
            where: { available: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });

      await message.reply(formatCatalog(tenant, categories, isEnglish));
      await message.reply(
        isEnglish
          ? `To place an order, just type what you want. Example:\n\n"2 burgers and 1 orange juice"`
          : `Para hacer un pedido, escribe los productos que quieres. Ejemplo:\n\n"2 arepas reina pepiada y 1 jugo de chinola"`
      );

      return { nextState: 'ORDERING', context: { ...conversation.context, isEnglish, items: [] } };
    }

    case '2':
      await message.reply(formatLocation(tenant, isEnglish));
      return { nextState: 'MAIN_MENU' };

    case '3':
      await message.reply(formatHours(tenant, isEnglish));
      return { nextState: 'MAIN_MENU' };

    case '4':
      await message.reply(
        isEnglish
          ? `I will connect you with a team member. Someone will reply shortly.`
          : `Te conecto con una persona del equipo. En un momento alguien te respondera.`
      );

      if (tenant.ownerPhone) {
        await message.client.sendMessage(
          `${tenant.ownerPhone}@c.us`,
          `Atencion humana requerida.\n\nEl cliente wa.me/${customer.phone} solicita hablar con una persona.`
        );
      }

      return { nextState: 'MAIN_MENU' };

    case '5': {
      if (!tenant.fiaoEnabled) return { nextState: 'MAIN_MENU' };
      const lastEntry = await prisma.fiaoEntry.findFirst({
        where: { tenantId: tenant.id, customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });
      const balance = lastEntry ? Number(lastEntry.balance) : 0;

      if (balance > 0) {
        await message.reply(
          isEnglish
            ? `Your current balance is: *${formatMoney(balance, tenant.currency, true, tenant.exchangeRate)}*.\n\nRemember to visit the store to pay.`
            : `Tu balance actual es: *${formatMoney(balance, tenant.currency, false, tenant.exchangeRate)}*.\n\nRecuerda pasar por el negocio para abonar.`
        );
      } else {
        await message.reply(
          isEnglish ? `You have no pending balance. You're all set!` : `No tienes deudas pendientes. Estas al dia!`
        );
      }
      return { nextState: 'MAIN_MENU' };
    }

    default:
      if (text.includes('ubicacion') || text.includes('donde estan') || text.includes('direccion')) {
        await message.reply(formatLocation(tenant, isEnglish));
        return { nextState: 'MAIN_MENU' };
      }

      if (text.includes('horario') || text.includes('abierto')) {
        await message.reply(formatHours(tenant, isEnglish));
        return { nextState: 'MAIN_MENU' };
      }

      if (looksLikeOrder(text)) {
        return { nextState: 'ORDERING', context: { ...conversation.context, isEnglish, items: [], rawInput: text } };
      }

      const errorMsg = isEnglish ? `I didn't quite get that.` : `No entendi tu mensaje.`;
      const options = isEnglish ? englishMenuOptions(tenant) : mainMenuOptions(tenant);
      await message.reply(`${errorMsg}\n\n${options}`);
      return { nextState: 'MAIN_MENU' };
  }
}

async function sendEnglishGreeting({ tenant, message }) {
  const greeting = `Hi! Welcome to *${tenant.name}*.\n\nHow can we help you today?`;
  const rows = [
    { id: '1', title: 'View menu / order', description: 'See our products and buy' },
    { id: '2', title: 'Location', description: 'Where we are' },
    { id: '3', title: 'Hours', description: 'Opening times' },
    { id: '4', title: 'Speak to a person', description: 'Talk to our staff' },
  ];
  if (tenant.fiaoEnabled) {
    rows.push({ id: '5', title: 'My balance', description: 'Check current credit' });
  }

  await message.sendList(greeting, 'View options', [{ title: 'Main menu', rows }], tenant.name);
  return { nextState: 'MAIN_MENU', context: { isEnglish: true } };
}

function mainMenuOptions(tenant) {
  const lines = [
    `*1.* Ver menu / hacer pedido`,
    `*2.* Ubicacion`,
    `*3.* Horario`,
    `*4.* Hablar con una persona`,
  ];
  if (tenant.fiaoEnabled) {
    lines.push(`*5.* Consultar mi balance`);
  }
  return lines.join('\n');
}

function englishMenuOptions(tenant) {
  const lines = [
    `*1.* View menu / place an order`,
    `*2.* Location`,
    `*3.* Opening hours`,
    `*4.* Speak to a person`,
  ];
  if (tenant.fiaoEnabled) {
    lines.push(`*5.* Check my balance`);
  }
  return lines.join('\n');
}

function formatCatalog(tenant, categories, isEnglish = false) {
  if (!categories.length) {
    return isEnglish ? `_No products available in the catalog yet._` : `_Aun no hay productos cargados en el catalogo._`;
  }

  const title = isEnglish ? `*${tenant.name} Menu*` : `*Menu de ${tenant.name}*`;
  const lines = [title, ''];

  for (const category of categories) {
    if (!category.products.length) continue;
    lines.push(`*${category.emoji || ''} ${category.name.toUpperCase()}*`);
    for (const product of category.products) {
      const price = formatMoney(product.price, tenant.currency, isEnglish, tenant.exchangeRate);
      lines.push(`- ${product.name} - ${price}`);
      if (product.description) lines.push(`  _${product.description}_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatLocation(tenant, isEnglish = false) {
  const lines = [isEnglish ? `*${tenant.name} Location*` : `*${tenant.name}*`];
  if (tenant.address) lines.push(tenant.address);
  if (tenant.city) lines.push(tenant.city);
  if (tenant.googleMapsUrl) lines.push(`\n${tenant.googleMapsUrl}`);
  return lines.join('\n');
}

function formatHours(tenant, isEnglish = false) {
  return isEnglish
    ? `*${tenant.name} Opening Hours*\n\n${formatSchedule(tenant.schedule)}`
    : `*Horario de ${tenant.name}*\n\n${formatSchedule(tenant.schedule)}`;
}

function looksLikeOrder(text) {
  const orderKeywords = /quiero|dame|mandame|pedido|ordenar|llevar|necesito|comprar|order|buy|need|send|want/i;
  const quantityPattern = /\d+\s*(x|unidades|de|of)?\s+\w+/i;
  return orderKeywords.test(text) || quantityPattern.test(text);
}

function resolveLanguagePreference(tenant, phone, text, previousSelection) {
  if (typeof previousSelection === 'boolean') {
    return previousSelection;
  }

  if (tenant.language === 'EN') return true;
  if (tenant.language === 'ES') return false;

  const touristKeywords = ['hi', 'hello', 'order', 'menu', 'delivery', 'price', 'open', 'info', 'address'];
  const isRDNumber = ['1809', '1829', '1849', '809', '829', '849'].some((prefix) => phone.startsWith(prefix));
  return touristKeywords.some((word) => text.includes(word)) || !isRDNumber;
}
