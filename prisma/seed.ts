import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Seeds exactly one ADMIN user (no demo/catalog data).
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  if (!adminEmail) {
    throw new Error(
      "ADMIN_SEED_EMAIL is not set — add it to .env before seeding.",
    );
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, role: "ADMIN" },
  });

  console.log(`Seeded admin user: ${admin.email} (${admin.id})`);
}

async function main() {
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
