import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { yuklemeId } = (await req.json()) as { yuklemeId: string };

    const setting = await prisma.setting.findUnique({
      where: { shopId_key: { shopId: shop.id, key: yuklemeId } },
    });
    if (!setting) {
      return NextResponse.json({ error: "Yükleme bulunamadı" }, { status: 404 });
    }

    const yuklemeData = JSON.parse(setting.value) as {
      tanimIds: string[];
      markaIds: string[];
      modelIds: string[];
    };

    let silinenModel = 0;
    let silinenMarka = 0;
    let silinenTanim = 0;
    let atlananKayit = 0;

    for (const modelId of yuklemeData.modelIds) {
      const kullanilanMi = await prisma.serviceOrder.findFirst({
        where: { deviceModelId: modelId },
      });
      if (kullanilanMi) {
        atlananKayit++;
        continue;
      }
      await prisma.deviceModel.delete({ where: { id: modelId } }).catch(() => null);
      silinenModel++;
    }

    for (const markaId of yuklemeData.markaIds) {
      const kullanilanMi = await prisma.serviceOrder.findFirst({
        where: { brandId: markaId },
      });
      if (kullanilanMi) {
        atlananKayit++;
        continue;
      }
      const kalanModel = await prisma.deviceModel.count({ where: { brandId: markaId } });
      if (kalanModel > 0) {
        atlananKayit++;
        continue;
      }
      await prisma.brand.delete({ where: { id: markaId } }).catch(() => null);
      silinenMarka++;
    }

    for (const tanimId of yuklemeData.tanimIds) {
      const kullanilanMi = await prisma.serviceOrder.findFirst({
        where: { deviceTypeId: tanimId },
      });
      if (kullanilanMi) {
        atlananKayit++;
        continue;
      }
      const kalanMarka = await prisma.brand.count({ where: { deviceTypeId: tanimId } });
      if (kalanMarka > 0) {
        atlananKayit++;
        continue;
      }
      await prisma.deviceType.delete({ where: { id: tanimId } }).catch(() => null);
      silinenTanim++;
    }

    await prisma.setting.delete({
      where: { shopId_key: { shopId: shop.id, key: yuklemeId } },
    });

    return NextResponse.json({ silinenTanim, silinenMarka, silinenModel, atlananKayit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
