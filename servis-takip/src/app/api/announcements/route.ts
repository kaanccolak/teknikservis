import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reads: {
          where: { shopId: shop.id },
          select: { id: true },
        },
      },
    });

    return NextResponse.json(
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        isRead: a.reads.length > 0,
      })),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
