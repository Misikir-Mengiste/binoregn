-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountBirr" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCode" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountBirr" INTEGER,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountEnabled" BOOLEAN NOT NULL DEFAULT false;

