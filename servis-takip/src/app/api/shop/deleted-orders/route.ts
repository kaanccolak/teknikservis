import { NextResponse } from "next/server";

import { getShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  if (!shop)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const deletedOrdersRaw = await prisma.serviceOrder.findMany({
    where: {
      shopId: shop.id,
      deletedAt: { not: null },
    },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      deletedAt: true,
      createdAt: true,
      deviceTypeName: true,
      brandName: true,
      modelName: true,
      customer: { select: { name: true } },
    },
  });

  const deletedOrders = deletedOrdersRaw.map((o) => {
    const deviceName = [o.brandName, o.deviceTypeName, o.modelName]
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .join(" / ");

    return {
      id: o.id,
      orderNo: o.orderNumber,
      customerName: o.customer?.name ?? null,
      deviceName: deviceName || null,
      deletedAt: o.deletedAt,
      createdAt: o.createdAt,
    };
  });

  return NextResponse.json(deletedOrders);
}

