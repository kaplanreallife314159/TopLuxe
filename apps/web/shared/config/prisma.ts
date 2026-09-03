import { PrismaClient } from '@prisma/client';

/**
 * Instance Prisma singleton — TopLuxe.
 * Pattern standard Next.js pour éviter la création de multiples instances lors du hot-reload
 * en développement.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
