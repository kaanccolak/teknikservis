import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { invalidateShopCache } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";

export const dynamic = "force-dynamic";

function optStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function normalizeDigits(value: string | undefined | null): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export async function GET() {
  try {
    const shop = await getOrCreateDefaultShop();
    const {
      waAccessToken: _omit,
      googleAccessToken: _gAccess,
      googleRefreshToken,
      googleTokenExpiry: _googleTokenExpiryOmit,
      ...safe
    } = shop;
    void googleRefreshToken;
    void _googleTokenExpiryOmit;
    const waUnreadCount = await prisma.whatsAppMessage.count({
      where: { shopId: shop.id, isRead: false },
    });
    return NextResponse.json({
      ...safe,
      waTokenConfigured: Boolean(
        _omit && String(_omit).trim().length > 0,
      ),
      googleContactsConnected: Boolean(
        _gAccess && String(_gAccess).trim().length > 0,
      ),
      waUnreadCount,
    });
  } catch (e) {
    return jsonServerError("GET /api/shop", e, "Şirket bilgileri alınamadı");
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

  const body = json as Record<string, unknown>;

  if (
    "googleAccessToken" in body &&
    body.googleAccessToken !== null &&
    body.googleAccessToken !== undefined
  ) {
    return NextResponse.json(
      { error: "Google oturumu yalnızca Google ile bağlan akışıyla kurulur" },
      { status: 400 },
    );
  }
  if (
    "googleRefreshToken" in body &&
    body.googleRefreshToken !== null &&
    body.googleRefreshToken !== undefined
  ) {
    return NextResponse.json(
      { error: "Geçersiz Google alanı" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "PATCH /api/shop (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const name =
    body.name !== undefined
      ? String(body.name ?? "").trim()
      : shop.name.trim();
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Şirket adı en az 2 karakter olmalıdır" },
      { status: 400 },
    );
  }

  const phoneRaw = body.phone !== undefined ? optStr(body.phone) : shop.phone;
  const phoneDigits =
    body.phone !== undefined
      ? normalizeDigits(phoneRaw ?? "")
      : shop.phoneDigits;

  try {
    const row = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name,
        phone: body.phone !== undefined ? phoneRaw : shop.phone,
        phoneDigits:
          body.phone !== undefined ? phoneDigits : shop.phoneDigits,
        email:
          body.email !== undefined ? optStr(body.email) : shop.email,
        address:
          body.address !== undefined ? optStr(body.address) : shop.address,
        taxOrTcNo:
          body.taxOrTcNo !== undefined
            ? optStr(body.taxOrTcNo)
            : shop.taxOrTcNo,
        taxOffice:
          body.taxOffice !== undefined
            ? optStr(body.taxOffice)
            : shop.taxOffice,
        website:
          body.website !== undefined ? optStr(body.website) : shop.website,
        logoUrl:
          body.logoUrl !== undefined ? optStr(body.logoUrl) : shop.logoUrl,
        ...(body.waPhoneNumberId !== undefined
          ? {
              waPhoneNumberId: optStr(body.waPhoneNumberId as string),
            }
          : {}),
        ...(body.waEnabled !== undefined && typeof body.waEnabled === "boolean"
          ? { waEnabled: body.waEnabled }
          : {}),
        ...("waAccessToken" in body && typeof body.waAccessToken === "string"
          ? {
              waAccessToken:
                body.waAccessToken.trim().length > 0
                  ? body.waAccessToken.trim()
                  : null,
            }
          : {}),
        ...("googleAccessToken" in body && body.googleAccessToken === null
          ? {
              googleAccessToken: null,
              googleRefreshToken: null,
              googleTokenExpiry: null,
            }
          : {}),
      },
    });
    const {
      waAccessToken: _t,
      googleAccessToken: _ga,
      googleRefreshToken,
      googleTokenExpiry: _googleTokenExpiryOmit,
      ...safe
    } = row;
    void googleRefreshToken;
    void _googleTokenExpiryOmit;
    invalidateShopCache();
    return NextResponse.json({
      ...safe,
      waTokenConfigured: Boolean(_t && String(_t).trim().length > 0),
      googleContactsConnected: Boolean(
        _ga && String(_ga).trim().length > 0,
      ),
    });
  } catch (e) {
    return jsonServerError("PATCH /api/shop", e, "Güncelleme başarısız");
  }
}
