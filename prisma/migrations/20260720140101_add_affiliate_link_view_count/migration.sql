-- AlterTable
ALTER TABLE "AffiliateLink" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
