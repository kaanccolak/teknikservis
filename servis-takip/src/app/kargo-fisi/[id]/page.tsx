'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const getSizeCSS = (boyut: string, yon: string) => {
  const sizes: Record<string, string> = {
    A4: 'A4',
    A5: 'A5',
    A6: 'A6',
    '80mm termal': '80mm auto',
    '58mm termal': '58mm auto',
  }
  const size = sizes[boyut] || '80mm auto'
  const orientation = yon === 'landscape' ? 'landscape' : 'portrait'
  if (['A4', 'A5', 'A6'].includes(boyut)) {
    return `${size} ${orientation}`
  }
  return size
}

const getMarginCSS = (kenar: string) => {
  const margins: Record<string, string> = {
    Yok: '0',
    Dar: '0.3cm',
    Normal: '1cm',
    Geniş: '2cm',
    yok: '0',
    dar: '0.3cm',
    normal: '1cm',
    genis: '2cm',
  }
  return margins[kenar] || '0.3cm'
}

export default function KargoFisi() {
  const params = useParams()
  const router = useRouter()
  const [cari, setCari] = useState<any>(null)
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [printSettings, setPrintSettings] = useState({
    boyut: '80mm',
    yon: 'portrait',
    kenar: 'dar',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const settings = Array.isArray(data?.settings)
          ? data.settings
          : Object.entries(data ?? {}).map(([key, value]) => ({ key, value }))
        const get = (key: string) =>
          settings.find((s: any) => s.key === key)?.value
        setPrintSettings({
          boyut: get('kargo_fisi_boyut') || '80mm',
          yon: get('kargo_fisi_yon') || 'portrait',
          kenar: get('kargo_fisi_kenar') || 'dar',
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cari/${params.id}`)
        const data = await res.json()
        setCari(data.cari)
        setShop(data.shop)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) return <div style={{ padding: 20 }}>Yükleniyor...</div>
  if (!cari) return <div style={{ padding: 20 }}>Cari bulunamadı.</div>

  const today = new Date().toLocaleDateString('tr-TR')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          @page { size: ${getSizeCSS(printSettings.boyut, printSettings.yon)}; margin: ${getMarginCSS(printSettings.kenar)}; }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          .fis-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            padding: 8px !important;
            height: auto !important;
            min-height: unset !important;
            page-break-after: avoid !important;
          }
          .page-bg {
            background: white !important;
            padding: 0 !important;
            min-height: unset !important;
            height: auto !important;
          }
        }
      `}} />
      <div className="page-bg" style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
        <div className="no-print" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}
          >
            ← Geri Dön
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Yazdır / PDF Kaydet
          </button>
        </div>
        {(printSettings.boyut === '80mm termal' || printSettings.boyut === '58mm termal') && (
          <p
            className="no-print"
            style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '6px',
              marginBottom: '12px',
              maxWidth: '280px',
            }}
          >
            💡 Termal yazıcı için tarayıcının yazdırma ayarlarından kağıt boyutunu manuel
            olarak 80mm veya özel boyut olarak seçin.
          </p>
        )}

        <div className="fis-wrapper" style={{ width: '280px', margin: '0 auto', backgroundColor: 'white', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>KARGO GÖNDERİ FİŞİ</div>
            <div>{shop?.name || 'Servis Merkezi'}</div>
            <div style={{ color: '#666' }}>{today}</div>
          </div>

          <hr style={{ margin: '8px 0' }} />

          <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Gönderici Bilgileri</div>
            <div>{shop?.name || 'Servis Merkezi'}</div>
          </div>

          <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Alıcı Bilgileri</div>
            {cari.name && <div><strong>İsim/Ünvan:</strong> {cari.name}</div>}
            {cari.phone && <div><strong>Telefon:</strong> {cari.phone}</div>}
            {cari.address && <div><strong>Adres:</strong> {cari.address}</div>}
            {cari.taxOrTcNo && <div><strong>Vergi/TC No:</strong> {cari.taxOrTcNo}</div>}
          </div>

          {(cari.cargoInfo || cari.cargoCode) && (
            <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Kargo Bilgileri</div>
              {cari.cargoInfo && <div><strong>Anlaşmalı Kargo:</strong> {cari.cargoInfo}</div>}
              {cari.cargoCode && <div><strong>Anlaşma Kodu:</strong> {cari.cargoCode}</div>}
            </div>
          )}

          <div style={{ border: '1px dashed #000', padding: '8px', marginBottom: '8px', minHeight: '50px' }}>
            {/* Barkod alanı */}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={{ borderTop: '1px solid #000', width: '120px', margin: '0 auto', paddingTop: '4px' }}>
              Gönderici İmzası
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
