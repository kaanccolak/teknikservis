import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import {
  isCompleteTrNationalMobile,
  trNationalToStorage,
  trPhoneDigitsOnly,
} from "@/lib/tr-phone";

export const dynamic = "force-dynamic";

const includeRelations = {
  deviceType: true,
  brand: true,
  deviceModel: true,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/second-hand/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  try {
    const row = await prisma.secondHandDevice.findFirst({
      where: { id, shopId: shop.id },
      include: includeRelations,
    });
    if (!row) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e) {
    return jsonServerError(
      "GET /api/second-hand/[id]",
      e,
      "Kayıt yüklenemedi",
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/second-hand/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const existing = await prisma.secondHandDevice.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const data: Prisma.SecondHandDeviceUpdateInput = {};

  if (typeof o.sellerName === "string") {
    const t = o.sellerName.trim();
    if (!t) {
      return NextResponse.json(
        { error: "Satıcı adı boş olamaz" },
        { status: 400 },
      );
    }
    data.sellerName = t;
  }

  if ("sellerPhone" in o) {
    const sellerPhoneRaw =
      typeof o.sellerPhone === "string" ? o.sellerPhone.trim() : "";
    if (!sellerPhoneRaw) {
      data.sellerPhone = null;
      data.sellerPhoneDigits = null;
    } else {
      const digits = trPhoneDigitsOnly(sellerPhoneRaw);
      data.sellerPhoneDigits = digits.length > 0 ? digits : null;
      data.sellerPhone = isCompleteTrNationalMobile(digits)
        ? trNationalToStorage(digits)
        : sellerPhoneRaw;
    }
  }

  if ("sellerTcNo" in o) {
    data.sellerTcNo =
      typeof o.sellerTcNo === "string" && o.sellerTcNo.trim()
        ? o.sellerTcNo.trim()
        : null;
  }

  if ("notes" in o) {
    data.notes =
      typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null;
  }

  if (typeof o.hasInvoice === "boolean") data.hasInvoice = o.hasInvoice;
  if (typeof o.hasWarranty === "boolean") data.hasWarranty = o.hasWarranty;
  if (typeof o.hasBox === "boolean") data.hasBox = o.hasBox;
  if (typeof o.noSerialNo === "boolean") data.noSerialNo = o.noSerialNo;

  if ("serialNo" in o) {
    data.serialNo =
      typeof o.serialNo === "string" && o.serialNo.trim()
        ? o.serialNo.trim()
        : null;
  }

  if ("purchasePrice" in o) {
    let purchasePrice: number;
    if (typeof o.purchasePrice === "number" && Number.isFinite(o.purchasePrice)) {
      purchasePrice = o.purchasePrice;
    } else if (typeof o.purchasePrice === "string") {
      const p = parseFloat(o.purchasePrice.replace(",", "."));
      purchasePrice = Number.isFinite(p) ? p : NaN;
    } else {
      purchasePrice = NaN;
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir satın alım fiyatı girin" },
        { status: 400 },
      );
    }
    data.purchasePrice = purchasePrice;
  }

  let deviceTypeId: string | null | undefined;
  let brandId: string | null | undefined;
  let deviceModelId: string | null | undefined;

  if ("deviceTypeId" in o) {
    deviceTypeId =
      typeof o.deviceTypeId === "string" && o.deviceTypeId
        ? o.deviceTypeId
        : null;
  }
  if ("brandId" in o) {
    brandId =
      typeof o.brandId === "string" && o.brandId ? o.brandId : null;
  }
  if ("deviceModelId" in o) {
    deviceModelId =
      typeof o.deviceModelId === "string" && o.deviceModelId
        ? o.deviceModelId
        : null;
  }

  const willSetDevice =
    "deviceTypeId" in o || "brandId" in o || "deviceModelId" in o;

  if (willSetDevice) {
    const dt =
      deviceTypeId !== undefined ? deviceTypeId : existing.deviceTypeId;
    const br = brandId !== undefined ? brandId : existing.brandId;
    const dm =
      deviceModelId !== undefined ? deviceModelId : existing.deviceModelId;

    if (dt || br || dm) {
      if (!dt || !br || !dm) {
        return NextResponse.json(
          { error: "Cihaz türü, marka ve model birlikte olmalıdır" },
          { status: 400 },
        );
      }
      const deviceType = await prisma.deviceType.findFirst({
        where: { id: dt, shopId: shop.id },
      });
      const brand = await prisma.brand.findFirst({
        where: { id: br, shopId: shop.id, deviceTypeId: dt },
      });
      const deviceModel = await prisma.deviceModel.findFirst({
        where: { id: dm, shopId: shop.id, brandId: br },
      });
      if (!deviceType || !brand || !deviceModel) {
        return NextResponse.json(
          { error: "Cihaz türü, marka veya model geçersiz" },
          { status: 400 },
        );
      }
      data.deviceType = { connect: { id: dt } };
      data.brand = { connect: { id: br } };
      data.deviceModel = { connect: { id: dm } };
    } else {
      data.deviceType = { disconnect: true };
      data.brand = { disconnect: true };
      data.deviceModel = { disconnect: true };
    }
  }

  if ("isSold" in o) {
    if (o.isSold === true) {
      const buyerName =
        typeof o.buyerName === "string" ? o.buyerName.trim() : "";
      if (!buyerName) {
        return NextResponse.json(
          { error: "Alıcı adı soyadı zorunludur" },
          { status: 400 },
        );
      }
      let soldPrice: number;
      if (typeof o.soldPrice === "number" && Number.isFinite(o.soldPrice)) {
        soldPrice = o.soldPrice;
      } else if (typeof o.soldPrice === "string") {
        const p = parseFloat(o.soldPrice.replace(",", "."));
        soldPrice = Number.isFinite(p) ? p : NaN;
      } else {
        soldPrice = NaN;
      }
      if (!Number.isFinite(soldPrice) || soldPrice <= 0) {
        return NextResponse.json(
          { error: "Geçerli bir satış fiyatı girin" },
          { status: 400 },
        );
      }

      let buyerPhone: string | null = null;
      let buyerPhoneDigits: string | null = null;
      const buyerPhoneRaw =
        typeof o.buyerPhone === "string" ? o.buyerPhone.trim() : "";
      if (buyerPhoneRaw) {
        const digits = trPhoneDigitsOnly(buyerPhoneRaw);
        buyerPhoneDigits = digits.length > 0 ? digits : null;
        buyerPhone = isCompleteTrNationalMobile(digits)
          ? trNationalToStorage(digits)
          : buyerPhoneRaw;
      }

      const buyerTcNo =
        typeof o.buyerTcNo === "string" && o.buyerTcNo.trim()
          ? o.buyerTcNo.trim()
          : null;

      data.isSold = true;
      data.soldAt = new Date();
      data.soldPrice = soldPrice;
      data.buyerName = buyerName;
      data.buyerPhone = buyerPhone;
      data.buyerPhoneDigits = buyerPhoneDigits;
      data.buyerTcNo = buyerTcNo;
    } else if (o.isSold === false) {
      data.isSold = false;
      data.soldAt = null;
      data.soldPrice = null;
      data.buyerName = null;
      data.buyerPhone = null;
      data.buyerPhoneDigits = null;
      data.buyerTcNo = null;
    }
  }

  try {
    const updated = await prisma.secondHandDevice.update({
      where: { id },
      data,
      include: includeRelations,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return jsonServerError(
      "PATCH /api/second-hand/[id]",
      e,
      "Güncelleme başarısız",
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await demoGuard();
  if (guard) return guard;

  const { id } = await params;
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/second-hand/[id] (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  // Parola kontrolü
  const body = await request.json().catch(() => ({}));
  const { settingsPassword } = body as { settingsPassword?: string };
  const { verifySettingsPassword } = await import(
    "@/lib/verify-settings-password"
  );
  const valid = await verifySettingsPassword(
    shop.id,
    settingsPassword ?? "",
  );
  if (!valid) {
    return NextResponse.json({ error: "Parola yanlış" }, { status: 403 });
  }

  const existing = await prisma.secondHandDevice.findFirst({
    where: { id, shopId: shop.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  try {
    await prisma.secondHandDevice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/second-hand/[id]",
      e,
      "Silinemedi",
    );
  }
}
