"use client";

const paketler = [
  {
    ad: "Basic",
    fiyat: "₺100",
    aciklama: "Küçük ve tek kişilik servisler için ideal başlangıç.",
    renk: "border-slate-200",
    butonRenk: "bg-slate-900 text-white hover:bg-slate-700",
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
  },
  {
    ad: "Premium",
    fiyat: "₺180",
    aciklama: "Büyüyen servisler için ekip ve analiz özellikleri.",
    renk: "border-indigo-600 border-2",
    butonRenk: "bg-indigo-600 text-white hover:bg-indigo-500",
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
  },
  {
    ad: "Enterprise",
    fiyat: "₺280",
    aciklama: "Çok personelli ve büyük servisler için tam güç.",
    renk: "border-slate-200",
    butonRenk: "bg-slate-900 text-white hover:bg-slate-700",
    ozellikler: [
      "Tüm Premium Paket İçeriği",
      "İş emirleri modülü",
      "Sınırsız personel",
      "Haftalık rapor e-postası",
      "Öncelikli destek",
    ],
    planType: "enterprise",
  },
];

export default function PaketSecPage() {
  async function handlePaketSec(planType: string) {
    // İleride ödeme sistemi burada devreye girecek
    // Şimdilik bilgi mesajı göster
    alert(`"${planType}" paketi seçtiniz. Ödeme sistemi yakında aktif olacak. Ekibimiz sizinle iletişime geçecek.`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "48px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Başlık */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
            Planınızı Seçin
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280" }}>
            Deneme süreniz doldu. Kullanmaya devam etmek için bir plan seçin.
          </p>
        </div>

        {/* Paket kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {paketler.map((paket) => (
            <div
              key={paket.ad}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                border: paket.ad === "Premium" ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                position: "relative",
                boxShadow: paket.ad === "Premium" ? "0 20px 40px rgba(79,70,229,0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {paket.rozet && (
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)" }}>
                  <span style={{ background: "#4f46e5", color: "white", padding: "4px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                    {paket.rozet}
                  </span>
                </div>
              )}
              <p style={{ fontSize: "13px", fontWeight: 700, color: paket.ad === "Premium" ? "#4f46e5" : "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {paket.ad}
              </p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", margin: "12px 0 4px 0" }}>
                <span style={{ fontSize: "40px", fontWeight: 800, color: "#111827" }}>{paket.fiyat}</span>
                <span style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>/ay</span>
              </div>
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
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: paket.ad === "Premium" ? "#4f46e5" : "#111827",
                  color: "white",
                }}
              >
                Bu Planı Seç
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "32px" }}>
          Sorularınız için <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a> adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}
