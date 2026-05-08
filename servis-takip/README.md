# Servis Takip — Teknik Servis Yönetim Sistemi

## Proje Hakkında

Küçük ve orta ölçekli teknik servis dükkanları için geliştirilmiş web tabanlı iş takip uygulaması.

## Özellikler

- **Müşteri durum sorgulama** (`/sorgula`, şifre gerektirmez) — kayıt no + telefon ile kayıt özeti; **tamir olmuyor** durumunda **tamir olmama nedeni** gösterimi
- Cihaz kayıt ve takip
- Müşteri yönetimi
- Cari yönetimi (firma/müşteri kaydı, cari kodu: C202605001 formatı)
- Bayiler modülü (firma adı, yetkili kişi, telefon, vergi bilgileri)
- Bayi detay sayfası (cihaz geçmişi, toplam ciro, onarım istatistikleri)
- **Bayi toplam ciro** — yalnızca tamamlanmış ve teslim durumlarındaki servis kayıtlarının ücret toplamı: `completed`, `delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return` (`GET /api/bayiler` ve `GET /api/bayiler/[id]` aynı filtre; cihaz adedi tüm kayıtlar)
- Servis durumu güncelleme (Teknik Serviste, Onay Bekliyor, Onay Verildi, Parça Bekliyor, Onarım Tamamlandı, Teslim Edildi)
- Otomatik kayıt numarası (YYYYMM001 formatı)
- Cihaz türü, marka ve model tanım yönetimi
- **Yedek parça stok yönetimi** (cihaz türü / marka / modele göre filtreleme)
- **Kayıtta kullanılan parça takibi** ve otomatik stok düşme (iptal/silmede iade)
- **Müşteri Nüshası (servis giriş fişi) ve Cihaz Etiketi yazdırma** (tarayıcı yazdır / PDF kaydet)
- **Barkod entegrasyonu** (fiş ve etiketlerde)
- **Kargo gönderi fişi yazdırma** (cari bazında)
- **Raporlar sayfası** (servis, finansal, ikinci el — sekme yapısı)
- **Döviz kurları** (USD/EUR, TCMB/ExchangeRate-API) — dashboard’da gösterim; **istemci ~10 dakikada bir günceller** (gereksiz istek azaltma)
- Ciro maskeleme (göster/gizle butonu)
- Cihaz kayıt formunda geçmiş müşteri arama ve otomatik doldurma
- Cihaz kayıtta bayi seçimi ve otomatik müşteri bilgisi doldurma
- Telefon numarası normalize arama (537, 0537, 5377664248 gibi)
- Telefon numarası formatlama (+90 5XX XXX XX XX)
- Arama filtresi URL'de saklanır, geri dönünce kaybolmaz
- Yazdırma boyut ayarları (Tanımlar sayfasında)
- Sayfadan ayrılma uyarısı (form doldurulmuşken)
- **Kayıt düzenleme ve silme**
- Ciro takibi (günlük / haftalık / aylık / yıllık / **tarih aralığı**)
- **WhatsApp Business API** — şablon mesajları, ücret bildirimi (`fiyat_bildirimi`), **webhook** ile gelen mesajların kaydı
- **WA Mesajları** (`/whatsapp-mesajlari`) — gelen mesajlar, okunmamış takibi, sidebar yeşil badge, servis detayda kayıt bazlı liste
- **Durum değişince WhatsApp** — `WA_TEMPLATES` ile uyumlu şablon; onay modalı (`shop.waEnabled` + müşteri telefonu)
- **Kayıt sonrası WhatsApp** — cihaz kayıt tamamlanınca `servis_teslim_alindi` için Evet/Hayır modalı; Hayır ile doğrudan servis detay
- **13 durum şablonu** (Meta’da onaylı isimler; `sent_to_external` hariç — WA sorusu yok)
- Servis detay sayfasında durum rengine göre cihaz bilgileri kartı boyama
- Ciro hesabı StatusLog bazlı (durum geri alınınca ciro düşer)
- Ciro filtresi düzeltmesi (Bugün/Bu Hafta/Bu Ay/Bu Yıl)
- Bekleme süresi takibi (renk kodlu)
- Durum geçmişi
- Arama ve filtreleme
- Cihaz sorgulada bayi rengi ve filtresi
- CSV export
- **Enter tuşu ile form navigasyonu** — cihaz kayıt; **ikinci el alım** (`second-hand-form`), **cari** ve **bayi** formlarında aynı desen (textarea’da Shift+Enter yeni satır)
- **Şikayet/arıza, aksesuar, fiziksel hasar** alanlarında **autocomplete öneriler** (geçmiş servis kayıtlarından; cihaz türüne göre öncelik)
- **Bayi grup sistemi** (Grup 1 %10, Grup 2 %20 iskonto); bayi formu ve listesinde grup seçimi
- **Bayi grubuna göre otomatik iskonto** — servis detayda girilen brüt tutardan net hesaplanır, veritabanına **net** kaydedilir
- **Servis detayda iskonto bilgisi** — kayıtlı fiyat üzerinden brüt/iskonto/net özeti (kalıcı kutu); yazarken ayrı önizleme
- **Planlarım** — tamamlanmış planlar için **Geri Al** (`isCompleted: false`)
- **Ödeme Linki Gönder** butonu (servis detay, ücret kartı) — şimdilik bilgi modalı + toast; **iyzico entegrasyonu yakında**
- **Performans optimizasyonları** (bellek içi cache, paralel veritabanı sorguları)
- **Auth / Login koruması** (Supabase Auth)
- **Multi-tenant mimari** (her dükkan kendi verisini görür)
- **Landing page** (modern SaaS tasarımı)
- **Demo hesabı otomatik giriş** (`/login?demo=true`)
- **Kayıt olunca otomatik Shop oluşturma** (`/api/auth/register`)
- **Şirket bazlı veri izolasyonu** (`shopId`)
- **Şifre sıfırlama** — giriş sayfasından “Şifremi unuttum”; kayıtlı e-posta kontrolü + sıfırlama bağlantısı; **`/reset-password`** ile yeni şifre
- Cari yönetiminde detay modal
- Türkçe hata mesajları (giriş ekranı)
- Production deploy ([teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app))

### WhatsApp şablon adları (Meta)

`servis_teslim_alindi`, `fiyat_bildirimi`, `onay_bekleniyor`, `onay_verildi`, `parca_bekleniyor`, `tamiri_olmuyor`, `sorun_gorulmedi`, `musteri_iade_istiyor`, `onarim_tamamlandi`, `teslim_edildi`, `teslim_tamir_olmuyor`, `teslim_sorun_gorulmedi`, `teslim_musteri_iade` — eşleme ve parametreler: `src/lib/whatsapp.ts` (`WA_TEMPLATES`). İkinci el alım: `ikinci_el_satin_alindi` (`WA_SECOND_HAND_PURCHASE`).

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth)
- Prisma ORM
- Vercel (hosting)

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı

### Adımlar

1. Repoyu klonla:

```bash
git clone https://github.com/kaanccolak/teknikservis.git
cd teknikservis/servis-takip
```

2. Bağımlılıkları yükle:

```bash
npm install
```

3. `.env.local` dosyasını oluştur:

```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
# Şifre sıfırlama öncesi e-posta kontrolü (yalnızca sunucu — /api/auth/check-email)
SUPABASE_SERVICE_ROLE_KEY="..."
# Meta WhatsApp webhook doğrulama (GET hub.verify_token)
WHATSAPP_WEBHOOK_VERIFY_TOKEN="servis-takip-webhook"
```

Supabase Dashboard → **Authentication → URL Configuration** içine **`/reset-password`** için tam URL ekleyin (örn. `https://your-domain.vercel.app/reset-password` ve `http://localhost:3000/reset-password`).

4. Veritabanını oluştur:

```bash
npx prisma db push
```

İsteğe bağlı demo verisi (ilk oturumlu kullanıcıya bağlı `Shop`, `userId` dolu):

```bash
npm run seed:demo
```

5. Geliştirme sunucusunu başlat:

```bash
npm run dev
```

Üretim derlemesi: **`npm run build`** → `prisma generate && next build`.

### Supabase Auth kurulumu

Geliştirme için önerilen ayarlar:

- **Authentication → Settings → Email confirmation**: kapalı (development)
- **Site URL**: `http://localhost:3000`
- **Redirect URL**: `http://localhost:3000/api/auth/callback`

Production’da e-posta onayını açabilirsin; redirect URL’leri ortama göre güncelle.

## Proje Yapısı

```
src/
├── app/
│   ├── landing/              # Tanıtım (SaaS landing, public)
│   ├── sorgula/              # Müşteri sorgulama (public)
│   ├── reset-password/       # Şifre sıfırlama formu (public)
│   ├── (auth)/login/         # Giriş / kayıt
│   ├── (dashboard)/          # Korumalı uygulama
│   │   ├── page.tsx          # Gösterge paneli
│   │   ├── cihaz-kayit/
│   │   ├── cihaz-sorgula/
│   │   ├── bekleyen-cihazlar/
│   │   ├── raporlar/
│   │   ├── whatsapp-mesajlari/
│   │   ├── stok/
│   │   ├── servis-detay/[id]/
│   │   └── tanimlar/
│   └── api/                  # REST API (whatsapp/webhook, whatsapp/messages, …)
├── middleware.ts             # Supabase auth, korumalı rotalar
├── components/
│   └── layout/               # Sidebar, TopBar
├── lib/
│   └── supabase/
└── types/
```

## Servis Durumları

| Durum | Kod | Açıklama |
|-------|-----|----------|
| Teknik Serviste | in_service | Cihaz servise yeni geldi |
| Onay Bekliyor | waiting_approval | Müşteri onayı bekleniyor |
| Onay Verildi | approval_given | Müşteri onayladı, onarım başlayacak |
| Parça Bekliyor | waiting_part | Yedek parça bekleniyor |
| Onarım Tamamlandı | completed | Onarım bitti, teslim edilmedi |
| Teslim Edildi | delivered | Müşteriye teslim edildi |

## Yapılacaklar

- [x] Stok yönetimi
- [x] Cari yönetimi
- [x] Kargo fişi yazdırma
- [x] Müşteri Nüshası ve Cihaz Etiketi
- [x] Döviz kurları
- [x] Telefon normalize arama
- [x] Yazdırma ayarları
- [x] Kayıt düzenleme / silme
- [x] WhatsApp Business API altyapısı ve entegrasyonu
- [x] WhatsApp webhook (gelen mesajlar)
- [x] WhatsApp şablonları (13 durum şablonu + `fiyat_bildirimi` butonu)
- [x] Durum değişince WA bildirimi (onay modalı)
- [x] Auth / Login koruması
- [x] Multi-tenant geçişi
- [x] Landing page
- [x] Şifre sıfırlama (Supabase + check-email + reset-password sayfası)
- [x] Müşteri sorgulama sayfası (`/sorgula`)
- [x] Vercel build uyumu (`prisma generate`, API route `dynamic`, Suspense ile useSearchParams sayfaları)
- [x] Production deploy ([teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app))
- [x] Bayiler modülü
- [x] Autocomplete öneriler (şikayet / aksesuar / fiziksel hasar)
- [x] Bayi grup ve iskonto sistemi
- [x] Planlarım — tamamlandı geri al
- [ ] iyzico ödeme entegrasyonu
- [ ] Ödeme linki WhatsApp şablonu
- [ ] Meta Business Verification (production moda geçiş)
- [ ] Google yorum linki (`teslim_edildi` şablonuna)
- [ ] SMS entegrasyonu
- [ ] Mobil uyumluluk
- [ ] Domain bağlama

---
