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

    const mevcutTanimlar = await prisma.deviceType.findMany({
      where: { shopId: shop.id },
      select: { name: true },
    });
    const mevcutTanimAdlari = new Set(mevcutTanimlar.map((t) => t.name.toLowerCase()));

    const eklenenTanimlarIds: Record<string, string> = {};
    for (const tanim of tur.tanimlar) {
      if (mevcutTanimAdlari.has(tanim.ad.toLowerCase())) {
        const mevcut = await prisma.deviceType.findFirst({
          where: { shopId: shop.id, name: { equals: tanim.ad, mode: "insensitive" } },
        });
        if (mevcut) eklenenTanimlarIds[tanim.ad] = mevcut.id;
        continue;
      }
      const yeni = await prisma.deviceType.create({
        data: { shopId: shop.id, name: tanim.ad },
      });
      eklenenTanimlarIds[tanim.ad] = yeni.id;
    }

    const ilkTanimId = Object.values(eklenenTanimlarIds)[0];
    if (!ilkTanimId) {
      return NextResponse.json({ error: "Tanım eklenemedi" }, { status: 500 });
    }

    const mevcutMarkalar = await prisma.brand.findMany({
      where: { shopId: shop.id },
      select: { name: true, id: true },
    });
    const mevcutMarkaMap = new Map(mevcutMarkalar.map((m) => [m.name.toLowerCase(), m.id]));

    const eklenenMarkaIds: string[] = [];
    const eklenenModelIds: string[] = [];

    for (const marka of tur.markalar) {
      let markaId = mevcutMarkaMap.get(marka.ad.toLowerCase());

      if (!markaId) {
        const yeniMarka = await prisma.brand.create({
          data: { shopId: shop.id, name: marka.ad, deviceTypeId: ilkTanimId },
        });
        markaId = yeniMarka.id;
        eklenenMarkaIds.push(yeniMarka.id);
      }

      const mevcutModeller = await prisma.deviceModel.findMany({
        where: { brandId: markaId },
        select: { name: true },
      });
      const mevcutModelAdlari = new Set(mevcutModeller.map((m) => m.name.toLowerCase()));

      for (const model of marka.modeller) {
        if (mevcutModelAdlari.has(model.ad.toLowerCase())) continue;
        const yeniModel = await prisma.deviceModel.create({
          data: { shopId: shop.id, brandId: markaId, name: model.ad },
        });
        eklenenModelIds.push(yeniModel.id);
        mevcutModelAdlari.add(model.ad.toLowerCase());
      }
    }

    const yuklemeId = `hizli_kurulum_${Date.now()}`;
    const yuklemeData = {
      turId,
      tanimIds: Object.values(eklenenTanimlarIds),
      markaIds: eklenenMarkaIds,
      modelIds: eklenenModelIds,
    };
    await prisma.setting.create({
      data: {
        shopId: shop.id,
        key: yuklemeId,
        value: JSON.stringify(yuklemeData),
      },
    });

    return NextResponse.json({
      success: true,
      yuklemeId,
      eklenenTanim: Object.keys(eklenenTanimlarIds).length,
      eklenenMarka: eklenenMarkaIds.length,
      eklenenModel: eklenenModelIds.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
