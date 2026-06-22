import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

const sparePartInclude = {
  deviceType: true,
  brand: true,
  deviceModel: true,
} as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

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

  const o = json as { quantity?: unknown; type?: unknown };
  const qty = typeof o.quantity === "number" ? o.quantity : Number(o.quantity);
  const type = o.type === "add" || o.type === "subtract" ? o.type : null;

  if (!type) {
    return NextResponse.json(
      { error: "type alanı 'add' veya 'subtract' olmalıdır" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: "Miktar en az 1 olmalıdır" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/spare-parts/[id]/stock (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.sparePart.findFirst({
        where: { id, shopId: shop.id },
      });
      if (!row) return null;
      const delta = type === "add" ? qty : -qty;
      const next = row.stock + delta;
      if (next < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      return tx.sparePart.update({
        where: { id },
        data: { stock: next },
        include: sparePartInclude,
      });
    });
    if (!updated) {
      return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Stok yetersiz" }, { status: 400 });
    }
    const d = getErrorDetails(e);
    console.error("[PATCH /api/spare-parts/[id]/stock]", { ...d, raw: e });
    return NextResponse.json(
      { error: "Stok güncellenemedi", details: d.message },
      { status: 500 },
    );
  }
}
