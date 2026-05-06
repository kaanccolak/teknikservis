import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // USD/TRY ve EUR/TRY için iki ayrı istek at
    const [usdRes, eurRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 300 } }),
      fetch('https://open.er-api.com/v6/latest/EUR', { next: { revalidate: 300 } })
    ])

    if (!usdRes.ok || !eurRes.ok) throw new Error('API erişim hatası')

    const usdData = await usdRes.json()
    const eurData = await eurRes.json()

    const usdTry = usdData.rates?.TRY
    const eurTry = eurData.rates?.TRY

    if (!usdTry || !eurTry) throw new Error('TRY kuru bulunamadı')

    return NextResponse.json(
      {
        usd: {
          alis: (usdTry * 0.98).toFixed(4),
          satis: (usdTry * 1.02).toFixed(4),
        },
        eur: {
          alis: (eurTry * 0.98).toFixed(4),
          satis: (eurTry * 1.02).toFixed(4),
        },
        kaynak: 'exchangerate-api',
        guncelleme: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' } }
    )

  } catch (error) {
    console.error('Kur çekme hatası:', error)
    return NextResponse.json({ usd: null, eur: null }, { status: 500 })
  }
}
