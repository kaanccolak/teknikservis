# Servis Takip — Teknik Servis Yönetim Sistemi

## Proje Hakkında

Küçük ve orta ölçekli teknik servis dükkanları için geliştirilmiş web tabanlı iş takip uygulaması.

## Özellikler

- **Onboarding** — ilk girişte **WelcomeModal** (uygulama özeti, Tanımlar / Şirketim yönlendirmesi, güvenlik önerisi); her sayfada ilk ziyarette **PageGuideModal** (sayfaya özel rehber). Gösterim tercihleri **localStorage**’da; bir kez kapatılan modal tekrar açılmaz. Bileşenler: `src/components/onboarding/WelcomeModal.tsx`, `PageGuideModal.tsx`.
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
- Sayfadan ayrılma uyarısı (form doldurulmuşken)
- **Kayıt düzenleme**; **silme** işlemleri **yönetici parolası** ile (`src/lib/verify-settings-password.ts`), servis kaydı **soft delete** (`deletedAt`)
- Ciro takibi (günlük / haftalık / aylık / yıllık / **tarih aralığı**)
- **WhatsApp (Baileys)** — Meta WhatsApp Business API kaldırıldı; giden mesajlar **Baileys** VPS üzerinden düz metin olarak gider. Hetzner VPS (**46.62.253.209**, Ubuntu 24.04, CX23), **PM2** (`baileys-api`), oturumlar **`/opt/baileys/sessions/{shopId}/`**. Ortam: **`BAILEYS_API_URL`**, **`BAILEYS_API_KEY`**. Kütüphane: `src/lib/baileys-client.ts`; API: `/api/baileys/connect`, `/api/baileys/status`, `/api/baileys/send`, `/api/baileys/disconnect`. **`POST /api/whatsapp/send`** şablon anahtarı + parametre alır, **`buildMessage`** ile metne çevirir ve Baileys ile gönderir.
- **Şirketim** — **parola koruması** (ilk kurulumda parola oluşturma, sonraki girişlerde sorma; **sessionStorage** ile aynı oturumda tekrar sormaz). Sekmeler: Şirket bilgileri, **WhatsApp** (**“WhatsApp API” → “WhatsApp”**, pairing kodu), **Mesaj Şablonları**, **Silinen Kayıtlar**, Google Contacts, **Tanımlar** (cihaz türü/marka/model; **sidebar’dan Tanımlar kaldırıldı**), **Fiş / Nüsha Ayarları** (müşteri nüshası servis şartları / `receiptNotes`). **Yazdırma Ayarları** sekmesi kaldırıldı. Sekme şeridi mobilde **yatay kaydırılabilir**; parola alanı **16px** font (iOS zoom). VPS: `ssh root@46.62.253.209`; `pm2 logs baileys-api`, `pm2 restart baileys-api`.
- **WA Mesajları** (`/whatsapp-mesajlari`) sayfası ve sidebar menü öğesi **kaldırıldı**.
- **WhatsApp şablonları (veritabanı)** — `WaTemplate` modeli; gönderimde önce dükkanın özel metni, yoksa varsayılan. Düzenleme: Şirketim → Mesaj Şablonları; API: `GET`/`PATCH` **`/api/shop/wa-templates`**. Değişken örnekleri: `{isim}`, `{seriNo}`, `{cihaz}`, `{fiyat}`, `{neden}`.
- **Durum değişince WhatsApp** — `WA_TEMPLATES` + DB şablonu; onay sonrası `POST /api/whatsapp/send` (Baileys + müşteri telefonu / oturum hazır olduğunda)
- **Kayıt sonrası WhatsApp** — cihaz kayıt tamamlanınca `servis_teslim_alindi` için Evet/Hayır modalı; Hayır ile doğrudan servis detay
- **13 durum + ücret bildirimi** (`fiyat_bildirimi`; `sent_to_external` hariç — WA sorusu yok); metinler Meta onayı değil **`buildMessage`** ile üretilir
- Servis detay sayfasında durum rengine göre cihaz bilgileri kartı boyama
- **Servis detay** — **Onarım Tamamlandı** seçilince onarım detayı **modal**; metin kaydedilir, **Arıza ve Notlar**’da gösterilir ve düzenlenir. **Teslim Fişi** → `/teslim-fisi/[id]`. **Durum geçmişi** kaydırılabilir alan; **fiyat değişiklikleri** geçmişte (eski → yeni). **Serbest WhatsApp** mesaj kutusu.
- **Teslim fişi** (`/teslim-fisi/[id]`) — müşteri/cihaz, onarım detayı, ücret, imza, servis şartları; kullanılan parçalar bölümü **yok** (kasıtlı).
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
- **Google Contacts entegrasyonu** — yeni müşteri oluşturulunca Gmail kişilerine otomatik eklenir (`Şirketim` → Google Contacts; kişi adı: `{müşteri adı} #{kayıt numarası}`)
- **Teslim modalı** — kendisine / başkasına teslim, teslim alan kişi ve not (`deliveryType`, `deliveryPersonName`, `deliveryNote`)
- **Tüm teslim durumları** için teslim bilgisi kaydı (`delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return`)
- **Ödeme Linki Gönder** butonu (servis detay, ücret kartı) — şu an toast / bilgi; **iyzico entegrasyonu yakında**
- **Performans optimizasyonları** (bellek içi cache, paralel veritabanı sorguları)
- **Auth / Login koruması** (Supabase Auth)
- **Multi-tenant mimari** (her dükkan kendi verisini görür)
- **Landing page** — yeniden tasarlanmış: hero + dashboard mock-up, sosyal kanıt, özellik kartları, 3 adım, referanslar, fiyatlandırma, CTA, footer; **“Kullanıcılarımız ne diyor?”** başlığı
- **Demo hesabı otomatik giriş** (`/login?demo=true`)
- **Kayıt olunca otomatik Shop oluşturma** (`/api/auth/register`)
- **Şirket bazlı veri izolasyonu** (`shopId`)
- **Şifre sıfırlama** — giriş sayfasından “Şifremi unuttum”; kayıtlı e-posta kontrolü + sıfırlama bağlantısı; **`/reset-password`** ile yeni şifre
- Cari yönetiminde detay modal
- Türkçe hata mesajları (giriş ekranı)
- Production deploy ([teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app))
- **Mobil / responsive** — sidebar hamburger + drawer; dashboard grid kırılımı; cihaz sorgula tablosu yatay kaydırma; cihaz kayıt formu alta dizilim; servis detay üst butonlar sarma/kaydırma; şirketim sekme şeridi yatay kaydırma; WelcomeModal kaydırılabilir; silinen kayıtlar tablosu yatay kaydırma

### WhatsApp mantıksal şablon anahtarları

`servis_teslim_alindi`, `fiyat_bildirimi`, `onay_bekleniyor`, `onay_verildi`, `parca_bekleniyor`, `tamiri_olmuyor`, `sorun_gorulmedi`, `musteri_iade_istiyor`, `onarim_tamamlandi`, `teslim_edildi`, `teslim_tamir_olmuyor`, `teslim_sorun_gorulmedi`, `teslim_musteri_iade` — parametre sırası: `src/lib/whatsapp.ts` (`WA_TEMPLATES`, `getParams`). Gönderilen düz metin: önce **`WaTemplate`** kaydı (`/api/shop/wa-templates`), yoksa `src/app/api/whatsapp/send/route.ts` içindeki **`buildMessage`**. İkinci el: `ikinci_el_satin_alindi` (`WA_SECOND_HAND_PURCHASE`).

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
# Baileys REST (VPS)
BAILEYS_API_URL="https://..."
BAILEYS_API_KEY="..."
# Google Contacts (OAuth) — People API; örnek: .env.example
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."
NEXT_PUBLIC_APP_URL="https://teknikservis-seven.vercel.app"
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
│   │   ├── stok/
│   │   ├── servis-detay/[id]/
│   │   ├── sirketim/
│   │   └── tanimlar/         # Tanımlar UI (sidebar kaldırıldı; Şirketim sekmesinden erişim)
│   └── api/                  # REST API (baileys/*, whatsapp/send, shop/wa-templates, …)
├── middleware.ts             # Supabase auth, korumalı rotalar
├── components/
│   ├── onboarding/           # WelcomeModal, PageGuideModal
│   └── layout/               # Sidebar (mobil drawer), TopBar
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

*(Tam liste ve teslim alt durumları için bkz. `CLAUDE.md` / `src/lib/service-order-status.ts`.)*

## Prisma şema notları

- **ServiceOrder**: `deletedAt` (`DateTime?`), `repairDetails` (`String?`)
- **Shop**: `settingsPassword` (`String?`), `receiptNotes` (`String?`)
- **WaTemplate**: `shopId`, `templateName`, `message`
- **StatusLog**: `oldPrice` (`Float?`), `newPrice` (`Float?`)

## Yapılacaklar

- [x] Stok yönetimi
- [x] Cari yönetimi
- [x] Kargo fişi yazdırma
- [x] Müşteri Nüshası ve Cihaz Etiketi
- [x] Döviz kurları
- [x] Telefon normalize arama
- [x] Fiş / etiket yazdırma (tarayıcı); Şirketim’deki Yazdırma Ayarları sekmesi kaldırıldı
- [x] Kayıt düzenleme / silme
- [x] WhatsApp (Baileys VPS + `buildMessage` + `POST /api/whatsapp/send`)
- [x] Baileys API route’ları (`/api/baileys/*`)
- [x] Mantıksal şablon anahtarları (13 durum + `fiyat_bildirimi` butonu)
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
- [x] Google Contacts entegrasyonu
- [x] Teslim modalı
- [ ] iyzico ödeme entegrasyonu
- [ ] Google OAuth production doğrulaması (domain alınınca)
- [ ] Google yorum linki / metin ince ayarı (`buildMessage` / `teslim_edildi`)
- [ ] SMS entegrasyonu
- [x] Mobil uyumluluk (sidebar, grid, tablolar, formlar, şirketim sekmeleri, modallar)
- [ ] Ödeme linki WhatsApp metni
- [ ] Domain bağlama

---
