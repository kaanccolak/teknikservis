import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import {
  closeSession,
  getQRCode,
  getSessionStatus,
  startSession,
  WPP_CONFIGURED,
} from "@/lib/wppconnect";

export const dynamic = "force-dynamic";

/**
 * GET /api/wpp/session
 * - Baileys oturum durumunu döndürür.
 * - Bağlıysa Shop tablosunu (`wppConnected`, `wppPhone`, `wppSession`) günceller.
 * - Bağlı değilken QR kodu varsa döndürür.
 *
 * Baileys session adı: `shop.id`'in ilk 8 karakteri.
 */
export async function GET() {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "GET /api/wpp/session (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  if (!WPP_CONFIGURED()) {
    return NextResponse.json({
      configured: false,
      status: "CLOSED",
      qr: null,
      connected: false,
      phone: null,
    });
  }

  const sessionId = shop.id.slice(0, 8);
  console.log("[GET /api/wpp/session] shop.id:", shop.id);
  console.log("[GET /api/wpp/session] sessionId:", sessionId);

  const info = await getSessionStatus(sessionId);
  const isConnected = info.connected;
  const phone: string | null = info.phone ?? shop.wppPhone ?? null;
  let qr: string | null = null;

  if (isConnected) {
    if (
      !shop.wppConnected ||
      shop.wppSession !== sessionId ||
      phone !== shop.wppPhone
    ) {
      try {
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            wppConnected: true,
            wppSession: sessionId,
            wppPhone: phone,
          },
        });
      } catch {
        // güncelleme hatasını yut
      }
    }
  } else {
    try {
      qr = await getQRCode(sessionId);
    } catch {
      qr = null;
    }
    if (shop.wppConnected) {
      try {
        await prisma.shop.update({
          where: { id: shop.id },
          data: { wppConnected: false },
        });
      } catch {
        // yut
      }
    }
  }

  return NextResponse.json({
    configured: true,
    status: info.status,
    qr,
    connected: isConnected,
    phone,
  });
}

/** POST /api/wpp/session — Session başlat (QR akışını tetikler) */
export async function POST() {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/session (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  if (!WPP_CONFIGURED()) {
    return NextResponse.json(
      { error: "Baileys sunucusu yapılandırılmamış (WPPCONNECT_URL eksik)" },
      { status: 400 },
    );
  }

  const sessionId = shop.id.slice(0, 8);
  console.log("[POST /api/wpp/session] shop.id:", shop.id);
  console.log("[POST /api/wpp/session] sessionId:", sessionId);
  console.log("[POST /api/wpp/session] WPP URL:", process.env.WPPCONNECT_URL);

  try {
    const ok = await startSession(sessionId);
    if (!ok) {
      return NextResponse.json(
        {
          error:
            "Oturum başlatılamadı (Baileys sunucusuna ulaşılamıyor olabilir)",
        },
        { status: 502 },
      );
    }
    await prisma.shop.update({
      where: { id: shop.id },
      data: { wppSession: sessionId },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/session",
      e,
      "Oturum başlatılamadı",
    );
  }
}

/** DELETE /api/wpp/session — Oturumu kapat */
export async function DELETE() {
  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "DELETE /api/wpp/session (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  const sessionId = shop.wppSession ?? shop.id.slice(0, 8);

  if (WPP_CONFIGURED()) {
    try {
      await closeSession(sessionId);
    } catch {
      // sunucu erişilebilir değilse yine de DB temizlensin
    }
  }

  try {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { wppConnected: false, wppPhone: null },
    });
  } catch (e) {
    return jsonServerError(
      "DELETE /api/wpp/session (update)",
      e,
      "Bağlantı kesilemedi",
    );
  }

  return NextResponse.json({ success: true });
}
