import { NextResponse } from "next/server";

import { invalidateCache } from "@/lib/cache";
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
