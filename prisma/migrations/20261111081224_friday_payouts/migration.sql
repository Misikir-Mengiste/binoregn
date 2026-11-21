-- Friday payouts replace creator withdrawal requests (progress-tracker
-- 2026-11-11). Order: create Payout + Commission.payoutId, convert the
-- legacy data, then drop Withdrawal.

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amountBirr" INTEGER NOT NULL,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payoutMethod" "PayoutMethod",
    "payoutAccountName" TEXT,
    "payoutAccountNumber" TEXT,
    "payoutBankName" TEXT,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "payoutId" TEXT;

-- CreateIndex
CREATE INDEX "Payout_creatorId_idx" ON "Payout"("creatorId");

-- CreateIndex
CREATE INDEX "Commission_status_createdAt_idx" ON "Commission"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Convert legacy data (site not launched — confirmed with the user, so
-- this is a best-effort conversion of test data, not exact accounting).
-- Before this change, delivery created commissions straight as PAID and
-- creators withdrew from that balance. Now PAID means "covered by a
-- payout". Per creator: oldest PAID commissions that fit inside the
-- creator's approved-withdrawal total stay PAID and are linked to one
-- legacy Payout; every other PAID commission goes back to PENDING so the
-- next Friday payout covers it. Pending/rejected withdrawals are simply
-- dropped (they were never paid).
DO $$
DECLARE
  creator RECORD;
  c RECORD;
  withdrawn integer;
  covered integer;
  legacy_payout_id text;
BEGIN
  FOR creator IN
    SELECT DISTINCT "creatorId" AS id FROM "Commission" WHERE "status" = 'PAID'
  LOOP
    SELECT COALESCE(SUM("amountBirr"), 0) INTO withdrawn
      FROM "Withdrawal"
      WHERE "creatorId" = creator.id AND "status" = 'APPROVED' AND "deletedAt" IS NULL;

    covered := 0;
    legacy_payout_id := NULL;

    FOR c IN
      SELECT "id", "amountBirr" FROM "Commission"
      WHERE "creatorId" = creator.id AND "status" = 'PAID'
      ORDER BY "createdAt", "id"
    LOOP
      IF covered + c."amountBirr" <= withdrawn THEN
        IF legacy_payout_id IS NULL THEN
          legacy_payout_id := 'legacy_' || md5(creator.id || clock_timestamp()::text);
          INSERT INTO "Payout" ("id", "creatorId", "amountBirr", "cutoffAt", "paidAt")
          VALUES (legacy_payout_id, creator.id, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        END IF;
        covered := covered + c."amountBirr";
        UPDATE "Commission" SET "payoutId" = legacy_payout_id WHERE "id" = c."id";
      ELSE
        UPDATE "Commission" SET "status" = 'PENDING', "paidAt" = NULL WHERE "id" = c."id";
      END IF;
    END LOOP;

    IF legacy_payout_id IS NOT NULL THEN
      UPDATE "Payout" SET "amountBirr" = covered WHERE "id" = legacy_payout_id;
    END IF;
  END LOOP;
END $$;

-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_creatorId_fkey";

-- DropTable
DROP TABLE "Withdrawal";

-- DropEnum
DROP TYPE "WithdrawalStatus";
