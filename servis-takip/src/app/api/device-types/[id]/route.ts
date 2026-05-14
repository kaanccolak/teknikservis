import { NextResponse } from "next/server";

import { invalidateCache, invalidateCachePrefix } from "@/lib/cache";
import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
  }
  const name =
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : "";
  if (!name) {
    return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });
  }

  try {
    const shop = await getOrCreateDefaultShop();
    const existing = await prisma.deviceType.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    const updated = await prisma.deviceType.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
    invalidateCache(`device-types-${shop.id}`);
    invalidateCache("device-types");
    invalidateCache(`brands-all-${shop.id}`);
    return NextResponse.json(updated);
  } catch (e) {
    return jsonServerError(
      "PATCH /api/device-types/[id]",
      e,
      "Güncellenemedi",
      500,
    );
  }
}

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
    const { settingsPassword, force } = body as {
      settingsPassword?: string;
      force?: boolean;
    };
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

    if (!force) {
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
    }

    // Cascade: önce modelleri, sonra markaları, sonra türü sil
    const markalar = await prisma.brand.findMany({
      where: { deviceTypeId: id, shopId: shop.id },
      select: { id: true },
    });
    for (const marka of markalar) {
      await prisma.deviceModel.deleteMany({ where: { brandId: marka.id } });
      await prisma.brand.delete({ where: { id: marka.id } });
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
