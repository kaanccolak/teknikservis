import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

const DEFAULTS: Record<string, string> = {
  servis_fisi_boyut: "A4",
  servis_fisi_yon: "portrait",
  servis_fisi_kenar: "normal",
  kargo_fisi_boyut: "A6",
  kargo_fisi_yon: "portrait",
  kargo_fisi_kenar: "dar",
};

export async function GET() {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("GET /api/settings (shop)", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const rows = await prisma.setting.findMany({
      where: { shopId: shop.id },
      select: { key: true, value: true },
    });
    const settings = { ...DEFAULTS } as Record<string, string>;
    for (const row of rows) settings[row.key] = row.value;
    return NextResponse.json(settings);
  } catch (e) {
    return jsonServerError("GET /api/settings", e, "Ayarlar alınamadı");
  }
}

export async function PATCH(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("PATCH /api/settings (shop)", e, "Dükkan bilgisi alınamadı");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const entries = Object.entries(json as Record<string, unknown>).filter(
    ([, v]) => typeof v === "string",
  ) as [string, string][];
  if (entries.length === 0) {
    return NextResponse.json({ error: "Güncellenecek ayar yok" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { shopId_key: { shopId: shop.id, key } },
          update: { value },
          create: { shopId: shop.id, key, value },
        }),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError("PATCH /api/settings", e, "Ayarlar güncellenemedi");
  }
}
