export default function IadePolitikasiPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>İade Politikası</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>Son güncelleme: Mayıs 2026</p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Abonelik İptali</h2>
      <p style={{ marginBottom: "24px", lineHeight: 1.7 }}>
        TamirTakip aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi mevcut fatura döneminin sonunda geçerli olur. İptal tarihinden sonraki dönem için ücret alınmaz.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>İade Koşulları</h2>
      <p style={{ marginBottom: "24px", lineHeight: 1.7 }}>
        Abonelik başlangıcından itibaren 14 gün içinde talepte bulunulması halinde ücretin tamamı iade edilir. 14 günlük süre dolduktan sonra yapılan iade talepleri değerlendirmeye alınmaz.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>İade Talebi</h2>
      <p style={{ marginBottom: "24px", lineHeight: 1.7 }}>
        İade talebiniz için <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a> adresine e-posta gönderin.
      </p>
    </div>
  );
}
