import { prisma } from '../lib/prisma.js';
import { formatSchedule } from '../lib/schedule.js';

/**
 * Menú principal - presenta opciones al cliente.
 */
export async function mainMenuFlow({ tenant, customer, message }) {
  const text = (message.body || '').trim().toLowerCase();
  
  // Detección simple de idioma para turistas (Punta Cana)
  const isEnglish = text.includes('hi') || text.includes('hello') || text.includes('order') || (!customer.phone.startsWith('1809') && !customer.phone.startsWith('1829') && !customer.phone.startsWith('1849'));

  // Primera interacción o cliente sin nombre → saludo
  if (!customer.name && !text.match(/^[1-9]$/)) {
    if (isEnglish && tenant.plan === 'PREMIUM') {
      return sendEnglishGreeting({ tenant, message });
    }

    const greeting = tenant.welcomeMessage ||
      `¡Hola! 👋 Bienvenido a *${tenant.name}*.\n\n¿En qué te puedo ayudar hoy?`;

    await message.reply(
      `${greeting}\n\n` +
      mainMenuOptions(tenant) +
      `\n\n_Responde con el número de la opción o escribe "menu" en cualquier momento._`
    );
    return { nextState: 'MAIN_MENU' };
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
      await message.reply(
        `Para *hacer un pedido*, escribe los productos que quieres. Ejemplo:\n\n_"2 arepas reina pepiada y 1 jugo de chinola"_`
      );
      return { nextState: 'ORDERING', context: { items: [] } };
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
        await message.reply(`📓 Tu balance actual es: *${formatMoney(balance, tenant.currency)}*.\n\nRecuerda pasar por el negocio para abonar.`);
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
        return { nextState: 'ORDERING', context: { items: [], rawInput: text } };
      }
      await message.reply(
        `No entendí tu mensaje 🤔\n\n${mainMenuOptions(tenant)}`
      );
      return { nextState: 'MAIN_MENU' };
  }
}

async function sendEnglishGreeting({ tenant, message }) {
  const greeting = `Hi! 👋 Welcome to *${tenant.name}*.\n\nHow can I help you today?`;
  const options = [
    `*1.* 🛒 View Menu / Order`,
    `*2.* 📍 Location`,
    `*3.* 🕐 Hours`,
    `*4.* 💬 Speak to a person`,
  ].join('\n');
  await message.reply(`${greeting}\n\n${options}\n\n_Reply with the option number._`);
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
      const price = Number(p.price).toLocaleString('es-DO', {
        style: 'currency', currency: tenant.currency,
      });
      lines.push(`• ${p.name} — ${price}`);
      if (p.description) lines.push(`  _${p.description}_`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function formatMoney(amount, currency = 'DOP') {
  return Number(amount).toLocaleString('es-DO', { style: 'currency', currency });
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
