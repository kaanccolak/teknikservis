import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Tüm şablonları getir
export async function GET() {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const templates = await prisma.waTemplate.findMany({
    where: { shopId: shop.id },
  });

  return NextResponse.json(templates);
}

// Şablon kaydet/güncelle
export async function POST(req: Request) {
  const shop = await getShop();
  if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { templateName, message } = await req.json();

  if (!templateName || !message?.trim()) {
    return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
  }

  const template = await prisma.waTemplate.upsert({
    where: {
      shopId_templateName: {
        shopId: shop.id,
        templateName,
      },
    },
    update: { message: message.trim() },
    create: {
      shopId: shop.id,
      templateName,
      message: message.trim(),
    },
  });

  return NextResponse.json(template);
}
