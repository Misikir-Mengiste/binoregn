
-- CreateEnum
CREATE TYPE "PayoutOptionCategory" AS ENUM ('BANK', 'WALLET');

-- CreateEnum
CREATE TYPE "OrderFulfillmentStatus" AS ENUM ('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfillmentStatus" "OrderFulfillmentStatus" NOT NULL DEFAULT 'PLACED';

-- CreateTable
CREATE TABLE "PayoutOption" (
    "id" TEXT NOT NULL,
    "category" "PayoutOptionCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutOption_category_name_key" ON "PayoutOption"("category", "name");

