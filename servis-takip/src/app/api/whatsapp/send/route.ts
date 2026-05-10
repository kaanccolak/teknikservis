import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { jsonServerError } from "@/lib/server-error";
import { sendBaileysMessage, getSessionStatus } from "@/lib/baileys-client";
import { WA_TEMPLATES } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    phone?: string;
    templateName?: string;
    parameters?: string[];
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 },
    );
  }

  const phone = typeof body.phone === "string" ? body.phone : "";
  const templateName =
    typeof body.templateName === "string" ? body.templateName.trim() : "";
  const parameters = Array.isArray(body.parameters)
    ? body.parameters.map((p) => String(p ?? ""))
    : [];

  if (!phone.trim()) {
    return NextResponse.json(
      { error: "Telefon numarası gerekli" },
      { status: 400 },
    );
  }

  if (!templateName) {
    return NextResponse.json(
      { error: "Şablon adı gerekli" },
      { status: 400 },
    );
  }

  let shop;
  try {
    shop = await getOrCreateDefaultShop();
  } catch (e) {
    return jsonServerError(
      "POST /api/whatsapp/send (shop)",
      e,
      "Dükkan bilgisi alınamadı",
    );
  }

  if (!shop) {
    return NextResponse.json(
      { error: "Dükkan bilgisi alınamadı" },
      { status: 400 },
    );
  }

  // Telefonu normalize et
  const cleanPhone = phone.replace(/\D/g, "");
  const internationalPhone = cleanPhone.startsWith("90")
    ? cleanPhone
    : `90${cleanPhone}`;

  if (internationalPhone.length < 12) {
    return NextResponse.json(
      { error: "Geçerli bir cep telefonu girin" },
      { status: 400 },
    );
  }

  // Baileys bağlı mı kontrol et
  try {
    const status = await getSessionStatus(shop.id);
    if (!status.connected) {
      return NextResponse.json(
        {
          error:
            "WhatsApp bağlı değil. Şirketim > WhatsApp sekmesinden bağlanın.",
        },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "WhatsApp bağlantısı kontrol edilemedi" },
      { status: 500 },
    );
  }

  // Şablonu düz metne çevir
  const message = buildMessage(templateName, parameters);

  try {
    const result = await sendBaileysMessage(
      shop.id,
      internationalPhone,
      message,
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Mesaj gönderilemedi" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Baileys send error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

function buildMessage(templateName: string, parameters: string[]): string {
  const p = parameters;
  const messages: Record<string, string> = {
    servis_teslim_alindi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) servisimize teslim alındı. Takip etmek için bize ulaşabilirsiniz.`,
    fiyat_bildirimi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) için tamir ücreti: ${p[3] ?? ""}. Onay vermek için lütfen bize ulaşın.`,
    onay_bekleniyor: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) için onayınızı bekliyoruz. Lütfen en kısa sürede bilgi verin.`,
    onay_verildi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) için onayınız alındı. Tamir işlemi başlatıldı.`,
    parca_bekleniyor: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) için gerekli parça temin edilmeyi bekleniyor.`,
    tamiri_olmuyor: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) maalesef tamir edilemiyor. Neden: ${p[3] ?? ""}. Cihazınızı teslim alabilirsiniz.`,
    sorun_gorulmedi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) incelendi, herhangi bir sorun tespit edilmedi.`,
    musteri_iade_istiyor: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) iade talebiniz alındı. En kısa sürede işleme alınacak.`,
    onarim_tamamlandi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) onarımı tamamlandı. Teslim almak için bizi arayabilirsiniz.`,
    teslim_edildi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    teslim_tamir_olmuyor: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) tamir edilemeden teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    teslim_sorun_gorulmedi: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) sorun tespit edilmeden teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    teslim_musteri_iade: `Sayın ${p[0] ?? ""}, ${p[2] ?? "cihazınız"} (Seri No: ${p[1] ?? ""}) iade talebiniz doğrultusunda teslim edildi.`,
    ikinci_el_satin_alindi: `Sayın ${p[0] ?? ""}, ${p[1] ?? "cihazınız"} ${p[2] ?? ""} TL bedelle satın alındı. Teşekkür ederiz.`,
  };

  return (
    messages[templateName] ??
    `Servis durumunuz güncellendi. Bilgi için bize ulaşın.`
  );
}
