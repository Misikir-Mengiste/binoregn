import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The admin account is fixed/seeded, never self-registered
// (architecture.md Auth and Access Model). Running this promotes
// (or creates) exactly one User row to role ADMIN, identified by
// ADMIN_SEED_EMAIL — whoever signs in with that email later
// attaches to this row instead of getting a default CREATOR row.
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
  return admin;
}

// Demo data for local development / a populated-looking dashboard.
// Not idempotent — running this twice adds a second copy of
// everything (products have no natural unique key to upsert on).
// Guarded by a marker product name so `npx prisma db seed` run
// twice doesn't duplicate the demo set specifically (your own real
// products/creators are untouched either way).
const DEMO_MARKER = "Wireless Bluetooth Earbuds";

async function seedDemoData() {
  const alreadySeeded = await prisma.product.findFirst({
    where: { name: DEMO_MARKER },
    select: { id: true },
  });
  if (alreadySeeded) {
    console.log("Demo data already present — skipping.");
    return;
  }

  const products = await Promise.all(
    [
      { name: "Wireless Bluetooth Earbuds", priceBirr: 2200, commissionBirr: 200 },
      { name: "Smart Watch Fitness Tracker", priceBirr: 3500, commissionBirr: 350 },
      { name: "Portable Power Bank 20000mAh", priceBirr: 1200, commissionBirr: 100 },
      { name: "Leather Crossbody Bag", priceBirr: 1800, commissionBirr: 180 },
      { name: "Traditional Habesha Dress", priceBirr: 4500, commissionBirr: 450 },
      { name: "Stainless Steel Water Bottle", priceBirr: 450, commissionBirr: 50 },
      { name: "Wireless Phone Charger Pad", priceBirr: 900, commissionBirr: 90 },
      { name: "UV Protection Sunglasses", priceBirr: 650, commissionBirr: 70 },
    ].map((data) =>
      prisma.product.create({
        data: { ...data, description: null, imageUrls: [] },
      }),
    ),
  );
  console.log(`Seeded ${products.length} products.`);

  const creators = await Promise.all(
    [
      { email: "bruk.tesfaye@example.com", name: "Bruk Tesfaye" },
      { email: "lily.kebede@example.com", name: "Lily Kebede" },
      { email: "daniel.girma@example.com", name: "Daniel Girma" },
      { email: "hana.mulu@example.com", name: "Hana Mulu" },
    ].map((data) =>
      prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: { ...data, role: "CREATOR" },
      }),
    ),
  );
  console.log(`Seeded ${creators.length} creators.`);

  // A couple of creators have a payout method on file, to demo
  // that admin's commissions list actually has something to show.
  await prisma.user.update({
    where: { email: "bruk.tesfaye@example.com" },
    data: {
      payoutMethod: "TELEBIRR",
      payoutAccountName: "Bruk Tesfaye",
      payoutAccountNumber: "0911000111",
    },
  });
  await prisma.user.update({
    where: { email: "lily.kebede@example.com" },
    data: {
      payoutMethod: "BANK_TRANSFER",
      payoutAccountName: "Lily Kebede",
      payoutAccountNumber: "1000234567890",
      payoutBankName: "Commercial Bank of Ethiopia",
    },
  });

  const [bruk, lily, daniel, hana] = creators;
  const [
    earbuds,
    watch,
    powerbank,
    bag,
    dress,
    bottle,
    charger,
    sunglasses,
  ] = products;

  // (creator, product, decision) — a spread of PENDING / APPROVED /
  // REJECTED so the Applications list has every status to show.
  const applicationPlan: {
    creator: (typeof creators)[number];
    product: (typeof products)[number];
    status: "PENDING" | "APPROVED" | "REJECTED";
  }[] = [
    { creator: bruk, product: earbuds, status: "APPROVED" },
    { creator: bruk, product: watch, status: "APPROVED" },
    { creator: bruk, product: bottle, status: "PENDING" },
    { creator: lily, product: bag, status: "APPROVED" },
    { creator: lily, product: dress, status: "APPROVED" },
    { creator: lily, product: sunglasses, status: "REJECTED" },
    { creator: daniel, product: powerbank, status: "APPROVED" },
    { creator: daniel, product: charger, status: "PENDING" },
    { creator: hana, product: earbuds, status: "PENDING" },
    { creator: hana, product: watch, status: "REJECTED" },
  ];

  const affiliateLinks = new Map<string, string>(); // "creatorId:productId" -> linkId

  for (const plan of applicationPlan) {
    const application = await prisma.application.create({
      data: {
        creatorId: plan.creator.id,
        productId: plan.product.id,
        status: plan.status,
        decidedAt: plan.status === "PENDING" ? null : new Date(),
      },
    });

    if (plan.status === "APPROVED") {
      const link = await prisma.affiliateLink.create({
        data: {
          creatorId: plan.creator.id,
          productId: plan.product.id,
          applicationId: application.id,
        },
      });
      affiliateLinks.set(`${plan.creator.id}:${plan.product.id}`, link.id);
    }
  }
  console.log(
    `Seeded ${applicationPlan.length} applications, ${affiliateLinks.size} affiliate links.`,
  );

  // Orders spanning every real state the system has, so
  // admin/orders and admin/commissions both have something to show
  // in every column and status filter — created directly with the
  // same conditions lib/commission.maybeCreateCommission checks
  // (delivered AND cash-reconciled -> commission), not by calling
  // that function (this script uses its own PrismaClient instance,
  // not the lib/prisma.ts singleton the app runtime uses).
  const orderPlan: {
    linkKey: string;
    buyerName: string;
    buyerPhone: string;
    buyerAddress: string;
    deliveryStatus: "PLACED" | "DELIVERED" | "CANCELLED" | "RETURNED";
    cashReconciled: boolean;
    commissionStatus: "NONE" | "PENDING" | "PAID";
  }[] = [
    {
      linkKey: `${bruk.id}:${earbuds.id}`,
      buyerName: "Abebe Kebede",
      buyerPhone: "0911223344",
      buyerAddress: "Bole, Addis Ababa",
      deliveryStatus: "PLACED",
      cashReconciled: false,
      commissionStatus: "NONE",
    },
    {
      linkKey: `${bruk.id}:${watch.id}`,
      buyerName: "Selam Fikru",
      buyerPhone: "0922334455",
      buyerAddress: "Piassa, Addis Ababa",
      deliveryStatus: "DELIVERED",
      cashReconciled: false,
      commissionStatus: "NONE",
    },
    {
      linkKey: `${lily.id}:${bag.id}`,
      buyerName: "Meron Alemu",
      buyerPhone: "0933445566",
      buyerAddress: "CMC, Addis Ababa",
      deliveryStatus: "DELIVERED",
      cashReconciled: true,
      commissionStatus: "PENDING",
    },
    {
      linkKey: `${lily.id}:${dress.id}`,
      buyerName: "Yordanos Assefa",
      buyerPhone: "0944556677",
      buyerAddress: "Kazanchis, Addis Ababa",
      deliveryStatus: "DELIVERED",
      cashReconciled: true,
      commissionStatus: "PAID",
    },
    {
      linkKey: `${daniel.id}:${powerbank.id}`,
      buyerName: "Nahom Girma",
      buyerPhone: "0955667788",
      buyerAddress: "Megenagna, Addis Ababa",
      deliveryStatus: "DELIVERED",
      cashReconciled: true,
      commissionStatus: "PAID",
    },
    {
      linkKey: `${daniel.id}:${powerbank.id}`,
      buyerName: "Ruth Solomon",
      buyerPhone: "0966778899",
      buyerAddress: "Gerji, Addis Ababa",
      deliveryStatus: "CANCELLED",
      cashReconciled: false,
      commissionStatus: "NONE",
    },
  ];

  let orderCount = 0;
  let commissionCount = 0;

  for (const plan of orderPlan) {
    const linkId = affiliateLinks.get(plan.linkKey);
    if (!linkId) continue;
    const link = await prisma.affiliateLink.findUniqueOrThrow({
      where: { id: linkId },
      select: { productId: true, creatorId: true },
    });

    const order = await prisma.order.create({
      data: {
        productId: link.productId,
        affiliateLinkId: linkId,
        creatorId: link.creatorId,
        buyerName: plan.buyerName,
        buyerPhone: plan.buyerPhone,
        buyerAddress: plan.buyerAddress,
        deliveryStatus: plan.deliveryStatus,
        cashReconciledAt: plan.cashReconciled ? new Date() : null,
      },
    });
    orderCount += 1;

    if (plan.commissionStatus !== "NONE") {
      const product = products.find((p) => p.id === link.productId)!;
      await prisma.commission.create({
        data: {
          orderId: order.id,
          creatorId: link.creatorId,
          amountBirr: product.commissionBirr,
          status: plan.commissionStatus,
          paidAt: plan.commissionStatus === "PAID" ? new Date() : null,
        },
      });
      commissionCount += 1;
    }
  }
  console.log(`Seeded ${orderCount} orders, ${commissionCount} commissions.`);
}

async function main() {
  await seedAdmin();
  await seedDemoData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
