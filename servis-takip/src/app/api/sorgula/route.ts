import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function phonesMatch(customerDigits: string | null | undefined, input: string): boolean {
  const c = digitsOnly(customerDigits ?? "");
  const p = digitsOnly(input);
  if (!c || !p) return false;
  const c10 = c.slice(-10);
  const p10 = p.slice(-10);
  return (
    c10 === p10 ||
    c.endsWith(p) ||
    p.endsWith(c10) ||
    c.includes(p10) ||
    p.includes(c10)
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const phone = searchParams.get("phone")?.replace(/\D/g, "");

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const order = await prisma.serviceOrder.findFirst({
      where: { orderNumber },
      include: {
        customer: { select: { name: true, phoneDigits: true } },
        deviceType: { select: { name: true } },
        brand: { select: { name: true } },
        deviceModel: { select: { name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }

    const customerPhone = order.customer?.phoneDigits ?? "";
    if (!phonesMatch(customerPhone, phone)) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      repairFailedReason: order.repairFailedReason,
      customerName: order.customer?.name ?? null,
      deviceType: order.deviceType?.name ?? order.deviceTypeName,
      brand: order.brand?.name ?? order.brandName,
      model: order.deviceModel?.name ?? order.modelName,
      arrivedAt: new Date(order.arrivedAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      totalPrice: order.totalPrice,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
