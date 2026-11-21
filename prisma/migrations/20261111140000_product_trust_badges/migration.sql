-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "trustBadges" TEXT[] DEFAULT ARRAY['Free Delivery', 'Delivered within 2 hours', 'Same day return', 'Nothing to pay before delivery']::TEXT[];

