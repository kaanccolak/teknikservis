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
    const { waAccessToken: _omit, ...safe } = shop;
    return NextResponse.json({
      ...safe,
      waTokenConfigured: Boolean(
        _omit && String(_omit).trim().length > 0,
      ),
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
  const name = String(body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Şirket adı en az 2 karakter olmalıdır" },
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
      },
    });
    const { waAccessToken: _t, ...safe } = row;
    invalidateShopCache();
    return NextResponse.json({
      ...safe,
      waTokenConfigured: Boolean(_t && String(_t).trim().length > 0),
    });
  } catch (e) {
    return jsonServerError("PATCH /api/shop", e, "Güncelleme başarısız");
  }
}
