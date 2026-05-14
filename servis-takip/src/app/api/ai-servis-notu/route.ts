import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { hamMetin, hedef } = (await req.json()) as {
      hamMetin: string;
      hedef: "repair" | "note";
    };

    if (!hamMetin?.trim()) {
      return NextResponse.json({ error: "Metin gerekli" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key bulunamadı" }, { status: 500 });
    }

    const systemPrompt =
      hedef === "repair"
        ? `Sen bir teknik servis asistanısın. Teknisyenin sesli olarak söylediği ham onarım notunu, profesyonel ve anlaşılır bir servis raporuna çevir.

         KURALLAR:
         - Teknik terimleri doğru kullan
         - Düzgün Türkçe ve noktalama kullan
         - Kısa ve öz tut, gereksiz dolgu kelime ekleme
         - Sadece düzenlenmiş metni döndür, açıklama yapma
         - 1-3 cümle yeterli`
        : `Sen bir teknik servis asistanısın. Teknisyenin sesli olarak söylediği dahili notu düzgün yazıya çevir.

         KURALLAR:
         - Düzgün Türkçe ve noktalama kullan
         - Ham metni anlamlı cümlelere dönüştür
         - Teknik detayları koru
         - Sadece düzenlenmiş metni döndür, açıklama yapma`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Ham metin: "${hamMetin}"` },
        ],
        temperature: 0.3,
        max_tokens: 256,
      }),
    });

    const data = (await response.json()) as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message ?? "Düzenleme başarısız" },
        { status: 500 },
      );
    }

    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI servis notu error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
