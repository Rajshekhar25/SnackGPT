import { PrismaClient } from "@prisma/client";

// Next.js hot-reloads modules in dev, which would otherwise open a new pool on
// every reload until Postgres refuses connections. Reuse one client per process.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
