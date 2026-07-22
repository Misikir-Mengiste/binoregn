-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "compareAtBirr" INTEGER,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER DEFAULT 0,
ADD COLUMN     "soldCount" INTEGER DEFAULT 0;
