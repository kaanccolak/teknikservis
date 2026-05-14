import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { KURULUM_TURLERI } from "@/lib/hizli-kurulum-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { turId } = (await req.json()) as { turId: string };
    const tur = KURULUM_TURLERI.find((t) => t.id === turId);
    if (!tur) return NextResponse.json({ error: "Tür bulunamadı" }, { status: 404 });

    // Mevcut tanımları kontrol et
    const mevcutTanimlar = await prisma.deviceType.findMany({
      where: { shopId: shop.id },
      select: { name: true },
    });
    const mevcutTanimAdlari = new Set(mevcutTanimlar.map((t) => t.name.toLowerCase()));

    // Tanımları ekle
    const eklenenTanimlar: Record<string, string> = {};
    for (const tanim of tur.tanimlar) {
      if (mevcutTanimAdlari.has(tanim.ad.toLowerCase())) {
        const mevcut = await prisma.deviceType.findFirst({
          where: { shopId: shop.id, name: { equals: tanim.ad, mode: "insensitive" } },
        });
        if (mevcut) eklenenTanimlar[tanim.ad] = mevcut.id;
        continue;
      }
      const yeni = await prisma.deviceType.create({
        data: { shopId: shop.id, name: tanim.ad },
      });
      eklenenTanimlar[tanim.ad] = yeni.id;
    }

    // Her marka için ilk tanımı kullan (veya türün ilk tanımı)
    const ilkTanimId = Object.values(eklenenTanimlar)[0];
    if (!ilkTanimId) return NextResponse.json({ error: "Tanım eklenemedi" }, { status: 500 });

    // Markaları ve modelleri ekle
    const mevcutMarkalar = await prisma.brand.findMany({
      where: { shopId: shop.id },
      select: { name: true, id: true },
    });
    const mevcutMarkaMap = new Map(mevcutMarkalar.map((m) => [m.name.toLowerCase(), m.id]));

    let eklenenMarka = 0;
    let eklenenModel = 0;

    for (const marka of tur.markalar) {
      let markaId = mevcutMarkaMap.get(marka.ad.toLowerCase());

      if (!markaId) {
        const yeniMarka = await prisma.brand.create({
          data: { shopId: shop.id, name: marka.ad, deviceTypeId: ilkTanimId },
        });
        markaId = yeniMarka.id;
        eklenenMarka++;
      }

      const mevcutModeller = await prisma.deviceModel.findMany({
        where: { brandId: markaId },
        select: { name: true },
      });
      const mevcutModelAdlari = new Set(mevcutModeller.map((m) => m.name.toLowerCase()));

      for (const model of marka.modeller) {
        if (mevcutModelAdlari.has(model.ad.toLowerCase())) continue;
        await prisma.deviceModel.create({
          data: { shopId: shop.id, brandId: markaId, name: model.ad },
        });
        eklenenModel++;
      }
    }

    return NextResponse.json({
      success: true,
      eklenenTanim: Object.keys(eklenenTanimlar).length,
      eklenenMarka,
      eklenenModel,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
