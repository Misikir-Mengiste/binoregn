-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'TELEBIRR', 'CBE_BIRR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "payoutAccountName" TEXT,
ADD COLUMN     "payoutAccountNumber" TEXT,
ADD COLUMN     "payoutBankName" TEXT,
ADD COLUMN     "payoutMethod" "PayoutMethod";
