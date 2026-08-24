import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding initial event configuration & default admin...');

  // Create default event configuration
  const event = await prisma.eventConfig.upsert({
    where: { id: 'default-msc-event' },
    update: {},
    create: {
      id: 'default-msc-event',
      name: 'MSC Annual Tech Symposium 2026',
      description: 'The flagship annual technology and innovation symposium featuring industry leaders, hands-on workshops, and tech showcases.',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      venue: 'Main University Auditorium & Online Stream',
      totalCapacity: 100,
      confirmationWindowHours: 1,
      queueConfirmationWindowHours: 1,
      registrationOpen: true,
    },
  });

  // Create default admin
  const passwordHash = await bcrypt.hash('Admin@MSC2026', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@msc.edu' },
    update: {},
    create: {
      email: 'admin@msc.edu',
      passwordHash,
      name: 'MSC System Admin',
      role: 'ADMIN',
    },
  });

  console.log('[SEED] Success!');
  console.log(`Event Created: ${event.name}`);
  console.log(`Admin Created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
