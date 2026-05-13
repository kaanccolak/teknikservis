import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

const sparePartInclude = {
  deviceType: true,
  brand: true,
  deviceModel: true,
} as const;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz parça" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const o = json as Record<string, unknown>;
  const data: {
    name?: string;
    partCode?: string | null;
    cost?: number;
    stock?: number;
    deviceTypeId?: string | null;
    brandId?: string | null;
    deviceModelId?: string | null;
  } = {};

  if (typeof o.name === "string") {
    const n = o.name.trim();
    if (!n) return NextResponse.json({ error: "Parça adı boş olamaz" }, { status: 400 });
    data.name = n;
  }
  if ("partCode" in o) {
    data.partCode =
      o.partCode === null
        ? null
        : typeof o.partCode === "string"
          ? emptyToNull(o.partCode)
          : undefined;
  }
  if ("cost" in o) {
    const c = typeof o.cost === "number" ? o.cost : Number(o.cost);
    if (!Number.isFinite(c) || c < 0) {
      return NextResponse.json({ error: "Geçerli maliyet girin" }, { status: 400 });
    }
    data.cost = c;
  }
  if ("stock" in o) {
    const s = typeof o.stock === "number" ? o.stock : Number(o.stock);
    if (!Number.isInteger(s) || s < 0) {
      return NextResponse.json({ error: "Geçerli stok girin" }, { status: 400 });
    }
    data.stock = s;
  }
  if ("deviceTypeId" in o) {
    data.deviceTypeId =
      typeof o.deviceTypeId === "string" && o.deviceTypeId.trim()
        ? o.deviceTypeId.trim()
        : null;
  }
  if ("brandId" in o) {
    data.brandId =
      typeof o.brandId === "string" && o.brandId.trim() ? o.brandId.trim() : null;
  }
  if ("deviceModelId" in o) {
    data.deviceModelId =
      typeof o.deviceModelId === "string" && o.deviceModelId.trim()
        ? o.deviceModelId.trim()
        : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/spare-parts/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const existing = await prisma.sparePart.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
  }

  const nextDt = data.deviceTypeId !== undefined ? data.deviceTypeId : existing.deviceTypeId;
  const nextBr = data.brandId !== undefined ? data.brandId : existing.brandId;
  const nextMd =
    data.deviceModelId !== undefined ? data.deviceModelId : existing.deviceModelId;

  if (nextBr && !nextDt) {
    return NextResponse.json(
      { error: "Marka için cihaz türü gerekli" },
      { status: 400 },
    );
  }
  if (nextMd && (!nextDt || !nextBr)) {
    return NextResponse.json(
      { error: "Model için cihaz türü ve marka gerekli" },
      { status: 400 },
    );
  }

  if (nextDt || nextBr || nextMd) {
    if (nextDt) {
      const dt = await prisma.deviceType.findFirst({
        where: { id: nextDt, shopId: shop.id },
      });
      if (!dt) return NextResponse.json({ error: "Cihaz türü bulunamadı" }, { status: 400 });
    }
    if (nextBr) {
      const br = await prisma.brand.findFirst({
        where: { id: nextBr, shopId: shop.id, deviceTypeId: nextDt! },
      });
      if (!br) return NextResponse.json({ error: "Marka bulunamadı" }, { status: 400 });
    }
    if (nextMd) {
      const md = await prisma.deviceModel.findFirst({
        where: { id: nextMd, shopId: shop.id, brandId: nextBr! },
      });
      if (!md) return NextResponse.json({ error: "Model bulunamadı" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.sparePart.update({
      where: { id },
      data,
      include: sparePartInclude,
    });
    return NextResponse.json(updated);
  } catch (e) {
    const d = getErrorDetails(e);
    console.error("[PATCH /api/spare-parts/[id]]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Güncelleme başarısız", details: d.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz parça" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/spare-parts/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  // Parola doğrulama
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

  const existing = await prisma.sparePart.findFirst({
    where: { id, shopId: shop.id },
    include: { _count: { select: { usages: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
  }
  if (existing._count.usages > 0) {
    return NextResponse.json(
      { error: "Bu parça servis kayıtlarında kullanılıyor; silinemez" },
      { status: 400 },
    );
  }

  try {
    await prisma.sparePart.delete({ where: { id } });
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    const d = getErrorDetails(e);
    console.error("[DELETE /api/spare-parts/[id]]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Parça silinemedi", details: d.message },
      { status: 500 },
    );
  }
}
