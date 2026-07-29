import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Like clear.ts, but keeps the super admin (ADMIN_SEED_EMAIL) around instead
// of wiping every user — lets you reset demo/test data without having to
// re-run `prisma db seed` and re-authenticate afterward.
async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  if (!adminEmail) {
    throw new Error(
      "ADMIN_SEED_EMAIL is not set — add it to .env before resetting.",
    );
  }

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error(
      `No user found for ADMIN_SEED_EMAIL (${adminEmail}) — run \`npx prisma db seed\` first.`,
    );
  }

  // FK-safe delete order: children first, parents last. Session/Account/User
  // deletes are scoped to exclude the super admin so their row (and active
  // login) survives the reset.
  await prisma.$transaction([
    prisma.commission.deleteMany(),
    prisma.withdrawal.deleteMany(),
    prisma.order.deleteMany(),
    prisma.affiliateLink.deleteMany(),
    prisma.application.deleteMany(),
    prisma.product.deleteMany(),
    prisma.payoutOption.deleteMany(),
    prisma.session.deleteMany({ where: { userId: { not: admin.id } } }),
    prisma.account.deleteMany({ where: { userId: { not: admin.id } } }),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany({ where: { id: { not: admin.id } } }),
  ]);

  console.log(
    `Database reset — kept super admin ${admin.email} (${admin.id}), removed everything else.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
