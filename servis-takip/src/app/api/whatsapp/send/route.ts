import { NextResponse } from "next/server";

import { demoGuard } from "@/lib/demo-guard";
import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { prisma } from "@/lib/prisma";
import { jsonServerError } from "@/lib/server-error";
import { sendBaileysMessage, getSessionStatus } from "@/lib/baileys-client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await demoGuard();
  if (guard) return guard;

  let body: {
    phone?: string;
    templateName?: string;
    parameters?: string[];
    customMessage?: string;
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

  // Serbest mesaj gönderimi
  if (templateName === "__custom__") {
    const customMessage =
      typeof body.customMessage === "string"
        ? body.customMessage.trim()
        : "";
    if (!customMessage) {
      return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
    }
    const result = await sendBaileysMessage(
      shop.id,
      internationalPhone,
      customMessage,
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Mesaj gönderilemedi" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  }

  // DB'den dükkanın özel şablonuna bak
  const dbTemplate = await prisma.waTemplate.findUnique({
    where: {
      shopId_templateName: {
        shopId: shop.id,
        templateName,
      },
    },
  });

  let message: string;
  if (dbTemplate) {
    // DB şablonunu kullan, değişkenleri replace et
    message = dbTemplate.message
      .replace(/{isim}/g, parameters[0] ?? "")
      .replace(/{seriNo}/g, parameters[1] ?? "")
      .replace(/{cihaz}/g, parameters[2] ?? "")
      .replace(/{fiyat}/g, parameters[3] ?? "")
      .replace(/{neden}/g, parameters[3] ?? "")
      .replace(/{kayitNo}/g, parameters[0] ?? "");
  } else {
    // Default şablonu kullan
    message = buildMessage(templateName, parameters);
  }

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
    servis_teslim_alindi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız teslim alınmıştır. Cihazınızla ilgili gelişmeleri size bildireceğiz.`,

    fiyat_bildirimi: `Sayın ${p[0] ?? ""}. ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızın ${p[3] ?? ""} masrafı vardır. Onaylamak için lütfen bu mesajı yanıtlayın.`,

    onay_bekleniyor: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız için onayınızı bekliyoruz. Onaylıyorsanız lütfen bu mesajı sadece "onaylıyorum" yazarak yanıtlayın.`,

    onay_verildi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız için onay verdiniz. Cihazınızın onarımıyla ilgili sizi bilgilendireceğiz.`,

    parca_bekleniyor: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız için gerekli parçayı bekliyoruz. Parça temin edildiğinde cihazınızın onarımıyla ilgili sizi bilgilendireceğiz.`,

    tamiri_olmuyor: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızın onarımı maalesef yapılamıyor. Teknik servisimizin belirlediği neden: (${p[3] ?? ""}) Daha fazla bilgi için teknik servisimizle iletişime geçebilirsiniz.`,

    sorun_gorulmedi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızın arıza tespitinde herhangi bir sorun görülmedi. Cihazınızı teslim alabilirsiniz.`,

    musteri_iade_istiyor: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızı iade almak istediğinizi belirttiniz. Cihazınızı teslim alabilirsiniz.`,

    onarim_tamamlandi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızın onarımı tamamlanmıştır. Tamir ücreti ${p[3] ?? ""}. Cihazınızı teslim alabilirsiniz.`,

    teslim_edildi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

    teslim_tamir_olmuyor: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınız tamiri yapılamamış olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

    teslim_sorun_gorulmedi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızın arıza tespitinde herhangi bir sorun görülmemiş olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

    teslim_musteri_iade: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} seri numaralı ${p[2] ?? "cihazınız"} cihazınızı iade almak istediğinizi belirttiniz ve herhangi bir işlem yapılmadan teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

    ikinci_el_satin_alindi: `Sayın ${p[0] ?? ""}, ${p[1] ?? ""} cihazınız ${p[2] ?? ""} TL bedelle satın alındı. Teşekkür ederiz.`,
  };

  return messages[templateName] ?? `Servis durumunuz güncellendi. Bilgi için bize ulaşın.`;
}
