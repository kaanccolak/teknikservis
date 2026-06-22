"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const paketler = [
  {
    ad: "Basic",
    aylik: 130,
    yillik: 1300,
    aciklama: "Küçük ve tek kişilik servisler için ideal başlangıç.",
    ozellikler: [
      "Sınırsız cihaz kayıt ve takip",
      "Cihaz sorgula ekranı",
      "Fiş, etiket ve müşteri nüshası",
      "İkinci el modülü",
      "Dış servisler ve bekleyen cihazlar",
      "Cari ve bayi yönetimi",
      "Planlarım ve hazır tanımlar",
      "Sınırsız WhatsApp mesajı",
      "Yardım ve Destek AI",
    ],
    planType: "basic",
    vurgu: false,
  },
  {
    ad: "Premium",
    aylik: 210,
    yillik: 2100,
    aciklama: "Büyüyen servisler için ekip ve analiz özellikleri.",
    rozet: "En Çok Tercih Edilen",
    ozellikler: [
      "Tüm Basic Paket İçeriği",
      "Stok yönetimi",
      "Raporlar ve ciro görünümü",
      "Tüm yapay zeka özellikleri",
      "Google Contacts entegrasyonu",
      "5 personele kadar kullanım",
      "Personel yetki ve giriş modu",
    ],
    planType: "premium",
    vurgu: true,
  },
  {
    ad: "Enterprise",
    aylik: 300,
    yillik: 3000,
    aciklama: "Çok personelli ve büyük servisler için tam güç.",
    ozellikler: [
      "Tüm Premium Paket İçeriği",
      "İş emirleri modülü",
      "Sınırsız personel",
      "Haftalık rapor e-postası",
      "Öncelikli destek",
    ],
    planType: "enterprise",
    vurgu: false,
  },
];

export default function PaketSecPage() {
  const router = useRouter();
  const [yillik, setYillik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function handlePaketSec(planType: string) {
    setYukleniyor(planType);
    setHata(null);

    try {
      const res = await fetch("/api/paytr/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billingCycle: yillik ? "yearly" : "monthly",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setHata(data.error || "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        return;
      }

      setIframeToken(data.token);
    } catch {
      setHata("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(null);
    }
  }

  async function handleCikis() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/landing");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Üst bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: "#4f46e5" }}>TamirTakip</span>
        <button
          type="button"
          onClick={() => void handleCikis()}
          style={{ fontSize: "13px", color: "#6b7280", background: "none", border: "1px solid #e5e7eb", padding: "6px 14px", borderRadius: "8px", cursor: "pointer" }}
        >
          Çıkış Yap
        </button>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>
        {/* Başlık */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
            Planınızı Seçin
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "24px" }}>
            Deneme süreniz doldu. Kullanmaya devam etmek için bir plan seçin.
          </p>

          {/* Aylık / Yıllık toggle */}
          <div style={{ display: "inline-flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setYillik(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                background: !yillik ? "white" : "transparent",
                color: !yillik ? "#111827" : "#6b7280",
                boxShadow: !yillik ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setYillik(true)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: yillik ? "white" : "transparent",
                color: yillik ? "#111827" : "#6b7280",
                boxShadow: yillik ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Yıllık
              <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
                2 ay ücretsiz
              </span>
            </button>
          </div>
        </div>

        {/* Hata mesajı */}
        {hata && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px", textAlign: "center", fontSize: "14px", color: "#dc2626" }}>
            {hata}
          </div>
        )}

        {/* Paket kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {paketler.map((paket) => (
            <div
              key={paket.ad}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                border: paket.vurgu ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                position: "relative",
                boxShadow: paket.vurgu ? "0 20px 40px rgba(79,70,229,0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {paket.rozet && (
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)" }}>
                  <span style={{ background: "#4f46e5", color: "white", padding: "4px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                    {paket.rozet}
                  </span>
                </div>
              )}

              <p style={{ fontSize: "13px", fontWeight: 700, color: paket.vurgu ? "#4f46e5" : "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {paket.ad}
              </p>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", margin: "12px 0 4px 0" }}>
                <span style={{ fontSize: "40px", fontWeight: 800, color: "#111827" }}>
                  ₺{yillik ? Math.round(paket.yillik / 12) : paket.aylik}
                </span>
                <span style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>/ay</span>
              </div>

              {yillik && (
                <p style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, marginBottom: "4px" }}>
                  Yıllık ₺{paket.yillik} — 2 ay ücretsiz
                </p>
              )}

              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>{paket.aciklama}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                {paket.ozellikler.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#374151" }}>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void handlePaketSec(paket.planType)}
                disabled={yukleniyor !== null}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: yukleniyor !== null ? "not-allowed" : "pointer",
                  background: paket.vurgu ? "#4f46e5" : "#111827",
                  color: "white",
                  opacity: yukleniyor !== null && yukleniyor !== paket.planType ? 0.5 : 1,
                }}
              >
                {yukleniyor === paket.planType ? "Yükleniyor..." : "Bu Planı Seç"}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "32px" }}>
          Sorularınız için{" "}
          <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>
            destek@tamirtakip.com.tr
          </a>{" "}
          adresine yazabilirsiniz.
        </p>
      </div>

      {/* PayTR iFrame Modal */}
      {iframeToken && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIframeToken(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>Güvenli Ödeme</span>
              <button
                type="button"
                onClick={() => setIframeToken(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* PayTR iFrame */}
            <script src="https://www.paytr.com/js/iframeResizer.min.js" async />
            <iframe
              src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
              id="paytriframe"
              frameBorder={0}
              scrolling="no"
              style={{ width: "100%", minHeight: "500px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
