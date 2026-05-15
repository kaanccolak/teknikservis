-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Personnel_shopId_idx" ON "Personnel"("shopId");

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN "personnelId" TEXT;

-- AlterTable
ALTER TABLE "StatusLog" ADD COLUMN "personnelId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusLog" ADD CONSTRAINT "StatusLog_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
