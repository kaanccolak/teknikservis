import { NextResponse } from "next/server";

import { getOrCreateDefaultShop } from "@/lib/default-shop";
import { jsonServerError } from "@/lib/server-error";

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

  if (
    !shop?.waEnabled ||
    !shop.waPhoneNumberId?.trim() ||
    !shop.waAccessToken?.trim()
  ) {
    return NextResponse.json(
      { error: "WhatsApp entegrasyonu aktif değil" },
      { status: 400 },
    );
  }

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

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${shop.waPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${shop.waAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: internationalPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "tr" },
            components:
              parameters.length > 0
                ? [
                    {
                      type: "body",
                      parameters: parameters.map((p) => ({
                        type: "text",
                        text: p,
                      })),
                    },
                  ]
                : [],
          },
        }),
      },
    );

    const data = (await response.json()) as {
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("WhatsApp API hatası:", data);
      const msg =
        typeof data.error?.message === "string"
          ? data.error.message
          : "Mesaj gönderilemedi";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
