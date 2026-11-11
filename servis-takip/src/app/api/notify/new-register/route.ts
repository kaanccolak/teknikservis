import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { shopName, email, phone } = (await request.json()) as {
      shopName: string;
      email: string;
      phone: string;
    };
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    if (!telegramToken || !telegramChatId) {
      return NextResponse.json({ ok: false });
    }
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
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Telegram bildirimi gönderilemedi]", e);
    return NextResponse.json({ ok: false });
  }
}
