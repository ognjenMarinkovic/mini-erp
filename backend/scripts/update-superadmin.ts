import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSuperadmin() {
  const email = 'ognjenmarinkovic369@gmail.com';
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`Korisnik sa email-om ${email} ne postoji u bazi.`);
      return;
    }

    if (user.role === 'SUPERADMIN') {
      console.log(`Korisnik ${email} već ima SUPERADMIN role.`);
      return;
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'SUPERADMIN' },
    });

    console.log(`Korisnik ${email} je ažuriran na SUPERADMIN role.`);
    console.log('Ažurirani korisnik:', updated);
  } catch (error) {
    console.error('Greška pri ažuriranju:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperadmin();
