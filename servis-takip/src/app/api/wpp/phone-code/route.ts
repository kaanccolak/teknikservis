import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import { startSessionWithPhoneCode, WPP_CONFIGURED } from "@/lib/wppconnect";

export const dynamic = "force-dynamic";

/**
 * POST /api/wpp/phone-code
 * body: { phone: string, session?: string }
 *
 * - WPPConnect üzerinde `linkCode: true` ile oturum başlatır.
 * - Sunucudan gelen pairing kodunu (`code`) JSON içinde döndürür.
 *   Kullanıcı bu kodu telefonundaki WhatsApp uygulamasına girer
 *   (Ayarlar → Bağlı Cihazlar → Telefonla Bağlan).
 */
export async function POST(req: Request) {
  let body: { phone?: string; session?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) {
    return NextResponse.json(
      { error: "Telefon numarası gerekli" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/phone-code (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  if (!WPP_CONFIGURED()) {
    return NextResponse.json(
      { error: "WPPConnect sunucusu yapılandırılmamış" },
      { status: 400 },
    );
  }

  const session =
    typeof body.session === "string" && body.session.trim().length > 0
      ? body.session.trim()
      : shop.id;

  const digits = phone.replace(/\D/g, "");
  const formatted = digits.startsWith("90") ? digits : `90${digits.slice(-10)}`;
  if (formatted.length < 12) {
    return NextResponse.json(
      { error: "Geçerli bir telefon numarası girin" },
      { status: 400 },
    );
  }

  try {
    const { ok, linkCode } = await startSessionWithPhoneCode(session, formatted);
    if (!ok) {
      return NextResponse.json(
        {
          error:
            "Oturum başlatılamadı (WPPConnect sunucusuna ulaşılamıyor olabilir)",
        },
        { status: 502 },
      );
    }
    try {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { wppSession: session },
      });
    } catch {
      // güncelleme başarısız olsa da bağlantı süreci devam edebilir
    }
    if (!linkCode) {
      return NextResponse.json(
        {
          success: false,
          code: null,
          error:
            "WPPConnect sunucusu bağlantı kodu döndürmedi (sürüm pairing kodunu desteklemiyor olabilir)",
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true, code: linkCode });
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/phone-code",
      e,
      "Kod alınamadı",
    );
  }
}
