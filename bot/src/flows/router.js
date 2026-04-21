import { prisma } from '../lib/prisma.js';
import { mainMenuFlow } from './mainMenu.js';
import { orderingFlow } from './ordering.js';
import { addressFlow, zoneFlow } from './address.js';
import { confirmFlow } from './confirm.js';

/**
 * Router del state machine de conversaciones.
 * Cada estado tiene su handler en /flows/*.js
 */
const HANDLERS = {
  MAIN_MENU: mainMenuFlow,
  BROWSING_MENU: orderingFlow,
  ORDERING: orderingFlow,
  ASKING_ADDRESS: addressFlow,
  ASKING_ZONE: zoneFlow,
  ASKING_PAYMENT: confirmFlow,
  CONFIRMING: confirmFlow,
};

export async function routeByState(ctx) {
  const { conversation } = ctx;
  const handler = HANDLERS[conversation.state] || mainMenuFlow;
  const result = await handler(ctx);

  if (result?.nextState || result?.context !== undefined) {
    await prisma.conversation.update({
      where: { customerId: ctx.customer.id },
      data: {
        state: result.nextState ?? conversation.state,
        context: result.context ?? conversation.context,
      },
    });
  }
}
