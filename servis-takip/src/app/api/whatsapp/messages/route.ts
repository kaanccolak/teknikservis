import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/whatsapp/messages (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(limitRaw ?? "20", 10) || 20),
  );

  try {
    if (orderId) {
      const order = await prisma.serviceOrder.findFirst({
        where: { id: orderId, shopId: shop.id },
        select: { id: true },
      });
      if (!order) {
        return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
      }

      const messages = await prisma.whatsAppMessage.findMany({
        where: { shopId: shop.id, serviceOrderId: orderId },
        orderBy: { timestamp: "asc" },
        select: {
          id: true,
          from: true,
          message: true,
          timestamp: true,
          customerName: true,
          serviceOrderId: true,
          isRead: true,
          serviceOrder: {
            select: { orderNumber: true },
          },
        },
      });

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          message: m.message,
          timestamp: m.timestamp.toISOString(),
          customerName: m.customerName,
          serviceOrderId: m.serviceOrderId,
          orderNumber: m.serviceOrder?.orderNumber ?? null,
          isRead: m.isRead,
        })),
      });
    }

    const where = { shopId: shop.id };

    const [total, rows] = await Promise.all([
      prisma.whatsAppMessage.count({ where }),
      prisma.whatsAppMessage.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          from: true,
          message: true,
          timestamp: true,
          customerName: true,
          serviceOrderId: true,
          isRead: true,
          serviceOrder: {
            select: { orderNumber: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      messages: rows.map((m) => ({
        id: m.id,
        from: m.from,
        message: m.message,
        timestamp: m.timestamp.toISOString(),
        customerName: m.customerName,
        serviceOrderId: m.serviceOrderId,
        orderNumber: m.serviceOrder?.orderNumber ?? null,
        isRead: m.isRead,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    return jsonServerError(
      "GET /api/whatsapp/messages",
      e,
      "Mesajlar alınamadı",
    );
  }
}

export async function PATCH(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const id =
    typeof json === "object" &&
    json !== null &&
    typeof (json as { id?: unknown }).id === "string"
      ? (json as { id: string }).id.trim()
      : "";

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/whatsapp/messages (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const updated = await prisma.whatsAppMessage.updateMany({
      where: { id, shopId: shop.id },
      data: { isRead: true },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError(
      "PATCH /api/whatsapp/messages",
      e,
      "Güncelleme başarısız",
    );
  }
}
