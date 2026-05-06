import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

function optStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/external-services (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const [rows, sentAgg] = await Promise.all([
      prisma.externalService.findMany({
        where: {
          shopId: shop.id,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { contactName: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                  { address: { contains: search, mode: "insensitive" } },
                  { notes: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { serviceOrders: true },
          },
        },
      }),
      prisma.serviceOrder.groupBy({
        by: ["externalServiceId"],
        where: {
          shopId: shop.id,
          externalServiceId: { not: null },
          status: "sent_to_external",
        },
        _count: { _all: true },
      }),
    ]);

    const sentMap: Record<string, number> = {};
    for (const s of sentAgg) {
      if (s.externalServiceId != null) {
        sentMap[s.externalServiceId] = s._count._all;
      }
    }

    const payload = rows.map((r) => {
      const { _count, ...rest } = r;
      return {
        ...rest,
        totalSentCount: _count.serviceOrders,
        currentlyThereCount: sentMap[rest.id] ?? 0,
      };
    });

    return NextResponse.json(payload);
  } catch (e) {
    return jsonServerError(
      "GET /api/external-services",
      e,
      "Dış servisler alınamadı",
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const body = json as Record<string, unknown>;
  const name = String(body?.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Servis adı en az 2 karakter olmalıdır" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/external-services (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const row = await prisma.externalService.create({
      data: {
        shopId: shop.id,
        name,
        contactName: optStr(body.contactName),
        phone: optStr(body.phone),
        address: optStr(body.address),
        notes: optStr(body.notes),
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError(
      "POST /api/external-services",
      e,
      "Dış servis oluşturulamadı",
    );
  }
}
