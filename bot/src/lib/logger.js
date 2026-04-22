import pino from 'pino';

const level = ['trace','debug','info','warn','error','fatal'].includes(process.env.LOG_LEVEL)
  ? process.env.LOG_LEVEL
  : 'info';

export const logger = pino({ level });

export const tenantLogger = (tenantId, tenantSlug) =>
  logger.child({ tenantId, tenant: tenantSlug });
