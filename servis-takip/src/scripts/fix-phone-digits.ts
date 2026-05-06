/**
 * Tek seferlik: Customer.phone alanından Customer.phoneDigits alanını doldurur.
 *
 * Çalıştır (proje kökünden):
 *   npx tsx src/scripts/fix-phone-digits.ts
 *
 * ts-node ile:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/fix-phone-digits.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      phone: true,
      phoneDigits: true,
    },
  });

  let updated = 0;

  for (const customer of customers) {
    const nextDigits = normalizePhone(customer.phone);
    if ((customer.phoneDigits ?? null) === nextDigits) continue;

    await prisma.customer.update({
      where: { id: customer.id },
      data: { phoneDigits: nextDigits },
    });
    updated += 1;
  }

  console.log(`Toplam ${customers.length} müşteri kontrol edildi.`);
  console.log(`phoneDigits güncellenen müşteri sayısı: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
