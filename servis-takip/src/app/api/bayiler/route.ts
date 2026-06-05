import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_HIDE_COMPLETED_STATUSES } from "@/lib/service-order-status";
import { jsonServerError } from "@/lib/server-error";

const BAYI_CIRO_STATUSES = [...SERVICE_ORDER_HIDE_COMPLETED_STATUSES];

export const dynamic = "force-dynamic";

function normalizeDigits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function parseIskonto(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value));
  if (isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

async function allocateBayiCode(shopId: string) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `B${year}${month}`;

  const lastBayi = await prisma.bayi.findFirst({
    where: {
      shopId,
      bayiCode: { startsWith: prefix },
    },
    orderBy: { bayiCode: "desc" },
    select: { bayiCode: true },
  });

  const seq = lastBayi?.bayiCode
    ? String(Number.parseInt(lastBayi.bayiCode.slice(-3), 10) + 1).padStart(3, "0")
    : "001";

  return `${prefix}${seq}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("GET /api/bayiler (shop)", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const rows = await prisma.bayi.findMany({
      where: {
        shopId: shop.id,
        ...(search
          ? {
              OR: [
                { firmaAdi: { contains: search, mode: "insensitive" } },
                { yetkiliKisi: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { tcVergiNo: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { serviceOrders: true } },
        serviceOrders: {
          where: {
            status: { in: BAYI_CIRO_STATUSES },
          },
          select: { totalPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const enriched = rows.map((bayi) => ({
      id: bayi.id,
      shopId: bayi.shopId,
      bayiCode: bayi.bayiCode,
      firmaAdi: bayi.firmaAdi,
      yetkiliKisi: bayi.yetkiliKisi,
      phone: bayi.phone,
      phoneDigits: bayi.phoneDigits,
      vergiDairesi: bayi.vergiDairesi,
      tcVergiNo: bayi.tcVergiNo,
      iskonto: bayi.iskonto,
      createdAt: bayi.createdAt,
      updatedAt: bayi.updatedAt,
      cihazSayisi: bayi._count.serviceOrders,
      toplamCiro: bayi.serviceOrders.reduce(
        (sum, order) => sum + (order.totalPrice ?? 0),
        0,
      ),
    }));
    return NextResponse.json(enriched);
  } catch (e) {
    return jsonServerError("GET /api/bayiler", e, "Bayiler alınamadı");
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

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

  const iskonto = parseIskonto(json.iskonto);
  const address = typeof json.address === "string" ? json.address.trim() || null : null;
  const cargoInfo = typeof json.cargoInfo === "string" ? json.cargoInfo.trim() || null : null;
  const cargoCode = typeof json.cargoCode === "string" ? json.cargoCode.trim() || null : null;

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError("POST /api/bayiler (shop)", e, "Dükkan bilgisi alınamadı");
  }

  try {
    const bayiCode = await allocateBayiCode(shop.id);
    const row = await prisma.bayi.create({
      data: {
        shopId: shop.id,
        bayiCode,
        firmaAdi,
        yetkiliKisi,
        phone: phoneDigits,
        phoneDigits,
        vergiDairesi:
          typeof json.vergiDairesi === "string"
            ? json.vergiDairesi.trim() || null
            : null,
        tcVergiNo,
        iskonto,
        address,
        cargoInfo,
        cargoCode,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError("POST /api/bayiler", e, "Bayi oluşturulamadı");
  }
}
