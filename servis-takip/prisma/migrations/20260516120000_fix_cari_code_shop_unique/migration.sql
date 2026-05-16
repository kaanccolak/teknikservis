-- DropIndex
DROP INDEX "Cari_cariCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Cari_shopId_cariCode_key" ON "Cari"("shopId", "cariCode");
