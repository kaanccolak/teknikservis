-- DropIndex
DROP INDEX "SecondHandDevice_deviceCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "SecondHandDevice_shopId_deviceCode_key" ON "SecondHandDevice"("shopId", "deviceCode");
