import { NextResponse } from "next/server";

import { invalidateCache } from "@/lib/cache";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  try {
    const shop = await getOrCreateDefaultShop();
    const existing = await prisma.brand.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const modelCount = await prisma.deviceModel.count({
      where: { brandId: id, shopId: shop.id },
    });
    if (modelCount > 0) {
      return NextResponse.json(
        {
          error: "Bu markaya bağlı modeller var. Önce modelleri silin.",
        },
        { status: 400 },
      );
    }

    await prisma.brand.delete({ where: { id } });
    invalidateCache(`brands-${existing.deviceTypeId}`);
    invalidateCache("brands-all");
    invalidateCache(`models-${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError("DELETE /api/brands/[id]", e, "Silinemedi", 500);
  }
}
