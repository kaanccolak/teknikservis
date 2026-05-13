import { NextResponse } from "next/server";

import { invalidateCache } from "@/lib/cache";
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
    const existing = await prisma.deviceModel.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    const updated = await prisma.deviceModel.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, brandId: true },
    });
    invalidateCache(`models-${shop.id}-${existing.brandId}`);
    return NextResponse.json(updated);
  } catch (e) {
    return jsonServerError("PATCH /api/models/[id]", e, "Güncellenemedi", 500);
  }
}
