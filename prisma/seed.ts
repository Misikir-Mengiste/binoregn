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

// Admin-manageable payout picklist (context: replaces the previously
// hardcoded CREATOR_BANKS array). Idempotent upsert on
// [category, name] so re-running the seed never duplicates rows or
// clobbers an admin's later isActive toggle.
const SEED_BANKS = [
  "Commercial Bank of Ethiopia",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Cooperative Bank of Oromia",
  "Wegagen Bank",
  "Abay Bank",
  "Other",
];
const SEED_WALLETS = ["Telebirr"];

async function seedPayoutOptions() {
  let count = 0;
  for (const [index, name] of SEED_BANKS.entries()) {
    await prisma.payoutOption.upsert({
      where: { category_name: { category: "BANK", name } },
      update: {},
      create: { category: "BANK", name, sortOrder: index },
    });
    count += 1;
  }
  for (const [index, name] of SEED_WALLETS.entries()) {
    await prisma.payoutOption.upsert({
      where: { category_name: { category: "WALLET", name } },
      update: {},
      create: { category: "WALLET", name, sortOrder: index },
    });
    count += 1;
  }
  console.log(`Seeded ${count} payout options (banks + wallets).`);
}

// Demo data for local development / a populated-looking dashboard.
// Not idempotent — running this twice adds a second copy of
// everything (products have no natural unique key to upsert on).
// Guarded by a marker product name so `npx prisma db seed` run
// twice doesn't duplicate the demo set specifically (your own real
// products/creators are untouched either way).
const DEMO_MARKER = "Wireless Bluetooth Earbuds";

// Placeholder photos — no real product photography exists for demo
// data, and Cloudinary uploads only happen via the admin product
// form's client-side signed upload (lib/cloudinary.ts), not from
// this script. Lorem Picsum's seeded URLs are deterministic (same
// seed always returns the same photo) and were verified live
// (curl, 200 + image/jpeg) before being hardcoded here.
const imageSeed = (slug: string, n: number) =>
  `https://picsum.photos/seed/${slug}-${n}/800/600`;

// Shared by seedDemoData() (new rows) and backfillProductImages()
// (rows created before imageUrls existed in the seed) so the two
// never drift out of sync.
const PRODUCT_IMAGE_SLUGS: Record<string, string> = {
  "Wireless Bluetooth Earbuds": "earbuds",
  "Smart Watch Fitness Tracker": "smartwatch",
  "Portable Power Bank 20000mAh": "powerbank",
  "Leather Crossbody Bag": "bag",
  "Traditional Habesha Dress": "dress",
  "Stainless Steel Water Bottle": "bottle",
  "Wireless Phone Charger Pad": "charger",
  "UV Protection Sunglasses": "sunglasses",
};

// Existing rows from before imageUrls was part of the seed (or any
// product an admin created without uploading photos) are left with
// imageUrls: [] forever, since seedDemoData() is marker-guarded and
// only ever runs its create() calls once. Runs unconditionally and
// only touches rows that are still empty, so it's safe to re-run.
async function backfillProductImages() {
  let count = 0;
  for (const [name, slug] of Object.entries(PRODUCT_IMAGE_SLUGS)) {
    const result = await prisma.product.updateMany({
      where: { name, imageUrls: { isEmpty: true } },
      data: {
        imageUrls: [imageSeed(slug, 1), imageSeed(slug, 2)],
      },
    });
    count += result.count;
  }
  if (count > 0) {
    console.log(`Backfilled images for ${count} product(s) that had none.`);
  }
}

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
      {
        name: "Wireless Bluetooth Earbuds",
        priceBirr: 2200,
        commissionBirr: 200,
        description: "Compact earbuds with a pocket case and clear audio.",
        category: "Electronics",
        subCategory: "Audio",
        colors: ["#1F2933", "#E5E7EB"],
        sizes: [],
        features: [
          "Bluetooth 5.3 connectivity",
          "Noise isolation",
          "Compact charging case",
        ],
        care: ["Wipe with dry cloth", "Avoid moisture exposure"],
        shipping: ["Free delivery over 2000 Birr", "Ships in 1-2 business days"],
        returns: ["7-day return window", "Must include original packaging"],
        imageSlug: "earbuds",
      },
      {
        name: "Smart Watch Fitness Tracker",
        priceBirr: 3500,
        commissionBirr: 350,
        description: "Track steps, sleep, and heart rate with a bright display.",
        category: "Electronics",
        subCategory: "Wearables",
        colors: ["#111827", "#9CA3AF"],
        sizes: ["S", "M", "L"],
        features: ["Heart rate monitoring", "Sleep tracking", "Water resistant"],
        care: ["Clean with microfiber cloth", "Charge with included cable only"],
        shipping: ["Standard shipping available", "Next-day delivery in Addis"],
        returns: ["10% restocking fee on opened boxes"],
        imageSlug: "smartwatch",
      },
      {
        name: "Portable Power Bank 20000mAh",
        priceBirr: 1200,
        commissionBirr: 100,
        description: "High-capacity backup power for phones and tablets.",
        category: "Electronics",
        subCategory: "Accessories",
        colors: ["#111827", "#6B7280"],
        sizes: [],
        features: ["20000mAh capacity", "Dual USB output", "Fast charging"],
        care: ["Keep away from heat", "Recharge every 3 months"],
        shipping: ["Ships nationwide", "Delivery 2-4 business days"],
        returns: ["14-day return window"],
        imageSlug: "powerbank",
      },
      {
        name: "Leather Crossbody Bag",
        priceBirr: 1800,
        commissionBirr: 180,
        description: "Soft leather bag with adjustable strap and inner pockets.",
        category: "Accessories",
        subCategory: "Bags",
        colors: ["#7C4A2D", "#1F2933"],
        sizes: [],
        features: ["Adjustable strap", "Inner zip pocket", "Premium leather"],
        care: ["Condition leather monthly", "Avoid direct sunlight"],
        shipping: ["Free delivery in Addis Ababa"],
        returns: ["7-day return window", "Must be unused"],
        imageSlug: "bag",
      },
      {
        name: "Traditional Habesha Dress",
        priceBirr: 4500,
        commissionBirr: 450,
        description: "Handwoven traditional dress with embroidered detailing.",
        category: "Clothing",
        subCategory: "Dresses",
        colors: ["#F9FAFB", "#E0B56B"],
        sizes: ["XS", "S", "M", "L", "XL"],
        features: ["Handwoven fabric", "Embroidered neckline", "Breathable"],
        care: ["Dry clean only", "Store flat to avoid wrinkles"],
        shipping: ["Made to order", "Ships in 5-7 business days"],
        returns: ["Custom orders are final sale"],
        imageSlug: "dress",
      },
      {
        name: "Stainless Steel Water Bottle",
        priceBirr: 450,
        commissionBirr: 50,
        description: "Insulated bottle that keeps drinks cold or hot.",
        category: "Home",
        subCategory: "Kitchen",
        colors: ["#111827", "#F97316"],
        sizes: ["18L", "20L"],
        features: ["Double wall insulation", "Leak-proof lid"],
        care: ["Hand wash with mild soap"],
        shipping: ["Ships in 1-2 business days"],
        returns: ["30-day return window"],
        imageSlug: "bottle",
      },
      {
        name: "Wireless Phone Charger Pad",
        priceBirr: 900,
        commissionBirr: 90,
        description: "Slim pad for fast wireless charging.",
        category: "Electronics",
        subCategory: "Accessories",
        colors: ["#111827", "#E5E7EB"],
        sizes: [],
        features: ["10W fast charge", "Non-slip surface"],
        care: ["Avoid liquid spills"],
        shipping: ["Local delivery available"],
        returns: ["7-day return window"],
        imageSlug: "charger",
      },
      {
        name: "UV Protection Sunglasses",
        priceBirr: 650,
        commissionBirr: 70,
        description: "Lightweight sunglasses with UV400 lenses.",
        category: "Accessories",
        subCategory: "Eyewear",
        colors: ["#111827", "#A16207"],
        sizes: [],
        features: ["UV400 protection", "Polarized lenses"],
        care: ["Store in case", "Clean with microfiber cloth"],
        shipping: ["Ships nationwide"],
        returns: ["14-day return window"],
        imageSlug: "sunglasses",
      },
    ].map(({ imageSlug, ...data }) =>
      prisma.product.create({
        data: {
          ...data,
          compareAtBirr: Math.round(data.priceBirr * 1.2),
          rating: 4.7,
          ratingCount: 120,
          soldCount: 1000,
          sellerName: "Binoregn",
          sellerVerified: true,
          sellerRating: 5.0,
          sellerSoldCount: 1000,
          shippingDiscountLabel: "50% off",
          shippingPackageLabel: "Regular",
          shippingDeliveryTime: "3-4 working days",
          shippingArrives: "8-12 Oct 2026",
          imageUrls: [imageSeed(imageSlug, 1), imageSeed(imageSlug, 2)],
        },
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
  await seedPayoutOptions();
  await seedDemoData();
  await backfillProductImages();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
