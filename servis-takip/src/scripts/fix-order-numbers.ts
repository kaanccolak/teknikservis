/**
 * Tek seferlik: orderNumber alanına yanlışlıkla cuid yazılmış kaydı düzeltir.
 *
 * Çalıştır (proje kökünden):
 *   npx tsx src/scripts/fix-order-numbers.ts
 *
 * ts-node ile (module uyarısı alırsanız tsx kullanın):
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/fix-order-numbers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BAD_ORDER_NUMBER = "cmot7qs2k00041u5zdrkkor42";
const FIXED_ORDER_NUMBER = "202605000";

async function main() {
  const row = await prisma.serviceOrder.findFirst({
    where: { orderNumber: BAD_ORDER_NUMBER },
  });

  if (!row) {
    console.log(
      "Eşleşen kayıt yok (orderNumber zaten düzeltilmiş veya farklı olabilir).",
    );
    return;
  }

  const clash = await prisma.serviceOrder.findFirst({
    where: {
      orderNumber: FIXED_ORDER_NUMBER,
      NOT: { id: row.id },
    },
  });
  if (clash) {
    console.error(
      "Hedef orderNumber başka kayıtta kullanılıyor, işlem iptal:",
      clash.id,
    );
    process.exit(1);
  }

  await prisma.serviceOrder.update({
    where: { id: row.id },
    data: { orderNumber: FIXED_ORDER_NUMBER },
  });

  console.log("Güncellendi:", row.id, BAD_ORDER_NUMBER, "→", FIXED_ORDER_NUMBER);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
