import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  evarynPrisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.evarynPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.evarynPrisma = prisma;
}