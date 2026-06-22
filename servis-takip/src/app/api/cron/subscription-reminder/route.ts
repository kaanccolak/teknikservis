import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Cron secret kontrolü
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const simdi = new Date();
  const ucGunSonra = new Date();
  ucGunSonra.setDate(ucGunSonra.getDate() + 3);

  // 3 gün içinde süresi dolacak, active veya trial, isExempt olmayan dükkanları bul
  const dukkanlar = await prisma.shop.findMany({
    where: {
      isExempt: false,
      subscriptionStatus: { in: ["trial", "active"] },
      trialEndsAt: {
        gte: simdi,
        lte: ucGunSonra,
      },
      email: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      trialEndsAt: true,
      subscriptionStatus: true,
    },
  });

  let gonderilen = 0;

  for (const dukkan of dukkanlar) {
    if (!dukkan.email || !dukkan.trialEndsAt) continue;

    const kalan = Math.ceil(
      (new Date(dukkan.trialEndsAt).getTime() - simdi.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const htmlBody = `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 22px; font-weight: 800; color: #4f46e5;">Tamir</span><span style="font-size: 22px; font-weight: 800; color: #111827;">Takip</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px;">
          ${dukkan.subscriptionStatus === "active" ? "Aboneliğiniz yakında yenileniyor" : "Deneme süreniz dolmak üzere"}
        </h2>
        <p style="font-size: 15px; color: #374151; margin-bottom: 8px;">
          Merhaba <strong>${dukkan.name}</strong>,
        </p>
        <p style="font-size: 15px; color: #374151; margin-bottom: 24px;">
          ${dukkan.subscriptionStatus === "active"
            ? `Aboneliğiniz <strong>${kalan} gün</strong> içinde sona erecek. Kesintisiz kullanım için lütfen yenileyin.`
            : `Ücretsiz deneme süreniz <strong>${kalan} gün</strong> içinde sona erecek. Kullanmaya devam etmek için bir plan seçin.`
          }
        </p>
        <a href="https://www.tamirtakip.com.tr/paket-sec" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
          ${dukkan.subscriptionStatus === "active" ? "Aboneliği Yenile" : "Plan Seç"}
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          Sorularınız için <a href="mailto:destek@tamirtakip.com.tr" style="color: #4f46e5;">destek@tamirtakip.com.tr</a> adresine yazabilirsiniz.
        </p>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TamirTakip <noreply@tamirtakip.com.tr>",
        to: dukkan.email,
        subject: `⚠️ ${kalan === 1 ? "Yarın" : `${kalan} gün içinde`} ${dukkan.subscriptionStatus === "active" ? "aboneliğiniz sona eriyor" : "deneme süreniz doluyor"}`,
        html: htmlBody,
      }),
    });

    gonderilen++;

    // Rate limit için kısa bekleme
    await new Promise((r) => setTimeout(r, 500));
  }

  return NextResponse.json({ ok: true, gonderilen, toplam: dukkanlar.length });
}
