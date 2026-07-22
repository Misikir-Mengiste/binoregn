/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[creatorUsername]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CreatorPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK', 'TELEGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatorCategory" AS ENUM ('TECH', 'FASHION', 'BEAUTY', 'LIFESTYLE', 'FOOD', 'GAMING', 'EDUCATION', 'COMEDY', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatorProfileStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "care" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "returns" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "shipping" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subCategory" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "creatorCategory" "CreatorCategory",
ADD COLUMN     "creatorDisplayName" TEXT,
ADD COLUMN     "creatorOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "creatorPhone" TEXT,
ADD COLUMN     "creatorPlatform" "CreatorPlatform",
ADD COLUMN     "creatorProfileStatus" "CreatorProfileStatus",
ADD COLUMN     "creatorProfileUrl" TEXT,
ADD COLUMN     "creatorUsername" TEXT;

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amountBirr" INTEGER NOT NULL,
    "payoutMethod" "PayoutMethod" NOT NULL,
    "payoutAccountName" TEXT,
    "payoutAccountNumber" TEXT,
    "payoutBankName" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_creatorUsername_key" ON "User"("creatorUsername");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
