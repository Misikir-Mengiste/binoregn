-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sellerName" TEXT,
ADD COLUMN     "sellerRating" DOUBLE PRECISION,
ADD COLUMN     "sellerSoldCount" INTEGER DEFAULT 0,
ADD COLUMN     "sellerVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingArrives" TEXT,
ADD COLUMN     "shippingDeliveryTime" TEXT,
ADD COLUMN     "shippingDiscountLabel" TEXT,
ADD COLUMN     "shippingPackageLabel" TEXT;
