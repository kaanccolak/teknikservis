import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

const usageInclude = {
  sparePart: {
    include: {
      deviceType: true,
      brand: true,
      deviceModel: true,
    },
  },
} as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders/[id]/spare-parts (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, shopId: shop.id, deletedAt: null },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  try {
    const rows = await prisma.sparePartUsage.findMany({
      where: { serviceOrderId: orderId, shopId: shop.id },
      include: usageInclude,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders/[id]/spare-parts",
      e,
      "Parça kullanımları yüklenemedi",
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id: orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const o = json as { sparePartId?: unknown; quantity?: unknown };
  const sparePartId = typeof o.sparePartId === "string" ? o.sparePartId.trim() : "";
  const quantity =
    typeof o.quantity === "number" ? o.quantity : Number(o.quantity ?? 1);

  if (!sparePartId) {
    return NextResponse.json({ error: "Parça seçin" }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Geçerli adet girin" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/service-orders/[id]/spare-parts (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, shopId: shop.id, deletedAt: null },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const part = await tx.sparePart.findFirst({
        where: { id: sparePartId, shopId: shop.id },
      });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }
      if (part.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      const usage = await tx.sparePartUsage.create({
        data: {
          shopId: shop.id,
          sparePartId,
          serviceOrderId: orderId,
          quantity,
          costAtTime: part.cost,
        },
        include: usageInclude,
      });
      await tx.sparePart.update({
        where: { id: sparePartId },
        data: { stock: { decrement: quantity } },
      });
      return usage;
    });
    return NextResponse.json(created);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "PART_NOT_FOUND") {
        return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
      }
      if (e.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json({ error: "Yetersiz stok" }, { status: 400 });
      }
    }
    const d = getErrorDetails(e);
    console.error("[POST /api/service-orders/[id]/spare-parts]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Parça eklenemedi", details: d.message },
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

  const { id: orderId } = await context.params;
  const usageId = new URL(request.url).searchParams.get("usageId")?.trim() ?? "";

  if (!orderId?.trim() || !usageId) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/service-orders/[id]/spare-parts (shop)",
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

  try {
    await prisma.$transaction(async (tx) => {
      const usage = await tx.sparePartUsage.findFirst({
        where: {
          id: usageId,
          serviceOrderId: orderId,
          shopId: shop.id,
        },
      });
      if (!usage) {
        throw new Error("NOT_FOUND");
      }
      await tx.sparePart.update({
        where: { id: usage.sparePartId, shopId: shop.id },
        data: { stock: { increment: usage.quantity } },
      });
      await tx.sparePartUsage.delete({ where: { id: usageId } });
    });
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Kullanım bulunamadı" }, { status: 404 });
    }
    const d = getErrorDetails(e);
    console.error("[DELETE /api/service-orders/[id]/spare-parts]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Kullanım kaldırılamadı", details: d.message },
      { status: 500 },
    );
  }
}
