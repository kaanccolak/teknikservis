import { NextResponse } from "next/server";
import { demoGuard } from "@/lib/demo-guard";
import { getShop } from "@/lib/getShop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const shop = await getShop();
    const guard = await demoGuard();
    if (guard) return guard;
    if (!shop) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { kategori, mesaj } = (await req.json()) as {
      kategori: string;
      mesaj: string;
    };

    if (!mesaj?.trim()) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Mail servisi yapılandırılmamış" }, { status: 500 });
    }

    const tarih = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">💡 TamirTakip — Yeni Öneri</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Dükkan</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827; font-size: 13px;">${shop.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">E-posta</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827; font-size: 13px;">${user?.email ?? "Bilinmiyor"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Kategori</td>
              <td style="padding: 8px 0; font-size: 13px;">
                <span style="background: ${kategori === "hata" ? "#fef2f2" : kategori === "oneri" ? "#eff6ff" : "#f9fafb"}; color: ${kategori === "hata" ? "#dc2626" : kategori === "oneri" ? "#2563eb" : "#374151"}; padding: 3px 10px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                  ${kategori === "hata" ? "🐛 Hata Bildirimi" : kategori === "oneri" ? "💡 Öneri" : "💬 Diğer"}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Tarih</td>
              <td style="padding: 8px 0; color: #374151; font-size: 13px;">${tarih}</td>
            </tr>
          </table>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border-left: 4px solid #4f46e5;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em;">Mesaj</p>
            <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${mesaj.trim()}</p>
          </div>
        </div>
        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">TamirTakip — tamirtakip.com.tr</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "TamirTakip <noreply@tamirtakip.com.tr>",
        to: ["kaanccolak@gmail.com"],
        subject: `[TamirTakip Öneri] ${kategori === "hata" ? "🐛 Hata" : "💡 Öneri"} — ${shop.name}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Mail gönderilemedi" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Öneri error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
