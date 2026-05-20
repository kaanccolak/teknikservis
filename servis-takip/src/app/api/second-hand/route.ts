import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { addContactToGoogle } from "@/lib/googleContacts";
import { prisma } from "@/lib/prisma";
import { getErrorDetails, jsonServerError } from "@/lib/server-error";
import {
  isCompleteTrNationalMobile,
  trNationalToStorage,
  trPhoneDigitsOnly,
} from "@/lib/tr-phone";

export const dynamic = "force-dynamic";

function normalizeSearchDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function nextSecondHandDeviceCode(
  lastCode: string | undefined,
  prefix: string,
): string {
  const nextSeq = lastCode ? parseInt(lastCode.slice(-3), 10) + 1 : 1;
  if (!Number.isFinite(nextSeq) || nextSeq > 999) {
    throw new Error("DEVICE_CODE_SEQUENCE");
  }
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/second-hand (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  const searchDigits = normalizeSearchDigits(search);
  const isDigitSearch = searchDigits.length >= 3 && /^\d+$/.test(searchDigits);

  const where: Prisma.SecondHandDeviceWhereInput = {
    shopId: shop.id,
  };

  const soldParam =
    new URL(request.url).searchParams.get("sold")?.trim() ?? "all";
  if (soldParam === "stock") {
    where.isSold = false;
  } else if (soldParam === "sold") {
    where.isSold = true;
  }

  const sp = new URL(request.url).searchParams;
  const deviceTypeId = sp.get("deviceTypeId")?.trim() ?? "";
  const brandId = sp.get("brandId")?.trim() ?? "";
  const deviceModelId = sp.get("deviceModelId")?.trim() ?? "";
  if (deviceTypeId) {
    where.deviceTypeId = deviceTypeId;
  }
  if (brandId) {
    where.brandId = brandId;
  }
  if (deviceModelId) {
    where.deviceModelId = deviceModelId;
  }

  if (search) {
    where.OR = [
      { sellerName: { contains: search, mode: "insensitive" } },
      { deviceCode: { contains: search, mode: "insensitive" } },
      { serialNo: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { sellerPhone: { contains: search, mode: "insensitive" } },
      ...(isDigitSearch
        ? [
            {
              sellerPhoneDigits: {
                contains: searchDigits,
                mode: "insensitive" as const,
              },
            },
          ]
        : []),
      { deviceType: { name: { contains: search, mode: "insensitive" } } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
      { deviceModel: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[GET /api/second-hand] shopId:", shop.id);
    }
    const [items, total] = await Promise.all([
      prisma.secondHandDevice.findMany({
        where,
        include: {
          deviceType: true,
          brand: true,
          deviceModel: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.secondHandDevice.count({ where }),
    ]);
    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("[GET /api/second-hand] list error:", error);
    const d = getErrorDetails(error);
    console.error(
      "[GET /api/second-hand] serialized:",
      JSON.stringify(d, null, 2),
    );
    return NextResponse.json(
      {
        error: "Kayıtlar yüklenemedi",
        details: d.message,
        ...(d.code ? { code: d.code } : {}),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch (parseErr) {
    console.error("[POST /api/second-hand] JSON parse failed:", parseErr);
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[POST /api/second-hand] body parsed (keys):", body &&
      typeof body === "object" &&
      body !== null
      ? Object.keys(body as object)
      : typeof body);
  }

  const o = body as Record<string, unknown>;
  const sellerName =
    typeof o.sellerName === "string" ? o.sellerName.trim() : "";
  const sellerPhoneRaw =
    typeof o.sellerPhone === "string" ? o.sellerPhone.trim() : "";
  const sellerTcNo =
    typeof o.sellerTcNo === "string" ? o.sellerTcNo.trim() || null : null;
  const deviceTypeIdRaw =
    typeof o.deviceTypeId === "string" ? o.deviceTypeId.trim() : "";
  const brandIdRaw =
    typeof o.brandId === "string" ? o.brandId.trim() : "";
  const deviceModelIdRaw =
    typeof o.deviceModelId === "string" ? o.deviceModelId.trim() : "";

  const deviceTypeId = deviceTypeIdRaw || undefined;
  const brandId = brandIdRaw || undefined;
  const deviceModelId = deviceModelIdRaw || undefined;
  const serialNo =
    typeof o.serialNo === "string" ? o.serialNo.trim() || null : null;
  const noSerialNo = o.noSerialNo === true;
  const hasInvoice = o.hasInvoice === true;
  const hasWarranty = o.hasWarranty === true;
  const hasBox = o.hasBox === true;
  const notes = typeof o.notes === "string" ? o.notes.trim() || null : null;

  const purchasedAtRaw =
    typeof o.purchasedAt === "string" ? o.purchasedAt.trim() : "";
  const purchasedAt = purchasedAtRaw ? new Date(purchasedAtRaw) : new Date();

  let purchasePrice: number;
  if (typeof o.purchasePrice === "number" && Number.isFinite(o.purchasePrice)) {
    purchasePrice = o.purchasePrice;
  } else if (typeof o.purchasePrice === "string") {
    const p = parseFloat(o.purchasePrice.replace(",", "."));
    purchasePrice = Number.isFinite(p) ? p : NaN;
  } else {
    purchasePrice = NaN;
  }

  if (!sellerName) {
    return NextResponse.json(
      { error: "Satıcı adı soyadı zorunludur" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    return NextResponse.json(
      { error: "Geçerli bir satın alım fiyatı girin" },
      { status: 400 },
    );
  }

  let sellerPhone: string | null = null;
  let sellerPhoneDigits: string | null = null;
  if (sellerPhoneRaw) {
    const digits = trPhoneDigitsOnly(sellerPhoneRaw);
    sellerPhoneDigits = digits.length > 0 ? digits : null;
    if (isCompleteTrNationalMobile(digits)) {
      sellerPhone = trNationalToStorage(digits);
    } else if (digits.length > 0) {
      sellerPhone = sellerPhoneRaw;
    }
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/second-hand (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const hasAnyDevice =
    deviceTypeId !== undefined ||
    brandId !== undefined ||
    deviceModelId !== undefined;
  if (hasAnyDevice) {
    if (!deviceTypeId || !brandId || !deviceModelId) {
      return NextResponse.json(
        { error: "Cihaz türü, marka ve model birlikte seçilmelidir" },
        { status: 400 },
      );
    }
    const deviceType = await prisma.deviceType.findFirst({
      where: { id: deviceTypeId, shopId: shop.id },
    });
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        shopId: shop.id,
        deviceTypeId,
      },
    });
    const deviceModel = await prisma.deviceModel.findFirst({
      where: { id: deviceModelId, shopId: shop.id, brandId },
    });
    if (!deviceType || !brand || !deviceModel) {
      return NextResponse.json(
        { error: "Cihaz türü, marka veya model geçersiz" },
        { status: 400 },
      );
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[POST /api/second-hand] shopId:", shop.id);
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `S${year}${month}`;
      const last = await tx.secondHandDevice.findFirst({
        where: {
          shopId: shop.id,
          deviceCode: { startsWith: prefix },
        },
        orderBy: { deviceCode: "desc" },
        select: { deviceCode: true },
      });
      const deviceCode = nextSecondHandDeviceCode(last?.deviceCode, prefix);

      const data: Prisma.SecondHandDeviceUncheckedCreateInput = {
        shopId: shop.id,
        deviceCode,
        sellerName,
        sellerPhone,
        sellerPhoneDigits,
        sellerTcNo,
        serialNo: noSerialNo ? null : serialNo,
        noSerialNo,
        hasInvoice,
        hasWarranty,
        hasBox,
        purchasePrice,
        notes,
        purchasedAt,
      };

      if (deviceTypeId && brandId && deviceModelId) {
        data.deviceTypeId = deviceTypeId;
        data.brandId = brandId;
        data.deviceModelId = deviceModelId;
      }

      return tx.secondHandDevice.create({
        data,
        include: {
          deviceType: true,
          brand: true,
          deviceModel: true,
        },
      });
    });
    // Satıcıyı Google Contacts'a ekle
    if (sellerPhone && sellerPhone.trim().length > 0) {
      const phoneDigitsCheck =
        sellerPhoneDigits ?? trPhoneDigitsOnly(sellerPhone);
      const existingCount = await prisma.secondHandDevice.count({
        where: {
          shopId: shop.id,
          sellerPhoneDigits: phoneDigitsCheck,
          id: { not: created.id },
        },
      });

      if (existingCount === 0) {
        void addContactToGoogle(
          shop.id,
          {
            name: sellerName,
            phone: sellerPhone,
          },
          created.deviceCode,
        ).catch((err) => console.error("[Google Contacts - SecondHand]", err));
      }
    }
    return NextResponse.json(created);
  } catch (error) {
    console.error("[POST /api/second-hand] Second hand create error:", error);
    try {
      console.error(
        "[POST /api/second-hand] error JSON:",
        JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2),
      );
    } catch {
      console.error("[POST /api/second-hand] error (fallback):", String(error));
    }

    if (error instanceof Error && error.message === "DEVICE_CODE_SEQUENCE") {
      return NextResponse.json(
        { error: "Bu ay için kod limiti aşıldı; destek ile iletişime geçin" },
        { status: 409 },
      );
    }

    const d = getErrorDetails(error);
    return NextResponse.json(
      {
        error: "Kayıt oluşturulamadı",
        details: d.message,
        ...(d.code ? { code: d.code } : {}),
      },
      { status: 500 },
    );
  }
}
