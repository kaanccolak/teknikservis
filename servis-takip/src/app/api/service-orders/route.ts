import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { parseDatetimeLocal } from "@/lib/datetime-local";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { allocateServiceOrderNumber } from "@/lib/service-order-number";
import { SERVICE_ORDER_STATUS_VALUES } from "@/lib/service-order-status";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import {
  trNationalToStorage,
  trPhoneDigitsOnly,
  trPhoneMatchKey,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";
import { createServiceOrderSchema } from "@/lib/validation/create-service-order";

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function phoneRawToStorage(phone: string): string | undefined {
  const d = trPhoneDigitsOnly(phone).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  if (d.length === 0) return undefined;
  return trNationalToStorage(d);
}

export async function GET(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.trim() ?? "";
  const hideCompleted = searchParams.get("hideCompleted") === "true";
  const hideDelivered = searchParams.get("hideDelivered") === "true";
  const deviceTypeId = searchParams.get("deviceTypeId")?.trim() ?? "";
  const brandId = searchParams.get("brandId")?.trim() ?? "";

  if (
    statusParam &&
    statusParam !== "all" &&
    !SERVICE_ORDER_STATUS_VALUES.has(statusParam)
  ) {
    return NextResponse.json({ error: "Geçersiz durum filtresi" }, { status: 400 });
  }

  const where: Prisma.ServiceOrderWhereInput = {
    shopId: shop.id,
  };

  if (deviceTypeId) {
    where.deviceTypeId = deviceTypeId;
  }
  if (brandId) {
    where.brandId = brandId;
  }

  if (statusParam && statusParam !== "all") {
    where.status = statusParam;
  } else if (hideCompleted) {
    where.status = { notIn: ["completed", "delivered"] };
  } else if (hideDelivered) {
    where.status = { not: "delivered" };
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } },
          { orderNumber: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  try {
    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        customer: true,
        deviceType: true,
        brand: true,
        deviceModel: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders",
      e,
      "Kayıtlar yüklenemedi",
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch (parseErr) {
    console.error("[POST /api/service-orders] JSON parse", parseErr);
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi", details: "JSON okunamadı" },
      { status: 400 },
    );
  }

  const parsed = createServiceOrderSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.flatten();
    const msg =
      first.fieldErrors.serialNo?.[0] ??
      first.fieldErrors.customerName?.[0] ??
      first.fieldErrors.phone?.[0] ??
      first.fieldErrors.deviceTypeId?.[0] ??
      first.fieldErrors.brandId?.[0] ??
      first.fieldErrors.deviceModelId?.[0] ??
      first.fieldErrors.arrivedAt?.[0] ??
      first.fieldErrors.warrantyStatus?.[0] ??
      "Bilgileri kontrol edip tekrar deneyin";
    return NextResponse.json(
      { error: msg, details: first.fieldErrors },
      { status: 400 },
    );
  }

  const body = parsed.data;

  if (process.env.NODE_ENV === "development") {
    console.log("[POST /api/service-orders] body", body);
  }

  const arrivedAt = parseDatetimeLocal(body.arrivedAt);
  if (!arrivedAt) {
    return NextResponse.json(
      { error: "Geçersiz geliş tarihi veya saati" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/service-orders (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    let order: { id: string; orderNumber: string | null } | undefined;
    let lastTxError: unknown;

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const orderNumber = await allocateServiceOrderNumber(tx);

          const deviceType = await tx.deviceType.findFirst({
            where: { id: body.deviceTypeId, shopId: shop.id },
          });
          const brand = await tx.brand.findFirst({
            where: {
              id: body.brandId,
              shopId: shop.id,
              deviceTypeId: body.deviceTypeId,
            },
          });
          const deviceModel = await tx.deviceModel.findFirst({
            where: {
              id: body.deviceModelId,
              shopId: shop.id,
              brandId: body.brandId,
            },
          });

          if (!deviceType || !brand || !deviceModel) {
            throw new Error("INVALID_DEVICE_CHAIN");
          }

          const phoneStored = phoneRawToStorage(body.phone);

          let customer = null;
          if (phoneStored) {
            const key = trPhoneMatchKey(phoneStored);
            if (key.length > 0) {
              const candidates = await tx.customer.findMany({
                where: { shopId: shop.id, phone: { not: null } },
              });
              customer =
                candidates.find((c) => trPhoneMatchKey(c.phone) === key) ??
                null;
            }
          }

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                shopId: shop.id,
                name: body.customerName.trim(),
                phone: emptyToNull(phoneStored),
              },
            });
          }

          const serialFinal = body.noSerialNo
            ? null
            : body.serialNo && body.serialNo.length > 0
              ? body.serialNo
              : null;

          return tx.serviceOrder.create({
            data: {
              orderNumber,
              shopId: shop.id,
              customerId: customer.id,
              deviceTypeId: body.deviceTypeId,
              brandId: body.brandId,
              deviceModelId: body.deviceModelId,
              deviceTypeName: deviceType.name,
              brandName: brand.name,
              modelName: deviceModel.name,
              serialNo: serialFinal,
              noSerialNo: body.noSerialNo,
              warrantyStatus: body.warrantyStatus,
              isTampered: body.isTampered,
              complaint: emptyToNull(body.complaint),
              accessories: emptyToNull(body.accessories),
              physicalDamage: emptyToNull(body.physicalDamage),
              arrivedByCargo: body.arrivedByCargo,
              cargoInfo:
                body.arrivedByCargo || emptyToNull(body.cargoInfo) != null
                  ? emptyToNull(body.cargoInfo)
                  : null,
              arrivedAt,
              status: "in_service",
            },
            select: { id: true, orderNumber: true },
          });
        });
        break;
      } catch (e) {
        lastTxError = e;
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002" &&
          attempt < 7
        ) {
          continue;
        }
        throw e;
      }
    }

    if (!order?.orderNumber) {
      throw lastTxError ?? new Error("ORDER_CREATE_FAILED");
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_DEVICE_CHAIN") {
      console.error("[POST /api/service-orders] INVALID_DEVICE_CHAIN", {
        shopId: shop.id,
        deviceTypeId: body.deviceTypeId,
        brandId: body.brandId,
        deviceModelId: body.deviceModelId,
      });
      return NextResponse.json(
        {
          error: "Cihaz türü, marka ve model eşleşmesi geçersiz",
          details:
            "Seçilen kayıtlar bu dükkan veya hiyerarşi ile uyuşmuyor.",
        },
        { status: 400 },
      );
    }
    const d = getErrorDetails(e);
    console.error("[POST /api/service-orders]", { ...d, raw: e });
    return NextResponse.json(
      {
        error: "Kayıt oluşturulurken bir hata oluştu",
        details: d.message,
        ...(d.code ? { code: d.code } : {}),
      },
      { status: 500 },
    );
  }
}
