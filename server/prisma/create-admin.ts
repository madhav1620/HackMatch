/** Create one verified admin without changing existing users or seed data.
 * Run from the server workspace: npm run admin:create -- email@example.com "Admin Name"
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const email = z.string().trim().toLowerCase().email().parse(process.argv[2]);
const name = z.string().trim().min(2).max(80).parse(process.argv[3] || "HackMatch Admin");
const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error(`An account already exists for ${email}; no changes were made.`);

  const password = randomBytes(24).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "ADMIN", verified: true, primaryRole: "OTHER" },
  });
  console.log(`Admin account created for ${email}`);
  console.log(`Temporary password: ${password}`);
  console.log("Store this password securely. It cannot be retrieved from the database.");
} finally {
  await prisma.$disconnect();
}
