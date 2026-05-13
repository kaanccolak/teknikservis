import { NextResponse } from "next/server";

import { getCache, invalidateCache, setCache } from "@/lib/cache";
import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const brandId = new URL(request.url).searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json({ error: "brandId gerekli" }, { status: 400 });
  }
  try {
    const shop = await getOrCreateDefaultShop();
    const cacheKey = `models-${shop.id}-${brandId}`;
    const cached = getCache<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, shopId: shop.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Marka bulunamadı" }, { status: 404 });
    }
    const items = await prisma.deviceModel.findMany({
      where: { shopId: shop.id, brandId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, brandId: true },
    });
    setCache(cacheKey, items);
    return NextResponse.json(items);
  } catch (e) {
    return jsonServerError("GET /api/models", e, "Modeller yüklenemedi");
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch (parseErr) {
    console.error("[POST /api/models] JSON parse", parseErr);
    return NextResponse.json(
      { error: "Geçersiz gövde", details: "JSON okunamadı" },
      { status: 400 },
    );
  }
  const o = body as { name?: unknown; brandId?: unknown };
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const brandId = typeof o.brandId === "string" ? o.brandId : "";
  if (!name || !brandId) {
    return NextResponse.json(
      { error: "İsim ve marka gerekli" },
      { status: 400 },
    );
  }
  try {
    const shop = await getOrCreateDefaultShop();
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, shopId: shop.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Marka bulunamadı" }, { status: 404 });
    }
    const created = await prisma.deviceModel.create({
      data: {
        shopId: shop.id,
        brandId,
        name,
      },
      select: { id: true, name: true, brandId: true },
    });
    invalidateCache(`models-${shop.id}-${brandId}`);
    return NextResponse.json(created);
  } catch (e) {
    return jsonServerError(
      "POST /api/models",
      e,
      "Kayıt oluşturulamadı",
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  const id = new URL(request.url).searchParams.get("id");
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

    const existing = await prisma.deviceModel.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    await prisma.deviceModel.delete({ where: { id } });
    invalidateCache(`models-${shop.id}-${existing.brandId}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/models",
      e,
      "Silinemedi. Bu modele bağlı servis kayıtları olabilir.",
      400,
    );
  }
}
