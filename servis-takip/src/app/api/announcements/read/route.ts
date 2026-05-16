import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { announcementId } = (await req.json()) as { announcementId: string };

    await prisma.announcementRead.upsert({
      where: { shopId_announcementId: { shopId: shop.id, announcementId } },
      update: {},
      create: { shopId: shop.id, announcementId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
