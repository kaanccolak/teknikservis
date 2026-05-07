import { NextResponse } from "next/server";

import { invalidateCache, invalidateCachePrefix } from "@/lib/cache";
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
    const existing = await prisma.deviceType.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const brandCount = await prisma.brand.count({
      where: { deviceTypeId: id, shopId: shop.id },
    });
    if (brandCount > 0) {
      return NextResponse.json(
        {
          error:
            "Bu cihaz türüne bağlı markalar var. Önce markaları silin.",
        },
        { status: 400 },
      );
    }

    await prisma.deviceType.delete({ where: { id } });
    invalidateCache("device-types");
    invalidateCache(`brands-${id}`);
    invalidateCache("brands-all");
    invalidateCachePrefix("models-");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/device-types/[id]",
      e,
      "Silinemedi",
      500,
    );
  }
}
