import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ customers: [], bayiler: [] });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/customers/search (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const [customers, bayiler] = await Promise.all([
      prisma.customer.findMany({
        where: {
          shopId: shop.id,
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              orderNumber: true,
              serialNo: true,
              deviceTypeId: true,
              brandId: true,
              deviceModelId: true,
              deviceType: { select: { name: true } },
              brand: { select: { name: true } },
              deviceModel: { select: { name: true } },
            },
          },
        },
      }),
      prisma.bayi.findMany({
        where: {
          shopId: shop.id,
          OR: [
            { firmaAdi: { contains: q, mode: "insensitive" } },
            { yetkiliKisi: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firmaAdi: true,
          yetkiliKisi: true,
          phone: true,
          phoneDigits: true,
        },
      }),
    ]);
    return NextResponse.json({ customers, bayiler });
  } catch (e) {
    return jsonServerError(
      "GET /api/customers/search",
      e,
      "Müşteri araması yapılamadı",
    );
  }
}
