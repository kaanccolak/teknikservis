import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { jsonServerError } from "@/lib/server-error";
import { sendWppMessage, WPP_CONFIGURED } from "@/lib/wppconnect";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string; message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!phone) {
    return NextResponse.json(
      { error: "Telefon numarası gerekli" },
      { status: 400 },
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "Mesaj içeriği gerekli" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/send (shop)",
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

  if (!shop.wppConnected) {
    return NextResponse.json(
      { error: "WhatsApp bağlı değil" },
      { status: 400 },
    );
  }

  const sessionId = shop.wppSession ?? shop.id.slice(0, 8);

  try {
    const ok = await sendWppMessage(sessionId, phone, message);
    if (!ok) {
      return NextResponse.json(
        { error: "Mesaj gönderilemedi" },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonServerError("POST /api/wpp/send", e, "Mesaj gönderilemedi");
  }
}
