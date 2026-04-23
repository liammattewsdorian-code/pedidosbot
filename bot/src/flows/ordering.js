import { prisma } from '../lib/prisma.js';
import { formatMoney } from '../lib/utils.js';

/**
 * Flujo de toma de pedido. Parsea texto libre y arma carrito.
 */
export async function orderingFlow({ tenant, customer, conversation, message }) {
  const text = (message.body || '').trim();
  const lower = text.toLowerCase();
  const isEnglish = conversation.context?.isEnglish;

  // Comandos especiales
  if (['listo', 'ya', 'continuar', 'terminar', 'seguir'].includes(lower)) {
    return checkoutCart(conversation, message, tenant);
  }
  if (lower === 'ver' || lower === 'carrito') {
    return showCart({ conversation, message, tenant });
  }
  if (lower === 'vaciar' || lower === 'borrar') {
    return { nextState: 'ORDERING', context: { ...conversation.context, items: [] } };
  }

  // Parsear productos del texto
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, available: true },
    select: { id: true, name: true, price: true },
  });

  const parsed = parseOrderText(text, products);

  if (!parsed.length) {
    await message.reply(
      `No encontré esos productos en el menú 🤔\n\n` +
      `• Escribe el nombre tal como aparece en el menú\n` +
      `• Ejemplo: _"2 arepa reina pepiada"_\n` +
      `• Escribe *menu* para ver opciones o *ver* para ver tu carrito`
    );
    return { nextState: 'ORDERING' };
  }

  // Agregar al carrito existente
  const currentItems = conversation.context?.items || [];
  const newItems = [...currentItems];

  for (const item of parsed) {
    const existing = newItems.find((i) => i.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else newItems.push(item);
  }

  const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const summary = newItems
    .map((i) => `• ${i.quantity}x ${i.name} — ${formatMoney(i.price * i.quantity, tenant.currency, isEnglish, tenant.exchangeRate)}`)
    .join('\n');

  const msg = `✅ ${isEnglish ? 'Added to cart' : 'Agregado al carrito'}:\n\n${summary}\n\n*Subtotal:* ${formatMoney(total, tenant.currency, isEnglish, tenant.exchangeRate)}`;
  const buttons = [
    { id: 'listo', title: isEnglish ? '✅ Checkout' : '✅ Finalizar' },
    { id: 'ver', title: isEnglish ? '🛒 View Cart' : '🛒 Ver Carrito' },
    { id: 'menu', title: isEnglish ? '📋 Menu' : '📋 Ver Menú' }
  ];

  await message.sendButtons(msg, buttons);

  return { nextState: 'ORDERING', context: { ...conversation.context, items: newItems } };
}

async function showCart({ conversation, message, tenant }) {
  const items = conversation.context?.items || [];
  const isEnglish = conversation.context?.isEnglish;

  if (!items.length) {
    await message.reply(isEnglish ? `Your cart is empty 🛒\n\nType the products you want to order.` : `Tu carrito está vacío 🛒\n\nEscribe los productos que quieres pedir.`);
    return { nextState: 'ORDERING', context: conversation.context };
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const summary = items
    .map((i) => `• ${i.quantity}x ${i.name} — ${formatMoney(i.price * i.quantity, tenant.currency, isEnglish, tenant.exchangeRate)}`)
    .join('\n');

  const title = isEnglish ? `🛒 *Your order*` : `🛒 *Tu pedido*`;
  const footer = isEnglish ? `Type *ready* to continue or keep adding products.` : `Escribe *listo* para continuar o sigue agregando productos.`;

  await message.reply(
    `${title}\n\n${summary}\n\n*Total:* ${formatMoney(total, tenant.currency, isEnglish, tenant.exchangeRate)}\n\n${footer}`
  );
  return { nextState: 'ORDERING' };
}

async function checkoutCart(conversation, message, tenant) {
  const items = conversation.context?.items || [];
  if (!items.length) {
    await message.reply(`Tu carrito está vacío. Agrega productos primero.`);
    return { nextState: 'ORDERING' };
  }

  if (tenant.deliveryEnabled) {
    await message.reply(
      `📍 ¿Cuál es la *dirección de entrega*?\n\n` +
      `Escribe la dirección completa con puntos de referencia.\n` +
      `Ejemplo: _"Calle 3 #45, casa amarilla frente al colmado"_`
    );
    return { nextState: 'ASKING_ADDRESS', context: conversation.context };
  }
  // Si no hay delivery → pickup directo
  return {
    nextState: 'ASKING_PAYMENT',
    context: { ...conversation.context, orderType: 'PICKUP' },
  };
}

/**
 * Parser simple: busca coincidencias de productos en el texto.
 * Ej: "2 arepa reina pepiada y 1 jugo" → [{name:"Arepa Reina Pepiada", qty:2}, ...]
 */
function parseOrderText(text, products) {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);
  const results = [];

  for (const product of products) {
    const pName = product.name.toLowerCase();
    const pWords = pName.split(/\s+/).filter(w => w.length > 2);
    
    // Coincidencia flexible: si el nombre está o si la mayoría de palabras coinciden
    const hasFullMatch = normalized.includes(pName);
    const matchCount = pWords.filter(pw => words.some(w => w.startsWith(pw) || pw.startsWith(w))).length;
    
    const isMatch = hasFullMatch || (pWords.length > 0 && matchCount >= Math.ceil(pWords.length * 0.7));

    if (!isMatch) continue;
    
    // extraer cantidad (soporta "2 cervezas", "cerveza x2", "una cerveza")
    const regex = new RegExp(`(?:(\\d+)|(una|uno))\\s*(?:x|de|unidades?|pzs?)?\\s*${escapeRegex(pName)}|${escapeRegex(pName)}\\s*(?:x|qty:?|cant:?)\\s*(\\d+)`, 'i');
    const match = text.match(regex);
    const qty = match ? parseInt(match[1] || match[3] || (match[2] ? '1' : '1')) : 1;

    results.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
    });
  }

  return results;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
