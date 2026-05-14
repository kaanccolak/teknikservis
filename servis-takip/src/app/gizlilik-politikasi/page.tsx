/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gizlilik Politikası — TamirTakip",
}

export default function GizlilikPolitikasiPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", lineHeight: "1.7", color: "#374151" }}>
      <div style={{ marginBottom: "32px" }}>
        <a href="/landing" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px" }}>← TamirTakip'e Dön</a>
      </div>

      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>Gizlilik Politikası</h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>Son güncelleme: Mayıs 2026</p>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>1. Giriş</h2>
        <p>TamirTakip ("biz", "uygulama") olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, tamirtakip.com.tr adresindeki hizmetimizi kullanırken toplanan, kullanılan ve paylaşılan verileri açıklamaktadır.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>2. Topladığımız Veriler</h2>
        <p>Hizmetimizi kullanırken aşağıdaki verileri toplayabiliriz:</p>
        <ul style={{ paddingLeft: "24px", marginTop: "12px" }}>
          <li><strong>Hesap bilgileri:</strong> E-posta adresi, şirket adı</li>
          <li><strong>Servis kayıtları:</strong> Müşteri adı, telefon numarası, cihaz bilgileri</li>
          <li><strong>Google Kişiler (isteğe bağlı):</strong> Google hesabınızı bağladığınızda, müşteri kayıtlarını Google Kişiler'e aktarmak amacıyla Kişiler API'sine erişim talep edilir</li>
          <li><strong>Kullanım verileri:</strong> Uygulama içi işlemler ve loglar</li>
        </ul>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>3. Google Kullanıcı Verilerinin Kullanımı</h2>
        <p>TamirTakip, Google API'lerinden aldığı verileri yalnızca şu amaçlarla kullanır:</p>
        <ul style={{ paddingLeft: "24px", marginTop: "12px" }}>
          <li>Servis kayıtlarındaki müşteri bilgilerini Google Kişiler'e aktarmak</li>
          <li>Müşteri bilgilerini telefon rehberinizle senkronize etmek</li>
        </ul>
        <p style={{ marginTop: "12px" }}>Google'dan aldığımız veriler hiçbir şekilde üçüncü taraflarla paylaşılmaz, reklam amaçlı kullanılmaz veya başka uygulamalarla satılmaz.</p>
        <p style={{ marginTop: "12px" }}>Google API Hizmetleri Kullanıcı Verisi Politikası'na (<a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#4f46e5" }}>Google API Services User Data Policy</a>) uyum sağlamaktayız.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>4. Verilerin Saklanması</h2>
        <p>Verileriniz güvenli sunucularda saklanmaktadır. Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Servis kayıtları yalnızca sizin dükkanınıza ait olup diğer kullanıcılarla paylaşılmaz.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>5. Üçüncü Taraf Hizmetler</h2>
        <p>Hizmetimiz aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:</p>
        <ul style={{ paddingLeft: "24px", marginTop: "12px" }}>
          <li><strong>Supabase:</strong> Kimlik doğrulama ve veritabanı</li>
          <li><strong>Google Contacts API:</strong> Müşteri kişilerini senkronize etmek için (isteğe bağlı)</li>
          <li><strong>WhatsApp (Baileys):</strong> Müşteri bildirimleri için (isteğe bağlı)</li>
        </ul>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>6. Haklarınız</h2>
        <p>Kişisel verilerinize ilişkin şu haklara sahipsiniz:</p>
        <ul style={{ paddingLeft: "24px", marginTop: "12px" }}>
          <li>Verilerinize erişim talep etme</li>
          <li>Verilerinizin düzeltilmesini isteme</li>
          <li>Verilerinizin silinmesini talep etme</li>
          <li>Google bağlantısını istediğiniz zaman kesme</li>
        </ul>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>7. İletişim</h2>
        <p>Gizlilik politikamız hakkında sorularınız için:</p>
        <p style={{ marginTop: "8px" }}><strong>E-posta:</strong> <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a></p>
        <p><strong>Web:</strong> <a href="https://tamirtakip.com.tr" style={{ color: "#4f46e5" }}>tamirtakip.com.tr</a></p>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "40px 0" }} />
      <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>© 2026 TamirTakip · Tüm hakları saklıdır</p>
    </div>
  )
}
