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
    slug: "telefon-tamircileri-icin-musteri-takip-programi",
    title: "Telefon Tamircileri İçin Müşteri Takip Programı Nasıl Olmalı?",
    description:
      "Telefon tamiri yapan servisler için müşteri takip programında olması gereken özellikler ve doğru yazılım seçimi rehberi.",
    date: "21 Mayıs 2026",
    readTime: "4 dk okuma",
    content: `
    <p>Telefon tamiri yapan bir servis için müşteri takip programı, her gün onlarca cihazın kayıt, takip ve teslim sürecini yöneten temel araçtır. Doğru bir program seçmek hem zamandan tasarruf sağlar hem de müşteri memnuniyetini artırır.</p>
    <h2>Telefon Tamircisi İçin Müşteri Takip Programında Olması Gerekenler</h2>
    <p>Telefon tamircisi için tasarlanmış bir müşteri takip programı şu özelliklere sahip olmalıdır: otomatik kayıt numarası üretimi, müşteri adı ve telefon bilgisi kaydı, cihaz türü ve arıza açıklaması girişi, tamir durumu takibi ve müşteri bildirimi.</p>
    <h2>WhatsApp Entegrasyonu Neden Önemli?</h2>
    <p>Telefon tamiri müşterileri cihazları olmadan iletişim kurmakta zorlanır. WhatsApp entegrasyonlu bir takip programı sayesinde müşteriye tamir tamamlandığında, fiyat belirlendiğinde veya cihaz teslime hazır olduğunda otomatik bildirim gönderilebilir. Bu hem müşteri memnuniyetini artırır hem de gereksiz telefon aramalarını azaltır.</p>
    <h2>Bulut Tabanlı mı Masaüstü mü?</h2>
    <p>Bulut tabanlı programlar telefon tamircileri için çok daha avantajlıdır. Kurulum gerektirmez, her cihazdan erişilebilir, otomatik yedekleme yapar ve güncellemeler otomatik gelir. Masaüstü programlarda ise veri kaybı riski ve güncelleme sorunu yaşanabilir.</p>
    <h2>TamirTakip ile Telefon Tamiri Yönetimi</h2>
    <p>TamirTakip, telefon tamiri yapan servisler için özel olarak tasarlanmış bulut tabanlı bir yönetim yazılımıdır. Cihaz kaydından teslimata kadar tüm süreci dijital ortamda yönetmenizi sağlar. Otomatik kayıt numarası, WhatsApp bildirimi ve servis fişi özellikleriyle telefon tamircilerinin en çok ihtiyaç duyduğu araçları tek platformda sunar.</p>
  `,
  },
  {
    slug: "barkodlu-cihaz-takip-sistemi",
    title: "Teknik Serviste Barkodlu Cihaz Takip Sistemi Nasıl Kullanılır?",
    description:
      "Barkodlu cihaz takip sistemiyle teknik servislerde cihaz kaydını hızlandırın, kayıp cihaz riskini ortadan kaldırın.",
    date: "21 Mayıs 2026",
    readTime: "3 dk okuma",
    content: `
    <p>Barkodlu cihaz takip sistemi, teknik servislerde onlarca hatta yüzlerce cihazı aynı anda yönetmenin en etkili yoludur. Her cihaza yapıştırılan barkod etiketi sayesinde cihazın kim tarafından getirildiği, hangi arızası olduğu ve tamir durumu anında sorgulanabilir.</p>
    <h2>Barkodlu Takibin Avantajları</h2>
    <ul>
      <li>Cihaz kaydı saniyeler içinde tamamlanır</li>
      <li>Rafta bekleyen cihazlar kolayca bulunur</li>
      <li>Müşteri teslim alma sırasında hata riski sıfıra iner</li>
      <li>Yoğun dönemlerde bile düzen korunur</li>
    </ul>
    <h2>Barkod Etiketi Nasıl Oluşturulur?</h2>
    <p>TamirTakip gibi modern teknik servis yazılımları, her kayıt için otomatik olarak barkodlu etiket oluşturur. Bu etiket direkt yazıcıdan çıktı alınarak cihaza yapıştırılır. Sonraki her işlemde barkod okutularak cihaz bilgilerine anında erişilir.</p>
    <h2>Cihaz Sorgulama</h2>
    <p>Barkodlu sistemlerde müşteriler de kendi cihazlarının durumunu sorgulayabilir. Kayıt numarası veya telefon numarasıyla online sorgulama yapılabilir, bu da servis sahibinin telefon trafiğini önemli ölçüde azaltır.</p>
  `,
  },
  {
    slug: "kucuk-ev-aletleri-servis-yazilimi",
    title: "Küçük Ev Aletleri Tamiri İçin Servis Yazılımı Seçimi",
    description:
      "Beyaz eşya, küçük ev aletleri ve elektronik tamir servisleri için doğru yazılım nasıl seçilir?",
    date: "20 Mayıs 2026",
    readTime: "3 dk okuma",
    content: `
    <p>Küçük ev aletleri tamiri yapan servisler için doğru yazılım seçimi, işletmenin verimliliğini doğrudan etkiler. Blender, süpürge, ütü, kahve makinesi gibi ürünlerin tamir süreçleri telefon tamirinden farklı özellikler gerektirir.</p>
    <h2>Küçük Ev Aletleri Servislerinin İhtiyaçları</h2>
    <p>Bu tür servisler için yazılımda şu özellikler kritiktir: garanti takibi, yedek parça stok yönetimi, marka ve model bazlı kayıt, tahmini maliyet hesabı ve müşteri onayı alma.</p>
    <h2>Garanti Takibi Neden Önemli?</h2>
    <p>Küçük ev aletlerinde garanti kapsamındaki onarımlar ayrı takip edilmelidir. Yazılım bu ayrımı otomatik yapabilmeli, garanti süresi dolan cihazlar için ayrı fiyatlandırma uygulanabilmelidir.</p>
    <h2>Yedek Parça Stok Yönetimi</h2>
    <p>Küçük ev aletleri servislerinde onlarca farklı marka ve modele ait yedek parça stoku tutulur. Dijital stok takibi olmadan bu parçaları yönetmek neredeyse imkansızdır. TamirTakip'in stok modülü her parçayı servis kaydına bağlayarak otomatik stok düşümü yapar.</p>
    <h2>Sonuç</h2>
    <p>Küçük ev aletleri tamiri yapan bir servis için bulut tabanlı, garanti takibi ve stok yönetimi sunan bir yazılım seçmek uzun vadede büyük avantaj sağlar. TamirTakip bu özelliklerin tamamını tek platformda sunar.</p>
  `,
  },
  {
    slug: "online-cihaz-takip-sistemi-musteri-bildirimi",
    title: "Online Cihaz Takip Sistemi ile Müşteri Bildirimi Otomasyonu",
    description:
      "Teknik servisinizde online cihaz takip sistemi kurarak müşteri bildirimlerini otomatikleştirin, telefon trafiğini azaltın.",
    date: "19 Mayıs 2026",
    readTime: "3 dk okuma",
    content: `
    <p>Online cihaz takip sistemi, teknik servislerin en büyük sorunlarından biri olan "cihazım ne oldu?" telefon trafiğini ortadan kaldırmanın en etkili yoludur. Müşteri kendi cihazının durumunu istediği zaman online olarak sorgulayabilir.</p>
    <h2>Online Takip Sistemi Nasıl Çalışır?</h2>
    <p>Cihaz servise teslim alınırken sisteme kaydedilir ve otomatik bir kayıt numarası oluşturulur. Bu numara müşteriye verilir. Müşteri dilediği zaman servisin web sitesindeki sorgulama ekranına girerek cihazının güncel durumunu görebilir.</p>
    <h2>Otomatik Bildirim Avantajları</h2>
    <ul>
      <li>Tamir tamamlandığında otomatik WhatsApp mesajı gider</li>
      <li>Fiyat belirlendiğinde müşteri anında haberdar olur</li>
      <li>Müşteri onayı dijital ortamda alınır</li>
      <li>Teslim tarihi değişince bildirim gönderilir</li>
    </ul>
    <h2>Telefon Trafiği Nasıl Azalır?</h2>
    <p>Araştırmalar, otomatik bildirim sistemi kullanan teknik servislerin müşteri aramalarını %60-70 oranında azalttığını göstermektedir. Bu hem servis sahibinin hem de çalışanların zamanını verimli kullanmasını sağlar.</p>
    <h2>TamirTakip ile Online Takip</h2>
    <p>TamirTakip'in online sorgulama ekranı sayesinde müşterileriniz kayıt numaraları veya telefon numarasıyla cihaz durumlarını 7/24 sorgulayabilir. WhatsApp entegrasyonu ile otomatik bildirimler göndererek müşteri memnuniyetini artırabilirsiniz.</p>
  `,
  },
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
