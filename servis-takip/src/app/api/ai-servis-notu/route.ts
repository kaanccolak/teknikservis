import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";
import { checkSubscription } from "@/lib/checkSubscription";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const subCheck = await checkSubscription();
  if (subCheck) return subCheck.error;

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

    const apiKey = process.env.GEMINI_API_KEY;
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nHam metin: "${hamMetin}"` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = (await response.json()) as {
      candidates?: { content: { parts: { text: string }[] } }[];
      error?: { message: string };
    };
    if (!response.ok || data.error) {
      console.error("Gemini error:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Yapay zeka hatası" },
        { status: 500 },
      );
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI servis notu error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
