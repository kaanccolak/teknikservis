/**
 * Tek seferlik: tüm Shop kayıtlarındaki WPPConnect/Baileys bağlantı alanlarını sıfırlar.
 *
 * Çalıştır (proje kökünden):
 *   npx tsx src/scripts/clear-wpp-session.ts
 */
import { prisma } from "../lib/prisma";

async function clearWppSessions() {
  const result = await prisma.shop.updateMany({
    data: {
      wppConnected: false,
      wppPhone: null,
      wppSession: null,
    },
  });
  console.log(`WPP session temizlendi! (${result.count} shop güncellendi)`);
}

clearWppSessions()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
