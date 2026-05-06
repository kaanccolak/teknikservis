import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

const guncellemeNow = () =>
  new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })

export async function GET() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/doviz/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9",
        Referer: "https://bigpara.hurriyet.com.tr/",
      },
      cache: "no-store",
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()
    const $ = cheerio.load(html)

    let usdAlis = ""
    let usdSatis = ""
    let eurAlis = ""
    let eurSatis = ""

    $("table tr, .doviz-table tr, [class*='doviz'] tr").each((_i, row) => {
      const text = $(row).text()
      const cells = $(row).find("td")

      if (text.includes("Dolar") || text.includes("USD")) {
        usdAlis = $(cells[1]).text().trim().replace(",", ".")
        usdSatis = $(cells[2]).text().trim().replace(",", ".")
      }
      if (text.includes("Euro") || text.includes("EUR")) {
        eurAlis = $(cells[1]).text().trim().replace(",", ".")
        eurSatis = $(cells[2]).text().trim().replace(",", ".")
      }
    })

    if (!usdAlis) {
      const usdMatch = html.match(
        /Dolar[\s\S]{0,200}?(\d+[,.]\d+)[\s\S]{0,50}?(\d+[,.]\d+)/,
      )
      const eurMatch = html.match(
        /Euro[\s\S]{0,200}?(\d+[,.]\d+)[\s\S]{0,50}?(\d+[,.]\d+)/,
      )
      if (usdMatch) {
        usdAlis = usdMatch[1].replace(",", ".")
        usdSatis = usdMatch[2].replace(",", ".")
      }
      if (eurMatch) {
        eurAlis = eurMatch[1].replace(",", ".")
        eurSatis = eurMatch[2].replace(",", ".")
      }
    }

    const usdAlisNum = parseFloat(usdAlis)
    const usdSatisNum = parseFloat(usdSatis)
    const eurAlisNum = parseFloat(eurAlis)
    const eurSatisNum = parseFloat(eurSatis)

    if (!Number.isFinite(usdAlisNum) || !Number.isFinite(eurAlisNum)) {
      throw new Error("Parse edilemedi")
    }

    const usdSatisFinal = Number.isFinite(usdSatisNum) ? usdSatisNum : usdAlisNum
    const eurSatisFinal = Number.isFinite(eurSatisNum) ? eurSatisNum : eurAlisNum

    return NextResponse.json({
      usd: {
        alis: usdAlisNum.toFixed(4),
        satis: usdSatisFinal.toFixed(4),
      },
      eur: {
        alis: eurAlisNum.toFixed(4),
        satis: eurSatisFinal.toFixed(4),
      },
      kaynak: "bigpara",
      guncelleme: guncellemeNow(),
    })
  } catch (err) {
    console.error("Bigpara hata:", err)

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
        usd: {
          alis: usdTry.toFixed(4),
          satis: usdTry.toFixed(4),
        },
        eur: {
          alis: eurTry.toFixed(4),
          satis: eurTry.toFixed(4),
        },
        kaynak: "exchangerate-api",
        guncelleme: guncellemeNow(),
      })
    } catch {
      return NextResponse.json({ usd: null, eur: null }, { status: 500 })
    }
  }
}
