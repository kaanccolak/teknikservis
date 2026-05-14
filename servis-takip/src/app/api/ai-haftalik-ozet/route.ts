import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_DELIVERED_STATUSES } from "@/lib/service-order-status";

export const dynamic = "force-dynamic";

function haftaBaslangici(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function gecenHaftaBounds(): { start: Date; end: Date } {
  const buHaftaBaslangic = haftaBaslangici();
  const end = new Date(buHaftaBaslangic);
  end.setMilliseconds(-1);
  const start = new Date(buHaftaBaslangic);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

export async function POST(_req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { start, end } = gecenHaftaBounds();

    // Geçen hafta oluşturulan kayıtlar
    const yeniKayitlar = await prisma.serviceOrder.count({
      where: { shopId: shop.id, deletedAt: null, createdAt: { gte: start, lte: end } },
    });

    // Geçen hafta teslim edilenler
    const teslimEdilenler = await prisma.serviceOrder.findMany({
      where: {
        shopId: shop.id,
        deletedAt: null,
        status: { in: [...SERVICE_ORDER_DELIVERED_STATUSES] },
        updatedAt: { gte: start, lte: end },
      },
      select: {
        totalPrice: true,
        deviceTypeName: true,
        brandName: true,
        modelName: true,
        deviceType: { select: { name: true } },
        brand: { select: { name: true } },
        deviceModel: { select: { name: true } },
        arrivedAt: true,
        updatedAt: true,
      },
    });

    // Ciro
    const ciro = teslimEdilenler.reduce((sum, o) => sum + Number(o.totalPrice ?? 0), 0);

    // En çok gelen cihaz türleri
    const cihazSayac: Record<string, number> = {};
    teslimEdilenler.forEach((o) => {
      const tip = o.deviceType?.name ?? o.deviceTypeName ?? "Diğer";
      cihazSayac[tip] = (cihazSayac[tip] ?? 0) + 1;
    });
    const enCokCihazlar = Object.entries(cihazSayac)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ad, sayi]) => `${ad} (${sayi} adet)`);

    // Ortalama tamir süresi (gün)
    const sureler = teslimEdilenler
      .map((o) => {
        const gelis = new Date(o.arrivedAt).getTime();
        const teslim = new Date(o.updatedAt).getTime();
        return (teslim - gelis) / (1000 * 60 * 60 * 24);
      })
      .filter((s) => s >= 0 && s < 365);
    const ortSure =
      sureler.length > 0
        ? (sureler.reduce((a, b) => a + b, 0) / sureler.length).toFixed(1)
        : null;

    // Hala bekleyen kayıtlar
    const bekleyenler = await prisma.serviceOrder.count({
      where: {
        shopId: shop.id,
        deletedAt: null,
        status: { notIn: [...SERVICE_ORDER_DELIVERED_STATUSES, "completed"] },
        createdAt: { lt: start },
      },
    });

    // En karlı iş
    const enKarliKayit = teslimEdilenler.reduce(
      (max, o) => (Number(o.totalPrice ?? 0) > Number(max?.totalPrice ?? 0) ? o : max),
      teslimEdilenler[0],
    );
    const enKarliCihaz = enKarliKayit
      ? [
          enKarliKayit.deviceType?.name ?? enKarliKayit.deviceTypeName,
          enKarliKayit.brand?.name ?? enKarliKayit.brandName,
          enKarliKayit.deviceModel?.name ?? enKarliKayit.modelName,
        ]
          .filter(Boolean)
          .join(" ") || "Belirtilmemiş"
      : null;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key bulunamadı" }, { status: 500 });

    const veri = {
      hafta: `${start.toLocaleDateString("tr-TR")} - ${end.toLocaleDateString("tr-TR")}`,
      yeniKayit: yeniKayitlar,
      teslimEdilen: teslimEdilenler.length,
      ciro: ciro.toLocaleString("tr-TR") + "₺",
      enCokCihazlar: enCokCihazlar.join(", ") || "Veri yok",
      ortTamirSuresi: ortSure ? `${ortSure} gün` : "Veri yok",
      bekleyenEskiKayit: bekleyenler,
      enKarliIs:
        enKarliCihaz && enKarliKayit
          ? `${enKarliCihaz} - ${Number(enKarliKayit.totalPrice).toLocaleString("tr-TR")}₺`
          : "Veri yok",
    };

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
            content: `Sen bir teknik servis danışmanısın. Verilen haftalık performans verilerini analiz edip samimi, kısa ve motive edici bir özet yaz. Türkçe yaz. Maksimum 80 kelime. Rakamları tekrar etme, yorum yap ve öneri ver.`,
          },
          {
            role: "user",
            content: `Geçen hafta (${veri.hafta}) verileri:\n- Yeni kayıt: ${veri.yeniKayit}\n- Teslim edilen: ${veri.teslimEdilen}\n- Ciro: ${veri.ciro}\n- En çok gelen cihazlar: ${veri.enCokCihazlar}\n- Ortalama tamir süresi: ${veri.ortTamirSuresi}\n- Önceki haftadan kalan bekleyen kayıt: ${veri.bekleyenEskiKayit}\n- En karlı iş: ${veri.enKarliIs}\n\nBu verileri değerlendir.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 150,
      }),
    });

    const data = (await response.json()) as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    const aiYorum = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ ...veri, aiYorum });
  } catch (error) {
    console.error("Haftalık özet error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
