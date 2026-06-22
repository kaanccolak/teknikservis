import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

function kelimeCikar(metin: string): string[] {
  return metin
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, " ")
    .split(/\s+/)
    .filter((k) => k.length > 2);
}

function benzerlikSkoru(aranan: string[], kayit: string[]): number {
  if (!aranan.length || !kayit.length) return 0;
  const eslesen = aranan.filter((k) =>
    kayit.some((r) => r.includes(k) || k.includes(r)),
  );
  return eslesen.length / aranan.length;
}

export async function POST(req: Request) {
  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { cihaz, sikayet } = (await req.json()) as {
      cihaz: string;
      sikayet: string;
    };

    if (!cihaz && !sikayet) {
      return NextResponse.json(
        { error: "Cihaz veya şikayet bilgisi gerekli" },
        { status: 400 },
      );
    }

    const gecmisKayitlar = await prisma.serviceOrder.findMany({
      where: {
        shopId: shop.id,
        totalPrice: { gt: 0 },
        deletedAt: null,
        status: {
          in: [
            "delivered",
            "delivered_repair_failed",
            "delivered_no_problem",
            "delivered_customer_return",
            "completed",
          ],
        },
      },
      select: {
        totalPrice: true,
        complaint: true,
        repairDetails: true,
        deviceTypeName: true,
        brandName: true,
        modelName: true,
        deviceType: { select: { name: true } },
        brand: { select: { name: true } },
        deviceModel: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const cihazKelimeler = kelimeCikar(cihaz);
    const sikayetKelimeler = kelimeCikar(sikayet);

    const skorluKayitlar = gecmisKayitlar.map((k) => {
      const kCihaz = [
        k.deviceType?.name ?? k.deviceTypeName ?? "",
        k.brand?.name ?? k.brandName ?? "",
        k.deviceModel?.name ?? k.modelName ?? "",
      ].join(" ");

      const kSikayet = [k.complaint ?? "", k.repairDetails ?? ""].join(" ");

      const cihazSkoru = benzerlikSkoru(cihazKelimeler, kelimeCikar(kCihaz));
      const sikayetSkoru = benzerlikSkoru(sikayetKelimeler, kelimeCikar(kSikayet));

      const toplamSkor = cihazSkoru * 0.6 + sikayetSkoru * 0.4;

      return { ...k, toplamSkor, cihazSkoru, sikayetSkoru };
    });

    const eslesmisKayitlar = skorluKayitlar
      .filter((k) => k.cihazSkoru > 0)
      .sort((a, b) => b.toplamSkor - a.toplamSkor)
      .slice(0, 20);

    const yuksekBenzerlik = eslesmisKayitlar.filter((k) => k.sikayetSkoru > 0.3);
    const kullanilacakKayitlar =
      yuksekBenzerlik.length >= 2 ? yuksekBenzerlik : eslesmisKayitlar;

    const fiyatlar = kullanilacakKayitlar
      .map((k) => Number(k.totalPrice))
      .filter((f) => f > 0);

    if (fiyatlar.length === 0) {
      return NextResponse.json({
        text: "Bu cihaz türü için henüz yeterli geçmiş kayıt bulunmuyor. Daha fazla kayıt girdikçe fiyat tahmini daha isabetli olacak.",
        minFiyat: null,
        maxFiyat: null,
        ortFiyat: null,
        gecmisKayitSayisi: 0,
        benzerlikTuru: null,
      });
    }

    const min = Math.min(...fiyatlar);
    const max = Math.max(...fiyatlar);
    const ort = Math.round(fiyatlar.reduce((a, b) => a + b, 0) / fiyatlar.length);
    const benzerlikTuru = yuksekBenzerlik.length >= 2 ? "arıza" : "cihaz";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key bulunamadı" }, { status: 500 });
    }

    const ornekler = kullanilacakKayitlar
      .slice(0, 5)
      .map((k) => {
        const ad = [
          k.deviceType?.name ?? k.deviceTypeName,
          k.brand?.name ?? k.brandName,
          k.deviceModel?.name ?? k.modelName,
        ]
          .filter(Boolean)
          .join(" ");
        return `- ${ad}: ${k.complaint ?? ""} / Onarım: ${k.repairDetails ?? "-"} → ${Number(k.totalPrice)}₺`;
      })
      .join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Sen teknik servis fiyat analizisti. Sana geçmiş kayıtlar verilecek. Kısa bir değerlendirme yaz. Türkçe, max 40 kelime, sadece açıklama yaz.",
          },
          {
            role: "user",
            content: `Cihaz: ${cihaz}\nŞikayet: ${sikayet}\n\nBenzer geçmiş kayıtlar:\n${ornekler}\n\nFiyat aralığı: ${min}₺ - ${max}₺, ortalama: ${ort}₺\n\nBu verilere dayanarak kısa bir değerlendirme yap.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    const data = (await response.json()) as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message ?? "Öneri yapılamadı" },
        { status: 500 },
      );
    }

    const aciklama = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      text: aciklama,
      minFiyat: min,
      maxFiyat: max,
      ortFiyat: ort,
      gecmisKayitSayisi: fiyatlar.length,
      benzerlikTuru,
    });
  } catch (error) {
    console.error("AI fiyat önerisi error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
