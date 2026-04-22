import { prisma } from '../lib/prisma.js';
import { orderEvents } from '../api.js';
import { formatMoney } from '../lib/utils.js';

const PAYMENT_MAP = { '1': 'CASH', '2': 'TRANSFER', '3': 'FIAO' };

export async function confirmFlow({ tenant, customer, conversation, client, message }) {
  const text = (message.body || '').trim().toLowerCase();
  const context = conversation.context || {};
  const isEnglish = context.isEnglish;

  // Paso 1: seleccionar método de pago
  if (!context.paymentMethod) {
    const method = PAYMENT_MAP[text];
    if (!method) {
      const errorMsg = isEnglish ? "Please reply with the option number (1, 2 or 3)." : "Por favor responde con el número de la opción (1, 2 o 3).";
      await message.reply(errorMsg);
      return { nextState: 'ASKING_PAYMENT' };
    }
    if (method === 'FIAO' && !tenant.fiaoEnabled) {
      const errorMsg = isEnglish ? "That option is not available." : "Esa opción no está disponible.";
      await message.reply(errorMsg);
      return { nextState: 'ASKING_PAYMENT' };
    }

    const updatedContext = { ...context, paymentMethod: method };
    await showOrderSummary({ tenant, message, context: updatedContext });
    return { nextState: 'CONFIRMING', context: updatedContext };
  }

  // Paso 2: confirmar pedido
  if (['si', 'sí', 'confirmar', 'ok', 'dale', 'yes', 'confirm'].includes(text)) {
    const order = await createOrder({ tenant, customer, context });
    
    // Notificar al dashboard en tiempo real
    orderEvents.emit('newOrder', { tenantId: tenant.id, order });

    const successMsg = isEnglish 
      ? `✅ *Order #${String(order.orderNumber).padStart(3, '0')} received*\n\nWe'll notify you when it's ready. Thank you!`
      : `✅ *Pedido #${String(order.orderNumber).padStart(3, '0')} recibido*\n\nTe notificaremos cuando esté listo. ¡Gracias por preferirnos!`;

    await message.reply(
      successMsg
    );

    // Notificar al dueño
    if (tenant.ownerPhone) {
      const ownerMsg = formatOrderForOwner(tenant, customer, order, context);
      try {
        await client.sendMessage(`${tenant.ownerPhone}@c.us`, ownerMsg);
      } catch (err) {
        // no bloquear el flujo del cliente si falla la notificación
      }
    }

    return { nextState: 'MAIN_MENU', context: {} };
  }

  if (['no', 'cancelar', 'cancel'].includes(text)) {
    const cancelMsg = isEnglish ? "Order canceled ❌\n\nType *menu* to start over." : "Pedido cancelado ❌\n\nEscribe *menu* para empezar de nuevo.";
    await message.reply(cancelMsg);
    return { nextState: 'MAIN_MENU', context: {} };
  }

  // Si no entendió, repetir resumen
  const repeatMsg = isEnglish ? "Reply *yes* to confirm or *no* to cancel." : "Responde *sí* para confirmar o *no* para cancelar.";
  await message.reply(repeatMsg);
  return { nextState: 'CONFIRMING' };
}

async function showOrderSummary({ tenant, message, context }) {
  const items = context.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = context.deliveryFee || 0;
  const total = subtotal + deliveryFee;
  const isEnglish = context.isEnglish;

  const title = isEnglish ? `📋 *Order Summary*` : `📋 *Resumen del pedido*`;
  const lines = [
    title,
    '',
    ...items.map((i) => `• ${i.quantity}x ${i.name} — ${formatMoney(i.price * i.quantity, tenant.currency, isEnglish, tenant.exchangeRate)}`),
    '',
    `Subtotal: ${formatMoney(subtotal, tenant.currency, isEnglish, tenant.exchangeRate)}`,
  ];
  if (deliveryFee) lines.push(`Delivery: ${formatMoney(deliveryFee, tenant.currency, isEnglish, tenant.exchangeRate)}`);
  lines.push(`*Total: ${formatMoney(total, tenant.currency, isEnglish, tenant.exchangeRate)}*`);
  lines.push('');
  if (context.deliveryAddress) lines.push(`📍 ${isEnglish ? "Address" : "Dirección"}: ${context.deliveryAddress}`);
  lines.push(`💳 ${paymentLabel(context.paymentMethod, isEnglish)}`);
  lines.push('');

  const buttons = isEnglish 
    ? [{ id: 'yes', title: '✅ Yes, Confirm' }, { id: 'no', title: '❌ No, Cancel' }]
    : [{ id: 'sí', title: '✅ Sí, Confirmar' }, { id: 'no', title: '❌ No, Cancelar' }];

  await message.sendButtons(lines.join('\n'), buttons);
}

async function createOrder({ tenant, customer, context }) {
  const items = context.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = context.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  // Consecutivo por tenant
  const last = await prisma.order.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });
  const orderNumber = (last?.orderNumber ?? 0) + 1;

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      orderNumber,
      status: 'PENDING',
      type: context.orderType || 'DELIVERY',
      subtotal,
      deliveryFee,
      total,
      paymentMethod: context.paymentMethod,
      deliveryAddress: context.deliveryAddress,
      deliveryZoneId: context.deliveryZoneId,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity,
        })),
      },
    },
    include: {
      customer: true,
      items: true,
    },
  });

  // Actualizar stats del cliente
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalOrders: { increment: 1 },
      totalSpent: { increment: total },
      lastOrderAt: new Date(),
    },
  });

  // Si fiao: crear entrada de deuda
  if (context.paymentMethod === 'FIAO' && tenant.fiaoEnabled) {
    const lastEntry = await prisma.fiaoEntry.findFirst({
      where: { tenantId: tenant.id, customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
    const prevBalance = lastEntry ? Number(lastEntry.balance) : 0;
    await prisma.fiaoEntry.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        orderId: order.id,
        type: 'DEBT',
        amount: total,
        balance: prevBalance + total,
      },
    });
  }

  return order;
}

function formatOrderForOwner(tenant, customer, order, context) {
  const items = context.items || [];
  const isEnglish = context.isEnglish;
  const mapsUrl = context.deliveryAddress 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(context.deliveryAddress)}`
    : null;

  return [
    `🔔 *PEDIDO NUEVO #${String(order.orderNumber).padStart(3, '0')}*`,
    '',
    `👤 ${customer.name || customer.phone}`,
    `📱 ${customer.phone}`,
    '',
    ...items.map((i) => `• ${i.quantity}x ${i.name}`),
    '',
    `💰 ${formatMoney(order.total, tenant.currency, isEnglish, tenant.exchangeRate)}`,
    `� ${paymentLabel(order.paymentMethod)}`,
    context.deliveryAddress ? `📍 *Dirección:* ${context.deliveryAddress}` : '',
    order.type === 'DELIVERY' && !context.deliveryAddress ? (isEnglish ? '🛵 *Delivery*' : '🛵 *Entrega a domicilio*') : '',
    mapsUrl ? `🗺️ *Ubicación:* ${mapsUrl}` : '',
    `🔗 *Panel:* ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
  ].filter(Boolean).join('\n');
}

function paymentLabel(method, isEnglish = false) {
  const labels = isEnglish 
    ? { CASH: 'Cash', TRANSFER: 'Transfer', FIAO: 'Credit (Fiao)', CARD: 'Card' }
    : { CASH: 'Efectivo', TRANSFER: 'Transferencia', FIAO: 'Fiao', CARD: 'Tarjeta' };
  return labels[method] || method;
}
