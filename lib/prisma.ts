import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js hot-reloads modules in dev, which would otherwise create
// a new PrismaClient (and a new connection pool) on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const basePrisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}

// Order, Commission, and Application are financial/approval
// records — context/architecture.md's invariants require their history
// to persist (immutable audit trail, forward-only status, approval
// gates AffiliateLink creation), so admin "delete" on these is a soft
// delete via deletedAt rather than a real DROP. This extension makes
// that transparent for every caller: reads automatically exclude
// deleted rows, and .delete()/.deleteMany() become an update instead of
// destroying the row — ordinary CRUD code elsewhere doesn't need to
// know about it.
const SOFT_DELETE_MODELS = new Set([
  "Order",
  "Commission",
  "Application",
]);

// Explicit per-model dispatch (rather than dynamic `basePrisma[key]`
// indexing) so each branch stays fully typed — the four clients' update
// signatures don't unify into one callable type. `where` is cast per
// branch: it arrives here as the extension's untyped JsArgs, but it's
// always the same where-clause Prisma itself already validated for the
// original delete/deleteMany call, just re-typed for the update call.
function softDelete(model: string, where: Record<string, unknown>, many: boolean) {
  switch (model) {
    case "Order":
      return many
        ? basePrisma.order.updateMany({
            where: where as Parameters<typeof basePrisma.order.updateMany>[0]["where"],
            data: { deletedAt: new Date() },
          })
        : basePrisma.order.update({
            where: where as Parameters<typeof basePrisma.order.update>[0]["where"],
            data: { deletedAt: new Date() },
          });
    case "Commission":
      return many
        ? basePrisma.commission.updateMany({
            where: where as Parameters<typeof basePrisma.commission.updateMany>[0]["where"],
            data: { deletedAt: new Date() },
          })
        : basePrisma.commission.update({
            where: where as Parameters<typeof basePrisma.commission.update>[0]["where"],
            data: { deletedAt: new Date() },
          });
    case "Application":
      return many
        ? basePrisma.application.updateMany({
            where: where as Parameters<typeof basePrisma.application.updateMany>[0]["where"],
            data: { deletedAt: new Date() },
          })
        : basePrisma.application.update({
            where: where as Parameters<typeof basePrisma.application.update>[0]["where"],
            data: { deletedAt: new Date() },
          });
    default:
      throw new Error(`softDelete: unsupported model "${model}"`);
  }
}

const READ_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !SOFT_DELETE_MODELS.has(model)) {
          return query(args);
        }

        if (READ_OPERATIONS.has(operation)) {
          const nextArgs = args as { where?: Record<string, unknown> };
          nextArgs.where = { ...nextArgs.where, deletedAt: null };
          return query(nextArgs);
        }

        if (operation === "delete" || operation === "deleteMany") {
          const { where } = args as { where: Record<string, unknown> };
          return softDelete(model, where, operation === "deleteMany");
        }

        return query(args);
      },
    },
  },
});
