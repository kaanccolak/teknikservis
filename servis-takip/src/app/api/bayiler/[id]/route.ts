import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_HIDE_COMPLETED_STATUSES } from "@/lib/service-order-status";
import { jsonServerError } from "@/lib/server-error";

const BAYI_CIRO_STATUS_SET = new Set<string>(SERVICE_ORDER_HIDE_COMPLETED_STATUSES);

export const dynamic = "force-dynamic";

function normalizeDigits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function parseBayiGrup(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const s = String(value).trim();
  if (s === "grup1" || s === "grup2") return s;
  return null;
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
    return jsonServerError("GET /api/bayiler/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const bayi = await prisma.bayi.findFirst({
      where: { id, shopId: shop.id },
      include: {
        serviceOrders: {
          include: {
            deviceType: { select: { name: true } },
            brand: { select: { name: true } },
            deviceModel: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!bayi) return NextResponse.json({ error: "Bayi bulunamadı" }, { status: 404 });

    const totalOrders = bayi.serviceOrders.length;
    const totalRevenue = bayi.serviceOrders.reduce(
      (sum, o) =>
        sum +
        (BAYI_CIRO_STATUS_SET.has(o.status) ? (o.totalPrice || 0) : 0),
      0,
    );
    const repaired = bayi.serviceOrders.filter(
      (o) =>
        ["completed", "delivered", "delivered_repair_failed"].includes(o.status) &&
        o.status !== "repair_failed" &&
        o.status !== "delivered_repair_failed",
    ).length;
    const notRepaired = bayi.serviceOrders.filter((o) =>
      ["repair_failed", "delivered_repair_failed"].includes(o.status),
    ).length;

    return NextResponse.json({
      bayi,
      totalOrders,
      totalRevenue,
      repaired,
      notRepaired,
    });
  } catch (e) {
    return jsonServerError("GET /api/bayiler/[id]", e, "Bayi alınamadı");
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

  const firmaAdi = String(json.firmaAdi ?? "").trim();
  const yetkiliKisi = String(json.yetkiliKisi ?? "").trim();
  const tcVergiNo = String(json.tcVergiNo ?? "").trim();
  const phoneDigits = normalizeDigits(typeof json.phone === "string" ? json.phone : "");

  if (firmaAdi.length < 2) {
    return NextResponse.json({ error: "Firma adı zorunludur" }, { status: 400 });
  }
  if (yetkiliKisi.length < 2) {
    return NextResponse.json({ error: "Yetkili kişi zorunludur" }, { status: 400 });
  }
  if (phoneDigits.length !== 10 || !phoneDigits.startsWith("5")) {
    return NextResponse.json(
      { error: "Telefon 10 haneli ve 5 ile başlamalıdır" },
      { status: 400 },
    );
  }
  if (tcVergiNo.length < 10) {
    return NextResponse.json({ error: "TC/Vergi no zorunludur" }, { status: 400 });
  }

  const grup = parseBayiGrup(json.grup);

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("PATCH /api/bayiler/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const row = await prisma.bayi.updateMany({
      where: { id, shopId: shop.id },
      data: {
        firmaAdi,
        yetkiliKisi,
        phone: phoneDigits,
        phoneDigits,
        vergiDairesi:
          typeof json.vergiDairesi === "string"
            ? json.vergiDairesi.trim() || null
            : null,
        tcVergiNo,
        grup,
      },
    });
    if (row.count === 0) {
      return NextResponse.json({ error: "Bayi bulunamadı" }, { status: 404 });
    }
    const updated = await prisma.bayi.findFirst({ where: { id, shopId: shop.id } });
    return NextResponse.json(updated);
  } catch (e) {
    return jsonServerError("PATCH /api/bayiler/[id]", e, "Bayi güncellenemedi");
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
    return jsonServerError("DELETE /api/bayiler/[id] (shop)", e, "Dükkan bilgisi alınamadı");
  }
  try {
    const row = await prisma.bayi.findFirst({ where: { id, shopId: shop.id } });
    if (!row) return NextResponse.json({ error: "Bayi bulunamadı" }, { status: 404 });
    const linkedCount = await prisma.serviceOrder.count({ where: { shopId: shop.id, bayiId: id } });
    if (linkedCount > 0 && !force) {
      return NextResponse.json(
        { error: "Bu bayiye bağlı servis kayıtları var", linkedCount },
        { status: 400 },
      );
    }
    if (linkedCount > 0) {
      await prisma.serviceOrder.updateMany({
        where: { shopId: shop.id, bayiId: id },
        data: { bayiId: null },
      });
    }
    await prisma.bayi.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError("DELETE /api/bayiler/[id]", e, "Bayi silinemedi");
  }
}
