import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { jsonServerError } from "@/lib/server-error";
import { confirmLinkCode, WPP_CONFIGURED } from "@/lib/wppconnect";

export const dynamic = "force-dynamic";

/**
 * POST /api/wpp/confirm-code
 * body: { code: string, session?: string }
 *
 * Pairing kodunu WPPConnect sunucusuna iletir; başarılıysa
 * sonraki `GET /api/wpp/session` çağrısında durum `CONNECTED` olur.
 */
export async function POST(req: Request) {
  let body: { code?: string; session?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/confirm-code (shop)",
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
      : (shop.wppSession ?? shop.id);

  try {
    const ok = await confirmLinkCode(session, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Kod doğrulanamadı" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return jsonServerError(
      "POST /api/wpp/confirm-code",
      e,
      "Kod doğrulanamadı",
    );
  }
}
