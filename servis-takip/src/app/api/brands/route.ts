import { NextResponse } from "next/server";

import { getCache, invalidateCache, setCache } from "@/lib/cache";
import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deviceTypeId = new URL(request.url).searchParams
    .get("deviceTypeId")
    ?.trim();
  try {
    const shop = await getOrCreateDefaultShop();
    const cacheKey = deviceTypeId
      ? `brands-${shop.id}-${deviceTypeId}`
      : `brands-all-${shop.id}`;
    const cached = getCache<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!deviceTypeId) {
      const items = await prisma.brand.findMany({
        where: { shopId: shop.id },
        orderBy: [{ name: "asc" }],
        select: { id: true, name: true, deviceTypeId: true },
      });
      setCache(cacheKey, items);
      return NextResponse.json(items);
    }

    const dt = await prisma.deviceType.findFirst({
      where: { id: deviceTypeId, shopId: shop.id },
    });
    if (!dt) {
      return NextResponse.json(
        { error: "Cihaz türü bulunamadı" },
        { status: 404 },
      );
    }
    const items = await prisma.brand.findMany({
      where: { shopId: shop.id, deviceTypeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, deviceTypeId: true },
    });
    setCache(cacheKey, items);
    return NextResponse.json(items);
  } catch (e) {
    return jsonServerError("GET /api/brands", e, "Markalar yüklenemedi");
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch (parseErr) {
    console.error("[POST /api/brands] JSON parse", parseErr);
    return NextResponse.json(
      { error: "Geçersiz gövde", details: "JSON okunamadı" },
      { status: 400 },
    );
  }
  const o = body as { name?: unknown; deviceTypeId?: unknown };
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const deviceTypeId = typeof o.deviceTypeId === "string" ? o.deviceTypeId : "";
  if (!name || !deviceTypeId) {
    return NextResponse.json(
      { error: "İsim ve cihaz türü gerekli" },
      { status: 400 },
    );
  }
  try {
    const shop = await getOrCreateDefaultShop();
    const dt = await prisma.deviceType.findFirst({
      where: { id: deviceTypeId, shopId: shop.id },
    });
    if (!dt) {
      return NextResponse.json(
        { error: "Cihaz türü bulunamadı" },
        { status: 404 },
      );
    }
    const created = await prisma.brand.create({
      data: {
        shopId: shop.id,
        deviceTypeId,
        name,
      },
      select: { id: true, name: true, deviceTypeId: true },
    });
    invalidateCache(`brands-${shop.id}-${deviceTypeId}`);
    invalidateCache(`brands-all-${shop.id}`);
    return NextResponse.json(created);
  } catch (e) {
    return jsonServerError(
      "POST /api/brands",
      e,
      "Kayıt oluşturulamadı",
    );
  }
}
