import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // FK-safe delete order: children first, parents last.
  await prisma.$transaction([
    prisma.commission.deleteMany(),
    prisma.withdrawal.deleteMany(),
    prisma.order.deleteMany(),
    prisma.affiliateLink.deleteMany(),
    prisma.application.deleteMany(),
    prisma.product.deleteMany(),
    prisma.payoutOption.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Database cleared (application tables).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
