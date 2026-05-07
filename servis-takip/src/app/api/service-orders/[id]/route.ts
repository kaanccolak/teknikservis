import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { parseDatetimeLocal } from "@/lib/datetime-local";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { SERVICE_ORDER_STATUS_VALUES } from "@/lib/service-order-status";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import {
  trNationalToStorage,
  trPhoneDigitsOnly,
  TR_NATIONAL_MOBILE_DIGITS,
} from "@/lib/tr-phone";
import {
  patchServiceOrderSchema,
  type PatchServiceOrderBody,
} from "@/lib/validation/patch-service-order";

const serviceOrderInclude = {
  shop: { select: { name: true } },
  customer: true,
  cari: true,
  deviceType: true,
  brand: true,
  deviceModel: true,
  externalService: true,
  statusLogs: {
    orderBy: { createdAt: "desc" as const },
  },
  sparePartUsages: {
    orderBy: { createdAt: "asc" as const },
    include: { sparePart: true },
  },
} as const;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function phoneRawToStorage(phone: string): string | undefined {
  const d = trPhoneDigitsOnly(phone).slice(0, TR_NATIONAL_MOBILE_DIGITS);
  if (d.length === 0) return undefined;
  const stored = trNationalToStorage(d);
  return stored === "" ? undefined : stored;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const order = await prisma.serviceOrder.findFirst({
      where: { id, shopId: shop.id },
      include: serviceOrderInclude,
    });
    if (!order) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (e) {
    return jsonServerError(
      "GET /api/service-orders/[id]",
      e,
      "Kayıt yüklenemedi",
    );
  }
}

function buildServiceOrderUpdate(
  body: PatchServiceOrderBody,
  existingStatus: string,
): {
  prismaData: Prisma.ServiceOrderUpdateInput;
  statusChanged: boolean;
  newStatus?: string;
} {
  const prismaData: Prisma.ServiceOrderUpdateInput = {};
  let statusChanged = false;
  let newStatus: string | undefined;

  if (body.technicianNote !== undefined) {
    const t = body.technicianNote;
    prismaData.technicianNote =
      t === null ? null : t.trim() === "" ? null : t.trim();
  }
  if (body.totalPrice !== undefined) {
    prismaData.totalPrice = body.totalPrice;
  }
  if (body.estimatedPrice !== undefined) {
    prismaData.estimatedPrice =
      body.estimatedPrice == null || body.estimatedPrice === 0
        ? null
        : body.estimatedPrice;
  }
  if (body.status !== undefined) {
    prismaData.status = body.status;
    newStatus = body.status;
    statusChanged = true;
  }

  if (body.arrivedByCargo !== undefined) {
    prismaData.arrivedByCargo = body.arrivedByCargo;
    if (!body.arrivedByCargo) {
      prismaData.cargoInfo = null;
    } else if (body.cargoInfo !== undefined) {
      prismaData.cargoInfo = emptyToNull(body.cargoInfo);
    }
  } else if (body.cargoInfo !== undefined) {
    prismaData.cargoInfo = emptyToNull(body.cargoInfo);
  }

  if (body.arrivedAt !== undefined) {
    const d = parseDatetimeLocal(body.arrivedAt);
    if (d) prismaData.arrivedAt = d;
  }

  if (
    body.deviceTypeId !== undefined &&
    body.brandId !== undefined &&
    body.deviceModelId !== undefined
  ) {
    prismaData.deviceType = { connect: { id: body.deviceTypeId } };
    prismaData.brand = { connect: { id: body.brandId } };
    prismaData.deviceModel = { connect: { id: body.deviceModelId } };
  }

  if (body.noSerialNo !== undefined) {
    prismaData.noSerialNo = body.noSerialNo;
  }
  if (body.serialNo !== undefined || body.noSerialNo !== undefined) {
    const noSerial = body.noSerialNo ?? false;
    prismaData.serialNo =
      noSerial || !(body.serialNo ?? "").trim()
        ? null
        : (body.serialNo ?? "").trim();
  }

  if (body.warrantyStatus !== undefined) {
    prismaData.warrantyStatus = body.warrantyStatus;
  }
  if (body.isTampered !== undefined) {
    prismaData.isTampered = body.isTampered;
  }
  if (body.complaint !== undefined) {
    prismaData.complaint = emptyToNull(body.complaint);
  }
  if (body.accessories !== undefined) {
    prismaData.accessories = emptyToNull(body.accessories);
  }
  if (body.physicalDamage !== undefined) {
    prismaData.physicalDamage = emptyToNull(body.physicalDamage);
  }

  if (body.repairFailedReason !== undefined) {
    prismaData.repairFailedReason =
      body.repairFailedReason === null || String(body.repairFailedReason).trim() === ""
        ? null
        : String(body.repairFailedReason).trim();
  }

  if (body.status !== undefined && body.status !== "sent_to_external") {
    prismaData.externalService = { disconnect: true };
    prismaData.externalNote = null;
  } else {
    if (body.externalServiceId !== undefined) {
      const tid = body.externalServiceId?.trim() ?? "";
      prismaData.externalService = tid
        ? { connect: { id: tid } }
        : { disconnect: true };
    }
    if (body.externalNote !== undefined) {
      prismaData.externalNote =
        body.externalNote === null
          ? null
          : emptyToNull(String(body.externalNote));
    }
  }

  if (statusChanged && newStatus !== undefined && newStatus === existingStatus) {
    delete prismaData.status;
    statusChanged = false;
    newStatus = undefined;
  }

  return { prismaData, statusChanged, newStatus };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const parsed = patchServiceOrderSchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const formMsg =
      flat.fieldErrors.serialNo?.[0] ??
      flat.fieldErrors.phone?.[0] ??
      flat.fieldErrors.customerName?.[0] ??
      flat.fieldErrors.arrivedAt?.[0] ??
      flat.fieldErrors.estimatedPrice?.[0] ??
      flat.fieldErrors.externalServiceId?.[0] ??
      flat.formErrors[0];
    return NextResponse.json(
      {
        error: formMsg ?? "Geçersiz alanlar",
        details: flat.fieldErrors,
      },
      { status: 400 },
    );
  }

  const body = parsed.data;

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/service-orders/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  let existing;
  try {
    existing = await prisma.serviceOrder.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true, status: true, customerId: true, externalServiceId: true },
    });
  } catch (e) {
    return jsonServerError(
      "PATCH /api/service-orders/[id] (find)",
      e,
      "Kayıt okunamadı",
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  if (body.status !== undefined && !SERVICE_ORDER_STATUS_VALUES.has(body.status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const extIdToVerify =
    body.status === "sent_to_external"
      ? (body.externalServiceId?.trim() ?? "")
      : body.externalServiceId != null && String(body.externalServiceId).trim() !== ""
        ? String(body.externalServiceId).trim()
        : "";
  if (extIdToVerify) {
    const ex = await prisma.externalService.findFirst({
      where: { id: extIdToVerify, shopId: shop.id },
      select: { id: true },
    });
    if (!ex) {
      return NextResponse.json(
        { error: "Geçersiz dış servis seçimi" },
        { status: 400 },
      );
    }
  }

  const { prismaData, statusChanged, newStatus } = buildServiceOrderUpdate(
    body,
    existing.status,
  );

  const customerUpdate: {
    name?: string;
    phone?: string | null;
    phoneDigits?: string | null;
  } = {};
  if (body.customerName !== undefined) {
    customerUpdate.name = body.customerName.trim();
  }
  if (body.phone !== undefined) {
    const stored = phoneRawToStorage(body.phone);
    customerUpdate.phone = stored ? stored : null;
    customerUpdate.phoneDigits = stored ? normalizePhone(stored) : null;
  }
  if (Object.keys(customerUpdate).length > 0) {
    prismaData.customer = { update: customerUpdate };
  }

  if (
    body.deviceTypeId !== undefined &&
    body.brandId !== undefined &&
    body.deviceModelId !== undefined
  ) {
    const deviceType = await prisma.deviceType.findFirst({
      where: { id: body.deviceTypeId, shopId: shop.id },
    });
    const brand = await prisma.brand.findFirst({
      where: {
        id: body.brandId,
        shopId: shop.id,
        deviceTypeId: body.deviceTypeId,
      },
    });
    const deviceModel = await prisma.deviceModel.findFirst({
      where: {
        id: body.deviceModelId,
        shopId: shop.id,
        brandId: body.brandId,
      },
    });
    if (!deviceType || !brand || !deviceModel) {
      return NextResponse.json(
        {
          error: "Cihaz türü, marka ve model eşleşmesi geçersiz",
          details:
            "Seçilen kayıtlar bu dükkan veya hiyerarşi ile uyuşmuyor.",
        },
        { status: 400 },
      );
    }
    prismaData.deviceTypeName = deviceType.name;
    prismaData.brandName = brand.name;
    prismaData.modelName = deviceModel.name;
  }

  const actuallyChangeStatus =
    statusChanged &&
    newStatus !== undefined &&
    newStatus !== existing.status;

  const keysToCheck = { ...prismaData } as Record<string, unknown>;
  delete keysToCheck.customer;
  const hasOrderScalars = Object.keys(keysToCheck).length > 0;
  const hasCustomerOnly =
    prismaData.customer != null &&
    !hasOrderScalars &&
    !actuallyChangeStatus;

  if (!hasOrderScalars && !actuallyChangeStatus && !hasCustomerOnly) {
    return NextResponse.json({ error: "Değişiklik yok" }, { status: 400 });
  }

  const previousStatus = existing.status;

  try {
    await prisma.$transaction(async (tx) => {
      if (actuallyChangeStatus && newStatus !== undefined) {
        await tx.statusLog.create({
          data: {
            serviceOrderId: id,
            oldStatus: previousStatus,
            newStatus,
            note: "Durum güncellendi",
          },
        });
      }
      await tx.serviceOrder.update({
        where: { id },
        data: prismaData,
      });
    });

    const updated = await prisma.serviceOrder.findFirst({
      where: { id, shopId: shop.id },
      include: serviceOrderInclude,
    });

    return NextResponse.json(updated);
  } catch (e) {
    const d = getErrorDetails(e);
    console.error("[PATCH /api/service-orders/[id]]", { ...d, raw: e });
    return NextResponse.json(
      {
        error: "Güncelleme başarısız",
        details: d.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/service-orders/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  let existing;
  try {
    existing = await prisma.serviceOrder.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/service-orders/[id] (find)",
      e,
      "Kayıt okunamadı",
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const usages = await tx.sparePartUsage.findMany({
        where: { serviceOrderId: id, shopId: shop.id },
        select: { sparePartId: true, quantity: true },
      });
      for (const u of usages) {
        await tx.sparePart.update({
          where: { id: u.sparePartId, shopId: shop.id },
          data: { stock: { increment: u.quantity } },
        });
      }
      await tx.sparePartUsage.deleteMany({
        where: { serviceOrderId: id, shopId: shop.id },
      });
      await tx.statusLog.deleteMany({ where: { serviceOrderId: id } });
      await tx.serviceOrder.delete({ where: { id } });
    });
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    const d = getErrorDetails(e);
    console.error("[DELETE /api/service-orders/[id]]", { ...d, raw: e });
    return NextResponse.json(
      {
        error: "Kayıt silinemedi",
        details: d.message,
      },
      { status: 500 },
    );
  }
}
