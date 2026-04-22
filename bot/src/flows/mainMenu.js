import { prisma } from '../lib/prisma.js';
import { formatSchedule } from '../lib/schedule.js';
import { formatMoney } from '../lib/utils.js';

/**
 * Menú principal - presenta opciones al cliente.
 */
export async function mainMenuFlow({ tenant, customer, conversation, message }) {
  const text = (message.body || '').trim().toLowerCase();
  
  // Detección simple de idioma para turistas (Punta Cana)
  const touristKeywords = ['hi', 'hello', 'order', 'menu', 'delivery', 'price', 'open', 'info', 'address'];
  // Si no empieza con los códigos de RD, es extranjero
  const isRDNumber = ['1809', '1829', '1849', '809', '829', '849'].some(prefix => customer.phone.startsWith(prefix));
  const isEnglish = conversation.context?.isEnglish || (touristKeywords.some(word => text.includes(word)) || !isRDNumber);

  // Primera interacción o cliente sin nombre → saludo
  if (!customer.name && !text.match(/^[1-9]$/)) {
    if (isEnglish && tenant.plan === 'PREMIUM') {
      return sendEnglishGreeting({ tenant, message });
    }

    const greeting = tenant.welcomeMessage ||
      `¡Hola! 👋 Bienvenido a *${tenant.name}*.\n\n¿En qué te puedo ayudar hoy?`;

    const rows = [
      { id: '1', title: '🛒 Pedir ahora', description: 'Ver menú y ordenar' },
      { id: '2', title: '📍 Ubicación', description: '¿Dónde estamos?' },
      { id: '3', title: '🕐 Horario', description: 'Consulta cuándo abrimos' },
      { id: '4', title: '💬 Hablar con alguien', description: 'Atención humana' },
    ];
    if (tenant.fiaoEnabled) {
      rows.push({ id: '5', title: '📓 Mi Fiao', description: 'Consultar balance' });
    }

    await message.sendList(
      greeting,
      'Ver Opciones',
      [{ title: 'Menú Principal', rows }],
      tenant.name
    );

    return { nextState: 'MAIN_MENU', context: { isEnglish } };
  }

  // Opciones numéricas
  switch (text) {
    case '1': {
      // Ver catálogo / menú
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
      await message.reply(formatCatalog(tenant, categories));
      
      const instruction = isEnglish && tenant.plan === 'PREMIUM'
        ? `To *place an order*, just type what you want. Example:\n\n_"2 burgers and 1 orange juice"_`
        : `Para *hacer un pedido*, escribe los productos que quieres. Ejemplo:\n\n_"2 arepas reina pepiada y 1 jugo de chinola"_`;
      
      await message.reply(instruction);
      return { nextState: 'ORDERING', context: { ...conversation.context, isEnglish, items: [] } };
    }
    case '2':
      await message.reply(formatLocation(tenant));
      return { nextState: 'MAIN_MENU' };

    case '3':
      await message.reply(formatHours(tenant));
      return { nextState: 'MAIN_MENU' };

    case '4':
      await message.reply(
        `🧑‍💼 Te conecto con una persona del equipo. En un momento alguien te responderá.`
      );
      
      // Notificación básica al dueño por WhatsApp
      if (tenant.ownerPhone) {
        const ownerJid = `${tenant.ownerPhone}@c.us`;
        await message.client.sendMessage(ownerJid, 
          `⚠️ *Atención Humana Requerida*\n\nEl cliente wa.me/${customer.phone} solicita hablar con una persona.`
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
        await message.reply(`📓 Tu balance actual es: *${formatMoney(balance, tenant.currency, isEnglish, tenant.exchangeRate)}*.\n\n${isEnglish ? 'Remember to visit the store to pay.' : 'Recuerda pasar por el negocio para abonar.'}`);
      } else {
        await message.reply(`✅ No tienes deudas pendientes. ¡Estás al día!`);
      }
      return { nextState: 'MAIN_MENU' };
    }

    default:
      // Texto libre → interpretar como intento de pedido
      if (text.includes('ubicacion') || text.includes('donde estan') || text.includes('direccion')) {
        await message.reply(formatLocation(tenant));
        return { nextState: 'MAIN_MENU' };
      }
      
      if (text.includes('horario') || text.includes('abierto')) {
        await message.reply(formatHours(tenant));
        return { nextState: 'MAIN_MENU' };
      }

      if (looksLikeOrder(text)) {
        return { nextState: 'ORDERING', context: { ...conversation.context, isEnglish, items: [], rawInput: text } };
      }

      const errorMsg = isEnglish ? "I didn't quite get that 🤔" : "No entendí tu mensaje 🤔";
      const options = (isEnglish && tenant.plan === 'PREMIUM') ? englishMenuOptions() : mainMenuOptions(tenant);
      
      await message.reply(
        `${errorMsg}\n\n${options}`
      );
      return { nextState: 'MAIN_MENU' };
  }
}

async function sendEnglishGreeting({ tenant, message }) {
  const greeting = `Hi! 👋 Welcome to *${tenant.name}*.\n\nWe provide delivery service in Punta Cana area. How can we help you today?`;
  
  const rows = [
    { id: '1', title: '🛒 View Menu / Order', description: 'See our products and buy' },
    { id: '2', title: '📍 Location', description: 'Where we are' },
    { id: '3', title: '🕐 Hours', description: 'Opening times' },
    { id: '4', title: '💬 Speak to a person', description: 'Talk to our staff' },
  ];

  await message.sendList(
    greeting,
    'View Options',
    [{ title: 'Main Menu', rows }],
    tenant.name
  );

  return { nextState: 'MAIN_MENU' };
}

function mainMenuOptions(tenant) {
  const lines = [
    `*1.* 🛒 Ver menú / hacer pedido`,
    `*2.* 📍 Ubicación`,
    `*3.* 🕐 Horario`,
    `*4.* 💬 Hablar con una persona`,
  ];
  if (tenant.fiaoEnabled) {
    lines.push(`*5.* 📓 Consultar mi balance (Fiao)`);
  }
  return lines.join('\n');
}

function formatCatalog(tenant, categories) {
  if (!categories.length) {
    return `_Aún no hay productos cargados en el catálogo._`;
  }
  const lines = [`📋 *Menú de ${tenant.name}*`, ''];
  for (const cat of categories) {
    if (!cat.products.length) continue;
    lines.push(`*${cat.emoji || ''} ${cat.name.toUpperCase()}*`);
    for (const p of cat.products) {
      const isEnglish = lines[0].includes('Menu'); // Heurística simple si ya se tradujo el título
      const price = formatMoney(p.price, tenant.currency, isEnglish, tenant.exchangeRate); // Ya usa tenant.exchangeRate
      lines.push(`• ${p.name} — ${price}`);
      if (p.description) lines.push(`  _${p.description}_`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function formatLocation(tenant) {
  const lines = [`📍 *${tenant.name}*`];
  if (tenant.address) lines.push(tenant.address);
  if (tenant.city) lines.push(tenant.city);
  if (tenant.googleMapsUrl) lines.push(`\n🗺️ ${tenant.googleMapsUrl}`);
  return lines.join('\n');
}

function formatHours(tenant) {
  return `🕐 *Horario de ${tenant.name}*\n\n${formatSchedule(tenant.schedule)}`;
}

function looksLikeOrder(text) {
  // Heurística simple: contiene número o palabras típicas de pedido
  return /\d/.test(text) ||
    /quiero|dame|mándame|mandame|pedido|ordenar|llevar|necesito|vendes|lista|comprar/i.test(text);
}
