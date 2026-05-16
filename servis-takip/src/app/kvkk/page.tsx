import Link from "next/link";

export default function KVKKPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ marginBottom: "40px" }}>
        <Link href="/landing" style={{ color: "#4f46e5", fontSize: "14px", textDecoration: "none" }}>
          ← Ana Sayfaya Dön
        </Link>
      </div>

      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
        KVKK Aydınlatma Metni
      </h1>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "40px" }}>
        Son güncelleme: {new Date().getFullYear()}
      </p>

      {[
        {
          baslik: "1. Veri Sorumlusu",
          icerik: `TamirTakip olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz. Bu aydınlatma metni, hangi kişisel verilerinizi, hangi amaçlarla, nasıl işlediğimizi açıklamak amacıyla hazırlanmıştır.`,
        },
        {
          baslik: "2. İşlenen Kişisel Veriler",
          icerik: `Platformumuzu kullandığınızda aşağıdaki kişisel verileriniz işlenebilir:\n\n• Kimlik bilgileri: Ad, soyad\n• İletişim bilgileri: E-posta adresi, telefon numarası\n• İşletme bilgileri: Dükkan/şirket adı, adresi\n• Teknik veriler: IP adresi, tarayıcı bilgisi, oturum verileri\n• İşlem verileri: Servis kayıtları, müşteri bilgileri, cihaz bilgileri`,
        },
        {
          baslik: "3. Kişisel Verilerin İşlenme Amaçları",
          icerik: `Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:\n\n• Hesap oluşturma ve kimlik doğrulama\n• Platform hizmetlerinin sunulması\n• Teknik destek ve müşteri hizmetleri\n• Hizmet kalitesinin iyileştirilmesi\n• Yasal yükümlülüklerin yerine getirilmesi\n• Güvenlik ve dolandırıcılık önleme`,
        },
        {
          baslik: "4. Kişisel Verilerin Aktarılması",
          icerik: `Kişisel verileriniz; hizmet altyapımızı sağlayan üçüncü taraf bulut hizmet sağlayıcılarına (Supabase, Vercel), ödeme altyapısı sağlayıcılarına ve yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarına aktarılabilir. Bu aktarımlar KVKK'nın 8. ve 9. maddeleri çerçevesinde gerçekleştirilmektedir.`,
        },
        {
          baslik: "5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi",
          icerik: `Kişisel verileriniz; platform üzerinden kayıt formu, oturum açma işlemleri ve platform kullanımı sırasında otomatik olarak toplanmaktadır. İşlemenin hukuki sebepleri:\n\n• Sözleşmenin kurulması ve ifası (KVKK md. 5/2-c)\n• Meşru menfaat (KVKK md. 5/2-f)\n• Açık rıza (KVKK md. 5/1)`,
        },
        {
          baslik: "6. Kişisel Veri Sahibinin Hakları",
          icerik: `KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:\n\n• Kişisel verilerinizin işlenip işlenmediğini öğrenme\n• İşlenen kişisel verileriniz hakkında bilgi talep etme\n• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme\n• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme\n• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme\n• Kişisel verilerin silinmesini veya yok edilmesini isteme\n• İşlemenin otomatik sistemler aracılığıyla gerçekleştirilmesi halinde aleyhinize sonuç doğurmasına itiraz etme\n• Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme`,
        },
        {
          baslik: "7. Veri Güvenliği",
          icerik: `Kişisel verilerinizin güvenliği için teknik ve idari tedbirler alınmaktadır. Verileriniz şifreli olarak saklanmakta, her dükkanın verileri birbirinden tamamen bağımsız tutulmaktadır. Yetkisiz erişimi önlemek için endüstri standardı güvenlik protokolleri uygulanmaktadır.`,
        },
        {
          baslik: "8. Çerezler (Cookies)",
          icerik: `Platformumuz, hizmetlerin sunulması ve kullanıcı deneyiminin iyileştirilmesi amacıyla çerezler kullanmaktadır. Zorunlu çerezler oturum yönetimi için kullanılmakta olup devre dışı bırakılması halinde platform işlevselliği etkilenebilir.`,
        },
        {
          baslik: "9. İletişim",
          icerik: `KVKK kapsamındaki haklarınızı kullanmak veya sorularınız için bizimle iletişime geçebilirsiniz:\n\nE-posta: destek@tamirtakip.com.tr`,
        },
      ].map((bolum) => (
        <div key={bolum.baslik} style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
            {bolum.baslik}
          </h2>
          <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", whiteSpace: "pre-line", margin: 0 }}>
            {bolum.icerik}
          </p>
        </div>
      ))}

      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "32px", marginTop: "40px" }}>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>
          Bu metin bilgilendirme amaçlıdır. Hukuki danışmanlık niteliği taşımaz.
        </p>
      </div>
    </div>
  );
}
