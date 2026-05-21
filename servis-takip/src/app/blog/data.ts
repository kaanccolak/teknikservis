export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  content: string; // HTML string
};

export const blogPosts: BlogPost[] = [
  {
    slug: "teknik-serviste-cihaz-takibi-neden-onemli",
    title: "Teknik Serviste Cihaz Takibi Neden Önemlidir?",
    description:
      "Kağıt kayıtlardan dijital takip sistemine geçişin teknik servislere sağladığı faydalar ve dikkat edilmesi gerekenler.",
    date: "20 Mayıs 2026",
    readTime: "4 dk okuma",
    content: `
      <h2>Kağıt Kayıtların Sınırları</h2>
      <p>Teknik servisler yıllarca kağıt defterle cihaz takibi yaptı. Müşteri adı, telefon, arıza — hepsi elle yazıldı. Ancak servis büyüdükçe bu yöntem ciddi sorunlar doğurmaya başladı: kayıp kayıtlar, yanlış okumalar, müşteri şikayetleri.</p>
      <h2>Dijital Takibin Sağladığı Avantajlar</h2>
      <p>Dijital bir teknik servis takip programı kullandığınızda her cihaz için otomatik kayıt numarası oluşturulur. Müşteri telefon numarasıyla saniyeler içinde cihazın durumunu sorgulayabilirsiniz. Hangi cihazın rafta beklediğini, hangisinin tamirde olduğunu tek ekrandan görürsünüz.</p>
      <p>Bunun yanı sıra WhatsApp entegrasyonu sayesinde müşteriyi manuel aramak yerine tek tıkla bilgilendirme mesajı gönderebilirsiniz. Bu hem zamandan tasarruf sağlar hem de müşteri memnuniyetini artırır.</p>
      <h2>Cihaz Takibinde Olmazsa Olmazlar</h2>
      <ul>
        <li>Otomatik kayıt numarası üretimi</li>
        <li>Müşteri bilgileri ve cihaz geçmişi</li>
        <li>Durum güncellemeleri (teslim alındı, tamirde, teslim edildi)</li>
        <li>Garanti takibi</li>
        <li>Servis fişi ve etiket çıktısı</li>
      </ul>
      <h2>Sonuç</h2>
      <p>Teknik servis takip yazılımı artık bir lüks değil, rekabetçi kalabilmek için zorunlu bir araç. Doğru yazılımla hem iş süreçlerinizi hızlandırır hem de müşteri memnuniyetini artırırsınız.</p>
    `,
  },
  {
    slug: "teknik-servis-yazilimi-nasil-secilir",
    title: "Teknik Servis Yazılımı Seçerken Sorulması Gereken 5 Soru",
    description:
      "Teknik servisiniz için doğru yazılımı seçmeden önce bu 5 soruyu kendinize sorun.",
    date: "18 Mayıs 2026",
    readTime: "3 dk okuma",
    content: `
      <h2>1. Kurulum gerektiriyor mu?</h2>
      <p>Bilgisayara kurulum gerektiren yazılımlar güncelleme, yedekleme ve teknik destek açısından ciddi yük oluşturur. Bulut tabanlı (web üzerinden çalışan) yazılımlar her cihazdan erişim sağlar, otomatik güncellenir ve verileriniz güvende kalır.</p>
      <h2>2. WhatsApp entegrasyonu var mı?</h2>
      <p>Türkiye'de müşteri iletişiminin büyük çoğunluğu WhatsApp üzerinden yürüyor. Cihaz durumu değiştiğinde müşteriye otomatik veya tek tıkla mesaj gönderebilmek büyük zaman tasarrufu sağlar.</p>
      <h2>3. Fiş ve etiket çıktısı alınabiliyor mu?</h2>
      <p>Müşteri teslim fişi, servis fişi ve cihaz etiketi profesyonel bir servisin temel gereksinimleridir. Yazılımın bu çıktıları destekleyip desteklemediğini mutlaka kontrol edin.</p>
      <h2>4. Personel yönetimi var mı?</h2>
      <p>Birden fazla çalışanınız varsa kimin hangi cihazla ilgilendiğini takip etmek önemlidir. İş atama, yetki yönetimi ve personel bazlı raporlama sunan yazılımları tercih edin.</p>
      <h2>5. Fiyatlandırma şeffaf mı?</h2>
      <p>Gizli ücretler, kurulum bedeli veya zorunlu eğitim paketi gibi kalemler gerçek maliyeti artırır. Aylık sabit ücretle çalışan, ek maliyet içermeyen yazılımları tercih edin.</p>
    `,
  },
  {
    slug: "whatsapp-musteri-bilgilendirme",
    title: "Teknik Serviste WhatsApp ile Müşteri Bilgilendirme Sistemi",
    description:
      "Müşterilerinizi cihaz durumu hakkında WhatsApp ile otomatik bilgilendirmenin yolları.",
    date: "15 Mayıs 2026",
    readTime: "3 dk okuma",
    content: `
      <h2>Müşteriler Neden Arar?</h2>
      <p>Teknik servis sahiplerinin en büyük şikayetlerinden biri sürekli gelen "cihazım ne oldu?" telefonlarıdır. Bu aramalar hem zaman çalar hem de tamirci müşteri ilişkilerini zorlaştırır.</p>
      <h2>WhatsApp Bildiriminin Önemi</h2>
      <p>Müşteri cihazını bıraktığında, fiyat verildiğinde, tamir tamamlandığında veya cihaz teslime hazır olduğunda otomatik WhatsApp mesajı göndermek bu sorunun köklü çözümüdür. Müşteri bilgilendirildiği için aramaz, siz de işinize odaklanırsınız.</p>
      <h2>Şablon Mesajların Gücü</h2>
      <p>Önceden hazırlanmış mesaj şablonları sayesinde her durum için farklı ve profesyonel mesajlar hazırlayabilirsiniz. "Cihazınız teslim alındı", "Tamir tamamlandı, ₺X ücret çıktı" gibi şablonlar tek tıkla gönderilebilir.</p>
      <h2>Sonuç</h2>
      <p>WhatsApp entegrasyonu olan bir teknik servis yazılımı kullanmak müşteri memnuniyetini artırırken iş yükünüzü önemli ölçüde azaltır. Modern teknik servisler için artık vazgeçilmez bir özellik haline gelmiştir.</p>
    `,
  },
  {
    slug: "ikinci-el-telefon-alim-satim-takibi",
    title: "İkinci El Telefon Alım Satımında Kayıt Tutmanın Önemi",
    description:
      "İkinci el cihaz alım satımı yapan servisler için dijital kayıt tutmanın faydaları ve yasal önemi.",
    date: "12 Mayıs 2026",
    readTime: "4 dk okuma",
    content: `
      <h2>İkinci El Cihaz Alımında Riskler</h2>
      <p>İkinci el telefon ve elektronik cihaz alım satımı teknik servisler için önemli bir gelir kapısıdır. Ancak bu süreçte satıcı bilgilerinin, cihaz özelliklerinin ve alım fiyatının kayıt altına alınmaması ciddi riskler doğurabilir.</p>
      <h2>Satıcı Bilgilerinin Kayıt Altına Alınması</h2>
      <p>Ad soyad, telefon numarası ve TC kimlik bilgilerinin kayıt edilmesi hem güven ortamı sağlar hem de olası anlaşmazlıklarda kanıt niteliği taşır. Aynı zamanda Google Contacts entegrasyonu sayesinde bu bilgiler otomatik olarak rehberinize eklenebilir.</p>
      <h2>Dijital Alım Fişi</h2>
      <p>Her alım için otomatik oluşturulan kayıt numarası ve alım fişi profesyonellik göstergesidir. Müşterinize anında fatura/fiş sunabilmek güveni artırır.</p>
      <h2>Stok ve Satış Takibi</h2>
      <p>Aldığınız cihazların stokta mı yoksa satılmış mı olduğunu takip etmek, kar/zarar hesabı yapmak ve raporlamak için dijital sistem kullanmak büyük kolaylık sağlar.</p>
    `,
  },
  {
    slug: "kagit-kayittan-dijitale-gecis",
    title: "Kağıt Kayıttan Dijitale Geçiş: Teknik Servisler İçin Rehber",
    description:
      "Kağıt defter kullanan teknik servislerin dijital sisteme geçişte bilmesi gerekenler.",
    date: "8 Mayıs 2026",
    readTime: "5 dk okuma",
    content: `
      <h2>Neden Dijitale Geçmeli?</h2>
      <p>Kağıt defter onlarca yıldır teknik servislerin vazgeçilmezi oldu. Ancak artan rekabet, müşteri beklentileri ve iş hacmi kağıt sistemlerin sınırlarını açıkça ortaya koyuyor.</p>
      <h2>Geçişin Önündeki Engeller</h2>
      <p>Çoğu servis sahibi dijitale geçişi karmaşık ve pahalı bir süreç olarak görüyor. Oysa modern bulut tabanlı yazılımlar kurulum gerektirmez, aylık makul ücretlerle sunulur ve birkaç saatte öğrenilebilir.</p>
      <h2>Geçiş Süreci Nasıl Olmalı?</h2>
      <ul>
        <li><strong>1. Hafta:</strong> Yeni kayıtları dijital sisteme girin, kağıt defteri paralel tutun</li>
        <li><strong>2-3. Hafta:</strong> Sisteme alışın, şablonlarınızı oluşturun</li>
        <li><strong>1. Ay sonu:</strong> Tamamen dijitale geçin</li>
      </ul>
      <h2>Ne Kazanırsınız?</h2>
      <p>Dijitale geçen servisler ortalama günde 1-2 saat tasarruf sağlıyor. Müşteri aramalarını azaltıyor, kayıp cihaz riskini ortadan kaldırıyor ve profesyonel görünüm kazanıyor.</p>
      <h2>Başlamak İçin Ne Gerekli?</h2>
      <p>Sadece internet bağlantısı olan bir cihaz yeterli. TamirTakip gibi bulut tabanlı bir yazılımla bugün başlayabilirsiniz.</p>
    `,
  },
];
