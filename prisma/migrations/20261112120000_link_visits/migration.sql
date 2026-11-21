-- CreateTable
CREATE TABLE "LinkVisit" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "lastCountedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkVisit_lastCountedAt_idx" ON "LinkVisit"("lastCountedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LinkVisit_linkId_visitorId_key" ON "LinkVisit"("linkId", "visitorId");

-- AddForeignKey
ALTER TABLE "LinkVisit" ADD CONSTRAINT "LinkVisit_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

