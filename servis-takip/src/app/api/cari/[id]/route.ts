import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const json =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
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
        name: String(json.name ?? "").trim(),
        phone:
          typeof json.phone === "string" ? json.phone.trim() || null : null,
        phoneDigits: normalizeDigits(
          typeof json.phone === "string" ? json.phone : undefined,
        ),
        email:
          typeof json.email === "string" ? json.email.trim() || null : null,
        address:
          typeof json.address === "string" ? json.address.trim() || null : null,
        taxOrTcNo:
          typeof json.taxOrTcNo === "string"
            ? json.taxOrTcNo.trim() || null
            : null,
        taxOffice:
          typeof json.taxOffice === "string"
            ? json.taxOffice.trim() || null
            : null,
        cargoInfo:
          typeof json.cargoInfo === "string"
            ? json.cargoInfo.trim() || null
            : null,
        cargoCode:
          typeof json.cargoCode === "string"
            ? json.cargoCode.trim() || null
            : null,
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
