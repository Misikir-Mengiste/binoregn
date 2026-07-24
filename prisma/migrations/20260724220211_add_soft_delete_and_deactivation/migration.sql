-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "deletedAt" TIMESTAMP(3);
