import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { demoGuard } from "@/lib/demo-guard";
import { parseDatetimeLocal } from "@/lib/datetime-local";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { addContactToGoogle } from "@/lib/googleContacts";
import { prisma } from "@/lib/prisma";
import { allocateServiceOrderNumber } from "@/lib/service-order-number";
import {
  SERVICE_ORDER_DELIVERED_STATUSES,
  SERVICE_ORDER_HIDE_COMPLETED_STATUSES,
  SERVICE_ORDER_STATUS_VALUES,
} from "@/lib/service-order-status";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import {
  trNationalToStorage,
  trPhoneDigitsOnly,
  trPhoneMatchKey,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";
import {
  createServiceOrderSchema,
  formEstimatedPriceToDb,
} from "@/lib/validation/create-service-order";

export const dynamic = "force-dynamic";

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function phoneRawToStorage(phone: string): string | undefined {
  const d = trPhoneDigitsOnly(phone).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  if (d.length === 0) return undefined;
  return trNationalToStorage(d);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
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
  const searchDigits = normalizePhone(search);
  const isPhoneSearch = searchDigits.length >= 3 && /^\d+$/.test(searchDigits);
  const statusParam = searchParams.get("status")?.trim() ?? "";
  const statusInRaw = searchParams.get("statusIn")?.trim() ?? "";
  const statusInList = statusInRaw
    ? statusInRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const hideCompleted = searchParams.get("hideCompleted") === "true";
  const hideDelivered = searchParams.get("hideDelivered") === "true";
  const deviceTypeId = searchParams.get("deviceTypeId")?.trim() ?? "";
  const brandId = searchParams.get("brandId")?.trim() ?? "";
  const deviceModelId = searchParams.get("deviceModelId")?.trim() ?? "";
  const dateFrom = searchParams.get("dateFrom")?.trim() ?? "";
  const dateTo = searchParams.get("dateTo")?.trim() ?? "";
  const onlyBayi = searchParams.get("onlyBayi") === "true";

  if (statusInList.length > 0) {
    for (const s of statusInList) {
      if (!SERVICE_ORDER_STATUS_VALUES.has(s)) {
        return NextResponse.json(
          { error: "Geçersiz durum filtresi" },
          { status: 400 },
        );
      }
    }
  } else if (
    statusParam &&
    statusParam !== "all" &&
    !SERVICE_ORDER_STATUS_VALUES.has(statusParam)
  ) {
    return NextResponse.json({ error: "Geçersiz durum filtresi" }, { status: 400 });
  }

  const where: Prisma.ServiceOrderWhereInput = {
    shopId: shop.id,
    deletedAt: null,
    ...(searchParams.get("personnelId")
      ? { personnelId: searchParams.get("personnelId") }
      : {}),
  };

  if (deviceTypeId) {
    where.deviceTypeId = deviceTypeId;
  }
  if (brandId) {
    where.brandId = brandId;
  }
  if (deviceModelId) {
    where.deviceModelId = deviceModelId;
  }
  if (onlyBayi) {
    where.bayiId = { not: null };
  }

  if (dateFrom || dateTo) {
    where.arrivedAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
    };
  }

  if (statusInList.length > 0) {
    where.status = { in: statusInList };
  } else if (statusParam && statusParam !== "all") {
    where.status = statusParam;
  } else if (hideCompleted) {
    where.status = { notIn: [...SERVICE_ORDER_HIDE_COMPLETED_STATUSES] };
  } else if (hideDelivered) {
    where.status = { notIn: [...SERVICE_ORDER_DELIVERED_STATUSES] };
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } },
          ...(isPhoneSearch
            ? [
                {
                  customer: {
                    phoneDigits: {
                      contains: searchDigits,
                      mode: "insensitive" as const,
                    },
                  },
                },
              ]
            : []),
          { orderNumber: { contains: search, mode: "insensitive" } },
          { serialNo: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: {
          customer: true,
          deviceType: true,
          brand: true,
          deviceModel: true,
          bayi: true,
          personnel: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.serviceOrder.count({ where }),
    ]);
    return NextResponse.json({ orders, total });
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders",
      e,
      "Kayıtlar yüklenemedi",
    );
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

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

  const isReturn =
    typeof json === "object" &&
    json !== null &&
    (json as { isReturn?: unknown }).isReturn === true;

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
      first.fieldErrors.estimatedPrice?.[0] ??
      "Bilgileri kontrol edip tekrar deneyin";
    return NextResponse.json(
      { error: msg, details: first.fieldErrors },
      { status: 400 },
    );
  }

  const body = parsed.data;

  const personnelIdRaw =
    typeof body.personnelId === "string" && body.personnelId.trim()
      ? body.personnelId.trim()
      : undefined;

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
    let order:
      | {
          id: string;
          orderNumber: string | null;
          serialNo: string | null;
          customerName: string;
          customerPhone: string;
          deviceModel: string;
          brand: string;
          brandName: string;
          modelName: string;
          customerIsNew: boolean;
          personnelId: string | null;
        }
      | undefined;
    let lastTxError: unknown;

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const orderNumber = await allocateServiceOrderNumber(tx, shop.id);

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
          if (body.cariId) {
            const cari = await tx.cari.findFirst({
              where: { id: body.cariId, shopId: shop.id },
              select: { id: true },
            });
            if (!cari) {
              throw new Error("INVALID_CARI");
            }
          }
          if (body.bayiId) {
            const bayi = await tx.bayi.findFirst({
              where: { id: body.bayiId, shopId: shop.id },
              select: { id: true },
            });
            if (!bayi) {
              throw new Error("INVALID_BAYI");
            }
          }

          let personnelIdCreate: string | null = null;
          if (personnelIdRaw) {
            const pRow = await tx.personnel.findFirst({
              where: { id: personnelIdRaw, shopId: shop.id },
              select: { id: true },
            });
            if (!pRow) {
              throw new Error("INVALID_PERSONNEL");
            }
            personnelIdCreate = pRow.id;
          }

          const phoneStored = phoneRawToStorage(body.phone);
          const phoneDigits = phoneStored ? normalizePhone(phoneStored) : null;

          let customer = null;
          let customerIsNew = false;
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
            customerIsNew = true;
            customer = await tx.customer.create({
              data: {
                shopId: shop.id,
                name: body.customerName.trim(),
                phone: emptyToNull(phoneStored),
                phoneDigits,
              },
            });
          }

          const serialFinal = body.noSerialNo
            ? null
            : body.serialNo && body.serialNo.length > 0
              ? body.serialNo
              : null;

          const row = await tx.serviceOrder.create({
            data: {
              orderNumber,
              shopId: shop.id,
              customerId: customer.id,
              cariId: body.cariId ?? null,
              bayiId: body.bayiId ?? null,
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
              status: isReturn ? "returned_device" : "in_service",
              estimatedPrice: formEstimatedPriceToDb(body.estimatedPrice),
              personnelId: personnelIdCreate,
            },
            select: { id: true, orderNumber: true, serialNo: true },
          });

          return {
            id: row.id,
            orderNumber: row.orderNumber,
            serialNo: row.serialNo,
            customerName: customer.name,
            customerPhone: customer.phone ?? "",
            deviceModel: deviceModel.name,
            brand: brand.name,
            brandName: brand.name,
            modelName: deviceModel.name,
            customerIsNew,
            personnelId: personnelIdCreate,
          };
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

    if (
      order.customerIsNew &&
      order.customerPhone.trim().length > 0
    ) {
      void addContactToGoogle(
        shop.id,
        {
          name: order.customerName,
          phone: order.customerPhone,
        },
        order.orderNumber,
      ).catch((err) => console.error("[Google Contacts]", err));
    }

    // Atanan personele WhatsApp bildirimi gönder
    if (order.personnelId) {
      try {
        const personnel = await prisma.personnel.findFirst({
          where: { id: order.personnelId, shopId: shop.id },
          select: { name: true, phone: true },
        });
        if (personnel?.phone) {
          const { sendBaileysMessage } = await import("@/lib/baileys-client");
          const message = `🔧 Yeni İş Emri\n\nMüşteri: ${order.customerName}\nCihaz: ${order.brandName ?? ""} ${order.modelName ?? ""}\nKayıt No: ${order.orderNumber}\n\nBu cihaz size atandı.`;
          void sendBaileysMessage(shop.id, personnel.phone, message).catch(
            (err) => console.error("[Personnel WA]", err),
          );
        }
      } catch (err) {
        console.error("[Personnel WA]", err);
      }
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      order: {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        serialNo: order.serialNo,
        deviceModel: order.deviceModel,
        brand: order.brand,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_CARI") {
      return NextResponse.json({ error: "Geçersiz cari seçimi" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "INVALID_BAYI") {
      return NextResponse.json({ error: "Geçersiz bayi seçimi" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "INVALID_PERSONNEL") {
      return NextResponse.json({ error: "Geçersiz personel seçimi" }, { status: 400 });
    }
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
