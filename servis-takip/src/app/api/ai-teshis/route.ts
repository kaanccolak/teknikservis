import { NextResponse } from "next/server";
import { getShop } from "@/lib/getShop";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { cihaz, sikayet } = (await req.json()) as {
      cihaz: string;
      sikayet: string;
    };

    if (!cihaz && !sikayet) {
      return NextResponse.json(
        { error: "Cihaz veya şikayet bilgisi gerekli" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key bulunamadı" }, { status: 500 });
    }

    const systemPrompt = `Sen deneyimli bir teknik servis teknisyenisin. 15 yıllık tecrüben var. Elektronik cihazlar, telefonlar, tabletler, oyun konsolları, beyaz eşya, bilgisayar ve diğer elektronik ekipmanlar konusunda uzmansın.

Sana bir cihaz adı ve şikayet/arıza bilgisi verilecek. Sen de:
1. Bu arızanın en olası 2-3 nedenini belirt
2. Teknisyenin yapması gereken kontrol adımlarını sırala
3. Varsa dikkat edilmesi gereken önemli noktayı belirt

KURALLAR:
- Sadece verilen cihaza özel cevap ver, başka cihazlardan bahsetme
- Kısa ve pratik ol, gereksiz tekrar yapma
- Türkçe yaz
- Madde madde listele
- Maksimum 120 kelime`;

    const userPrompt = `Cihaz: ${cihaz || "Belirtilmemiş"}
Şikayet: ${sikayet || "Belirtilmemiş"}

Bu cihaz için arıza teşhisi yap.`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 512,
      }),
    });

    const data = (await response.json()) as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    if (!response.ok || data.error) {
      console.error("Groq teshis error:", data.error);
      return NextResponse.json(
        { error: data.error?.message ?? "Teşhis yapılamadı" },
        { status: 500 },
      );
    }

    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI teshis error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
