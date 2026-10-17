import { PrismaClient } from "@prisma/client";

// Singleton Prisma client (dev hot-reload safe)
export const prisma = new PrismaClient();
