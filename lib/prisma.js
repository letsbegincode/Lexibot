import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// No changes needed here if your schema uses String or Int for user IDs.
// If you use BigInt in your schema, ensure your DB and Prisma version support it on Vercel.