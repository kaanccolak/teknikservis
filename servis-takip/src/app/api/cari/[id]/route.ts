import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

function normalizeDigits(value: string | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("GET /api/cari/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const cari = await prisma.cari.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!cari) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    return NextResponse.json({ cari, shop });
  } catch (e) {
    return jsonServerError("GET /api/cari/[id]", e, "Cari alınamadı");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let json: any;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("PATCH /api/cari/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const row = await prisma.cari.updateMany({
      where: { id, shopId: shop.id },
      data: {
        name: String(json?.name ?? "").trim(),
        phone: json.phone?.trim() || null,
        phoneDigits: normalizeDigits(json.phone),
        email: json.email?.trim() || null,
        address: json.address?.trim() || null,
        taxOrTcNo: json.taxOrTcNo?.trim() || null,
        taxOffice: json.taxOffice?.trim() || null,
        cargoInfo: json.cargoInfo?.trim() || null,
        cargoCode: json.cargoCode?.trim() || null,
      },
    });
    if (row.count === 0) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    const updated = await prisma.cari.findFirst({ where: { id, shopId: shop.id } });
    return NextResponse.json(updated);
  } catch (e) {
    return jsonServerError("PATCH /api/cari/[id]", e, "Cari güncellenemedi");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("DELETE /api/cari/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const row = await prisma.cari.findFirst({ where: { id, shopId: shop.id } });
    if (!row) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    const linkedCount = await prisma.serviceOrder.count({ where: { shopId: shop.id, cariId: id } });
    if (linkedCount > 0 && !force) {
      return NextResponse.json(
        { error: "Bu cariye bağlı servis kayıtları var", linkedCount },
        { status: 400 },
      );
    }
    if (linkedCount > 0) {
      await prisma.serviceOrder.updateMany({
        where: { shopId: shop.id, cariId: id },
        data: { cariId: null },
      });
    }
    await prisma.cari.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError("DELETE /api/cari/[id]", e, "Cari silinemedi");
  }
}
