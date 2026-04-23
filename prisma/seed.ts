import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const tenantId = 'cl-admin-01';

  console.log('🌱 Empezando siembra de datos...');

  // 1. Crear el Tenant (El Negocio)
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      slug: 'admin',
      name: 'Rapid Bot Admin',
      businessType: 'RESTAURANT',
      plan: 'PREMIUM',
      status: 'ACTIVE',
      whatsappNumber: '18296403859',
      ownerPhone: '18296403859',
      currency: 'DOP',
      exchangeRate: 60.0,
    },
  });

  // 2. Crear el Usuario Administrador
  const user = await prisma.user.upsert({
    where: { email: 'admin@rapidbot.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@rapidbot.com',
      name: 'Super Admin',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Datos insertados con éxito:');
  console.log(`   - Usuario: ${user.email}`);
  console.log(`   - Contraseña: admin123`);
  console.log(`   - Tenant: ${tenant.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });