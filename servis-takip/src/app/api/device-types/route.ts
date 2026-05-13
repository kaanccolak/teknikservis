import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { getCache, invalidateCache, setCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shop = await getOrCreateDefaultShop();
    const cached = getCache<unknown>(`device-types-${shop.id}`);
    if (cached) {
      return NextResponse.json(cached);
    }
    const items = await prisma.deviceType.findMany({
      where: { shopId: shop.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    setCache(`device-types-${shop.id}`, items);
    return NextResponse.json(items);
  } catch (e) {
    return jsonServerError(
      "GET /api/device-types",
      e,
      "Cihaz türleri yüklenemedi",
    );
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch (parseErr) {
    console.error("[POST /api/device-types] JSON parse", parseErr);
    return NextResponse.json(
      { error: "Geçersiz gövde", details: "JSON okunamadı" },
      { status: 400 },
    );
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
    const created = await prisma.deviceType.create({
      data: { shopId: shop.id, name },
      select: { id: true, name: true },
    });
    invalidateCache(`device-types-${shop.id}`);
    invalidateCache(`brands-all-${shop.id}`);
    return NextResponse.json(created);
  } catch (e) {
    return jsonServerError(
      "POST /api/device-types",
      e,
      "Kayıt oluşturulamadı",
    );
  }
}
