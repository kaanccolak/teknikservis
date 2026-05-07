import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json([]);
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
    const customers = await prisma.customer.findMany({
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
    });
    return NextResponse.json(customers);
  } catch (e) {
    return jsonServerError(
      "GET /api/customers/search",
      e,
      "Müşteri araması yapılamadı",
    );
  }
}
