import { NextResponse } from "next/server";

import { invalidateShopCache } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Oturum gerekli. Lütfen giriş yapın." },
      { status: 401 },
    );
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

  const body = json as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const shopName =
    typeof body.shopName === "string" ? body.shopName.trim() : "";

  if (userId !== user.id) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
  }

  if (shopName.length < 2) {
    return NextResponse.json(
      { error: "Şirket adı en az 2 karakter olmalıdır" },
      { status: 400 },
    );
  }

  const existing = await prisma.shop.findUnique({
    where: { userId: user.id },
  });
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    await prisma.shop.create({
      data: {
        name: shopName,
        userId: user.id,
        planType: "trial",
        subscriptionStatus: "trial",
        trialEndsAt,
      },
    });
    // Telegram bildirimi gönder
    try {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;
      if (telegramToken && telegramChatId) {
        const phone = user.user_metadata?.phone ?? "Belirtilmedi";
        const email = user.email ?? "Belirtilmedi";
        const message = `🆕 *Yeni Kayıt!*\n\n🏪 *Dükkan:* ${shopName}\n📧 *E-posta:* ${email}\n📱 *Telefon:* ${phone}\n⏰ *Tarih:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`;
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      }
    } catch (telegramError) {
      console.error("[Telegram bildirimi gönderilemedi]", telegramError);
      // Telegram hatası kayıt işlemini engellemez
    }
    invalidateShopCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const retry = await prisma.shop.findUnique({
      where: { userId: user.id },
    });
    if (retry) {
      return NextResponse.json({ ok: true });
    }
    console.error("[POST /api/auth/register]", e);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 },
    );
  }
}
