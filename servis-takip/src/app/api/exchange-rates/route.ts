import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const guncellemeNow = () =>
  new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })

export async function GET() {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()

    // USD
    const usdAlisMatch = xml.match(/<Currency[^>]*CurrencyCode="USD"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/)
    // EUR
    const eurAlisMatch = xml.match(/<Currency[^>]*CurrencyCode="EUR"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/)

    if (!usdAlisMatch || !eurAlisMatch) throw new Error("Parse edilemedi")

    return NextResponse.json({
      usd: {
        alis: parseFloat(usdAlisMatch[1]).toFixed(4),
        satis: parseFloat(usdAlisMatch[2]).toFixed(4),
      },
      eur: {
        alis: parseFloat(eurAlisMatch[1]).toFixed(4),
        satis: parseFloat(eurAlisMatch[2]).toFixed(4),
      },
      kaynak: "tcmb",
      guncelleme: guncellemeNow(),
    })
  } catch (err) {
    console.error("TCMB hata:", err)
    // Fallback: open.er-api.com
    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" }),
        fetch("https://open.er-api.com/v6/latest/EUR", { cache: "no-store" }),
      ])
      const usdData = (await usdRes.json()) as { rates?: { TRY?: number } }
      const eurData = (await eurRes.json()) as { rates?: { TRY?: number } }
      const usdTry = usdData.rates?.TRY
      const eurTry = eurData.rates?.TRY
      if (usdTry == null || eurTry == null) throw new Error("Fallback da başarısız")
      return NextResponse.json({
        usd: { alis: usdTry.toFixed(4), satis: usdTry.toFixed(4) },
        eur: { alis: eurTry.toFixed(4), satis: eurTry.toFixed(4) },
        kaynak: "exchangerate-api",
        guncelleme: guncellemeNow(),
      })
    } catch {
      return NextResponse.json({ usd: null, eur: null }, { status: 500 })
    }
  }
}
