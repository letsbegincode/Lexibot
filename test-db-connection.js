import prisma from './lib/prisma.js';

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');
    await prisma.$disconnect();
  } catch (e) {
    console.error('Database connection failed:', e);
  }
}

main();
