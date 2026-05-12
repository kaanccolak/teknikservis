import { NextResponse } from "next/server";

import { getSessionStatus, sendBaileysMessage } from "@/lib/baileys-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const fifteenDaysAgoFromReminder = new Date();
  fifteenDaysAgoFromReminder.setDate(fifteenDaysAgoFromReminder.getDate() - 15);

  const waitingOrders = await prisma.serviceOrder.findMany({
    where: {
      deletedAt: null,
      status: {
        in: ["customer_return", "repair_failed", "completed", "no_problem_found"],
      },
      updatedAt: { lte: fifteenDaysAgo },
      OR: [
        { reminderSentAt: null }, // Hiç gönderilmemiş
        { reminderSentAt: { lte: fifteenDaysAgoFromReminder } }, // Son göndermeden 15 gün geçmiş
      ],
    },
    take: 10,
    include: {
      customer: true,
      deviceModel: true,
      brand: true,
      deviceType: true,
      shop: true,
    },
  });

  const results = { total: waitingOrders.length, sent: 0, failed: 0, skipped: 0 };

  for (const order of waitingOrders) {
    try {
      const status = await getSessionStatus(order.shopId);
      if (!status.connected) {
        results.skipped++;
        continue;
      }

      const customerPhone = order.customer?.phone;
      if (!customerPhone) {
        results.skipped++;
        continue;
      }

      const customerName = order.customer?.name ?? "Müşterimiz";
      const serialNo = order.serialNo ?? "Belirtilmemiş";
      const deviceName =
        order.deviceModel?.name ??
        order.brand?.name ??
        order.deviceType?.name ??
        "cihazınız";

      const message = `Sayın ${customerName}, ${serialNo} seri numaralı ${deviceName} cihazınız servisimizde teslim alınmayı beklemektedir. En kısa sürede teslim almanızı rica ederiz. Bilgi için bize ulaşabilirsiniz.`;

      const cleanPhone = customerPhone.replace(/\D/g, "");
      const phone = cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone}`;

      const result = await sendBaileysMessage(order.shopId, phone, message);

      if (result.success) {
        await prisma.serviceOrder.update({
          where: { id: order.id },
          data: { reminderSentAt: new Date() },
        });
        results.sent++;
        await new Promise((r) => setTimeout(r, 5000)); // 5 saniye bekle
      } else {
        results.failed++;
      }
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `${results.sent} hatırlatma gönderildi`,
    results,
  });
}
