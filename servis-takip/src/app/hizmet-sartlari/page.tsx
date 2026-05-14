/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hizmet Şartları — TamirTakip",
}

export default function HizmetSartlariPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", lineHeight: "1.7", color: "#374151" }}>
      <div style={{ marginBottom: "32px" }}>
        <a href="/landing" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px" }}>← TamirTakip'e Dön</a>
      </div>

      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>Hizmet Şartları</h1>
      <p style={{ color: "#6b7280", marginBottom: "40px" }}>Son güncelleme: Mayıs 2026</p>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>1. Hizmet Tanımı</h2>
        <p>TamirTakip, teknik servisler için geliştirilmiş online servis takip ve yönetim platformudur. Cihaz kayıt, durum takibi, müşteri bildirimleri ve raporlama hizmetleri sunmaktadır.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>2. Kullanım Koşulları</h2>
        <p>Hizmetimizi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:</p>
        <ul style={{ paddingLeft: "24px", marginTop: "12px" }}>
          <li>Sisteme girdiğiniz bilgilerin doğru ve güncel olduğunu</li>
          <li>Müşteri verilerini yasal mevzuata uygun şekilde işleyeceğinizi</li>
          <li>Hesap güvenliğinden sorumlu olduğunuzu</li>
          <li>Hizmeti yalnızca yasal amaçlar için kullanacağınızı</li>
        </ul>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>3. Hesap ve Güvenlik</h2>
        <p>Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmamanızı ve güçlü bir şifre belirlemenizi öneririz. Hesabınızda yetkisiz erişim tespit ederseniz derhal bizimle iletişime geçin.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>4. Veri Sorumluluğu</h2>
        <p>Sisteme girdiğiniz müşteri verileri size aittir. TamirTakip, bu verileri yalnızca hizmet sunumu amacıyla işler ve üçüncü taraflarla paylaşmaz. Verilerinizin yedeğini düzenli olarak almanızı öneririz.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>5. Hizmet Sürekliliği</h2>
        <p>Hizmetin kesintisiz çalışması için gerekli önlemleri alıyoruz. Ancak bakım, güncelleme veya teknik sorunlar nedeniyle geçici kesintiler yaşanabilir. Bu durumlarda önceden bilgilendirme yapmaya çalışırız.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>6. Ücretlendirme</h2>
        <p>TamirTakip'in fiyatlandırma politikası tamirtakip.com.tr/landing adresinde yayınlanmaktadır. Ücretlendirme değişikliklerinden önce kullanıcılar bilgilendirilir.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>7. Hizmet Sonlandırma</h2>
        <p>Hesabınızı istediğiniz zaman silebilirsiniz. Hesap silindiğinde tüm verileriniz kalıcı olarak kaldırılır. TamirTakip, şartları ihlal eden hesapları askıya alma veya sonlandırma hakkını saklı tutar.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>8. Sorumluluk Sınırı</h2>
        <p>TamirTakip, hizmetin kullanımından doğabilecek dolaylı zararlardan sorumlu tutulamaz. Veri kaybı riskine karşı düzenli yedek almanızı öneririz.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>9. Değişiklikler</h2>
        <p>Bu şartlar zaman zaman güncellenebilir. Önemli değişiklikler e-posta yoluyla bildirilir. Hizmeti kullanmaya devam etmeniz güncel şartları kabul ettiğiniz anlamına gelir.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>10. İletişim</h2>
        <p>Hizmet şartlarımız hakkında sorularınız için:</p>
        <p style={{ marginTop: "8px" }}><strong>E-posta:</strong> <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a></p>
        <p><strong>Web:</strong> <a href="https://tamirtakip.com.tr" style={{ color: "#4f46e5" }}>tamirtakip.com.tr</a></p>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "40px 0" }} />
      <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>© 2026 TamirTakip · Tüm hakları saklıdır</p>
    </div>
  )
}
