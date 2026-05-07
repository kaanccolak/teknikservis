/**
 * Tek seferlik: userId'siz (Atarici) dükkandaki tüm verileri userId'li (Demo) dükkana taşır,
 * ardından eski Shop kaydını siler.
 *
 * Çalıştır (proje kökünden):
 *   npx tsx src/scripts/migrate-shop.ts
 */
import { prisma } from "../lib/prisma";

async function migrateShop() {
  const oldShop = await prisma.shop.findFirst({
    where: { userId: null },
    orderBy: { createdAt: "asc" },
  });

  const newShop = await prisma.shop.findFirst({
    where: { userId: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  const oldCount = await prisma.shop.count({ where: { userId: null } });
  const newCount = await prisma.shop.count({
    where: { userId: { not: null } },
  });

  if (oldCount > 1) {
    console.warn(
      `Uyarı: userId null olan ${oldCount} shop var; createdAt'e göre ilki kullanılıyor.`,
    );
  }
  if (newCount > 1) {
    console.warn(
      `Uyarı: userId dolu ${newCount} shop var; createdAt'e göre ilki kullanılıyor.`,
    );
  }

  if (!oldShop || !newShop) {
    console.log("Shop bulunamadı:", { oldShop, newShop });
    return;
  }

  if (oldShop.id === newShop.id) {
    console.log("Kaynak ve hedef aynı shop; işlem gerekmiyor.");
    return;
  }

  console.log(
    `Atarici (${oldShop.id}) → Demo (${newShop.id}) taşınıyor...`,
  );

  await prisma.$transaction(async (tx) => {
    const oldSettingKeys = (
      await tx.setting.findMany({
        where: { shopId: oldShop.id },
        select: { key: true },
      })
    ).map((s) => s.key);

    if (oldSettingKeys.length > 0) {
      await tx.setting.deleteMany({
        where: {
          shopId: newShop.id,
          key: { in: oldSettingKeys },
        },
      });
    }

    await Promise.all([
      tx.customer.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.serviceOrder.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.deviceType.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.brand.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.deviceModel.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.sparePart.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.sparePartUsage.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.cari.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.externalService.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.paymentPlan.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.secondHandDevice.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
      tx.setting.updateMany({
        where: { shopId: oldShop.id },
        data: { shopId: newShop.id },
      }),
    ]);

    await tx.shop.delete({
      where: { id: oldShop.id },
    });
  });

  console.log(
    "Migration tamamlandı! Tüm veriler Demo hesabına taşındı.",
  );
}

migrateShop()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
