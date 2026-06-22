"use client";
import Link from "next/link";

export default function SatisSozlesmesiPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif", color: "#111827", lineHeight: 1.7 }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/landing" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px" }}>← Ana Sayfaya Dön</Link>
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Mesafeli Satış Sözleşmesi</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Son güncelleme: Haziran 2026</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>1. Taraflar</h2>
      <p><strong>Satıcı:</strong> KCLabs / TamirTakip, İzmir / Türkiye, destek@tamirtakip.com.tr, +90 537 766 42 48</p>
      <p><strong>Alıcı:</strong> Abonelik formunu dolduran ve ödemeyi gerçekleştiren gerçek veya tüzel kişi.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>2. Konu</h2>
      <p>İşbu sözleşme, TamirTakip yazılım hizmetinin (SaaS) aylık veya yıllık abonelik modeliyle sunulmasına ilişkin koşulları düzenlemektedir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>3. Hizmet Kapsamı</h2>
      <p>TamirTakip; cihaz kayıt ve takip, müşteri yönetimi, WhatsApp bildirim entegrasyonu, stok yönetimi, raporlama ve yapay zeka destekli özellikler sunan bulut tabanlı bir teknik servis yönetim yazılımıdır. Hizmet, internet bağlantısı olan her cihazdan web tarayıcısı üzerinden erişilebilir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>4. Hizmet Teslimi</h2>
      <p>Ödemenin onaylanmasının ardından abonelik hesabınız anında aktive edilir. Fiziksel teslimat söz konusu değildir; hizmet tamamen dijital ortamda sunulmaktadır. Aktivasyon e-posta ile bildirilir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>5. Ücretlendirme ve Ödeme</h2>
      <p>Abonelik ücretleri seçilen plana ve ödeme periyoduna (aylık/yıllık) göre belirlenir. Güncel fiyatlar <Link href="/landing#fiyatlandirma" style={{ color: "#4f46e5" }}>fiyatlandırma sayfasında</Link> yer almaktadır. Ödemeler PayTR altyapısı üzerinden güvenli şekilde gerçekleştirilir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>6. Abonelik Yenileme ve İptal</h2>
      <p>Abonelikler seçilen periyot sonunda otomatik olarak yenilenir. İptal talebinizi abonelik bitiş tarihinden en az 3 gün önce destek@tamirtakip.com.tr adresine iletmeniz gerekmektedir. İptal sonrasında mevcut abonelik dönemi sonuna kadar hizmetten yararlanmaya devam edebilirsiniz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>7. İptal ve İade</h2>
      <p>Dijital hizmet niteliğinde olduğundan, hizmetin kullanımına başlanması halinde cayma hakkı kullanılamaz. Ancak ilk 30 günlük deneme sürecinde herhangi bir ücret alınmamaktadır. Teknik aksaklık kaynaklı mağduriyetlerde iade veya telafi değerlendirmesi yapılır. Detaylar için <Link href="/iade-politikasi" style={{ color: "#4f46e5" }}>İade Politikası</Link> sayfamızı inceleyiniz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>8. Gizlilik ve Veri Güvenliği</h2>
      <p>Kullanıcıya ait veriler şifreli olarak saklanır ve üçüncü taraflarla paylaşılmaz. Detaylar için <Link href="/gizlilik-politikasi" style={{ color: "#4f46e5" }}>Gizlilik Politikası</Link> ve <Link href="/kvkk" style={{ color: "#4f46e5" }}>KVKK Aydınlatma Metni</Link> sayfalarımızı inceleyiniz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>9. Uyuşmazlık Çözümü</h2>
      <p>İşbu sözleşmeden doğacak uyuşmazlıklarda İzmir Mahkemeleri ve İcra Daireleri yetkilidir. Tüketici uyuşmazlıklarında İzmir Tüketici Hakem Heyeti&apos;ne başvurulabilir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>10. İletişim</h2>
      <p>Her türlü soru ve talebiniz için: <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a> | +90 537 766 42 48</p>
    </div>
  );
}
