import { NextResponse } from "next/server";

import { invalidateCache, invalidateCachePrefix } from "@/lib/cache";
import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  try {
    const shop = await getOrCreateDefaultShop();

    // Parola kontrolü
    const body = await request.json().catch(() => ({}));
    const { settingsPassword } = body as { settingsPassword?: string };
    const { verifySettingsPassword } = await import(
      "@/lib/verify-settings-password"
    );
    const valid = await verifySettingsPassword(
      shop.id,
      settingsPassword ?? "",
    );
    if (!valid) {
      return NextResponse.json({ error: "Parola yanlış" }, { status: 403 });
    }

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
