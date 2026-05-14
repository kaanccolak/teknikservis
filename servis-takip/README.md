# Servis Takip — Teknik Servis Yönetim Sistemi

## Proje Hakkında

Küçük ve orta ölçekli teknik servis dükkanları için geliştirilmiş web tabanlı iş takip uygulaması.

**Canlı site:** [https://www.tamirtakip.com.tr](https://www.tamirtakip.com.tr) (DNS İsimtescil, barındırma Vercel; Google Search Console + sitemap).

## Özellikler

- **Onboarding** — ilk girişte **WelcomeModal**; sayfa bazında **PageGuideModal**; tercihler **localStorage** (`src/components/onboarding/`).
- **Admin paneli** — yalnızca **`kaanccolak@gmail.com`**; giriş/kayıt sonrası otomatik **`/admin`**. **`GET /api/admin/stats`**: dükkan listesi, özet sayılar, her dükkan için **bu ayki kayıt sayısı** ve **Baileys** `getSessionStatus` ile **WA durumu**. **`DELETE /api/admin/shops/[id]`** ile dükkan silme. **`getOrCreateDefaultShop()`** bu e-posta için dükkan oluşturmaz.
- **Otomatik hatırlatma (cron)** — **`POST /api/cron/remind-waiting`**; Bearer **`CRON_SECRET`**. **15+ gün** teslim alınmamış kayıtlar için WhatsApp (Baileys); durumlar: `customer_return`, `repair_failed`, `completed`, `no_problem_found`; **`reminderSentAt`** ile en az 15 günde bir tekrar; çalıştırma başına **max 10** kayıt; mesajlar arası **5 sn**. VPS örnek: `0 10 * * * curl -X POST https://www.tamirtakip.com.tr/api/cron/remind-waiting` (Authorization header). Liste: `crontab -l`.
- **Barkod tarama** — **`src/components/barcode-scanner.tsx`** (`@zxing/browser`, kamera). **Cihaz Sorgula**, **Bekleyen Cihazlar**, **İkinci El** sayfalarında kamera ikonu; mobil Chrome / Safari hedefi. **Zoom** (+/−) destekleyen cihazlarda; destek yoksa kontroller gizlenir; uygun donanımda başlangıçta **minimum zoom** (geniş açı). Tarama çerçevesi yaklaşık **%90 × %40** (yatay barkodlar).
- **QR kod (müşteri nüshası)** — **`react-qr-code`**; **`src/app/fis/[id]/page.tsx`** barkodun altında; QR → **`https://tamirtakip.com.tr/sorgula?kayitNo=...&telefon=...`** ile doğrudan müşteri sorgulama.
- **SEO** — **`src/app/sitemap.ts`**, **`src/app/robots.ts`**, **`src/app/icon.tsx`** (favicon); kök ve **landing** metadata (OpenGraph, Twitter). Landing: **H1**, **SSS**, **“Kimler Kullanabilir?”**. PageSpeed (referans): Performans / SEO / En iyi uygulamalar **100**, Erişilebilirlik **94**.
- **Logo** — indigo `#4f46e5` kare + **T** + yeşil `#22c55e` onay; **tamir**/**takip** tipografi; navbar, sidebar, login, landing.
- **Bekleyen Cihazlar** — varsayılan durum filtresi: `completed`, `waiting_approval`, `approval_given`, `waiting_part`, `repair_failed`, `no_problem_found`, `customer_return_request`, `sent_to_external`. **`reminderSentAt`** etiketi (cron sonrası).
- **Demo salt okunur** — **`src/lib/demo-guard.ts`**, **`/api/demo/unlock`** / **`/api/demo/lock`**, **`demo-banner.tsx`**, cookie **`demo_unlocked`**; demo şifresi **`Kaanky316293!`**. **`/sirketim`** `isDemo` iken parola / WA / şablon kısıtları.
- **Müşteri durum sorgulama** (`/sorgula`, şifre gerektirmez) — kayıt no + telefon ile kayıt özeti; **tamir olmuyor** durumunda **tamir olmama nedeni** gösterimi
- Cihaz kayıt ve takip; **cihaz türü / marka / model** alanlarında **“+”** ile modal üzerinden **anında tanım ekleme** ve otomatik seçim (Tanımlar sayfasına gitmeden)
- Müşteri yönetimi
- Cari yönetimi (firma/müşteri kaydı, cari kodu: C202605001 formatı)
- Bayiler modülü (firma adı, yetkili kişi, telefon, vergi bilgileri)
- Bayi detay sayfası (cihaz geçmişi, toplam ciro, onarım istatistikleri)
- **Bayi toplam ciro** — yalnızca tamamlanmış ve teslim durumlarındaki servis kayıtlarının ücret toplamı: `completed`, `delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return` (`GET /api/bayiler` ve `GET /api/bayiler/[id]` aynı filtre; cihaz adedi tüm kayıtlar)
- Servis durumu güncelleme (Teknik Serviste, Onay Bekliyor, Onay Verildi, Parça Bekliyor, Onarım Tamamlandı, Teslim Edildi)
- Otomatik kayıt numarası (YYYYMM001 formatı); **dükkan bazında** (`allocateServiceOrderNumber` + `shopId`); silinmiş kayıtların numaraları yeniden kullanılmaz
- Cihaz türü, marka ve model tanım yönetimi; **Şirketim → Tanımlar** içinde satır içi **Düzenle** (Kaydet/İptal) ve **PATCH** API’leri (`/api/device-types/[id]`, `/api/brands/[id]`, `/api/models/[id]`)
- **Yedek parça stok yönetimi** (cihaz türü / marka / modele göre filtreleme)
- **Kayıtta kullanılan parça takibi** ve otomatik stok düşme (iptal/silmede iade)
- **Müşteri Nüshası (servis giriş fişi) ve Cihaz Etiketi yazdırma** (tarayıcı yazdır / PDF kaydet); müşteri nüshu sayfasında **QR kod** (`react-qr-code`) ile sorgulama bağlantısı
- **Kargo gönderi fişi yazdırma** (cari bazında)
- **Raporlar sayfası** (servis, finansal, ikinci el — sekme yapısı)
- **Döviz kurları** — **`GET /api/exchange-rates`** (`src/app/api/exchange-rates/route.ts`): **TCMB** resmi XML **`https://www.tcmb.gov.tr/kurlar/today.xml`**; hata/parse durumunda **fallback** **`open.er-api.com`**. Dashboard’da gösterim; istemci ~10 dakikada bir günceller.
- Ciro maskeleme (göster/gizle butonu)
- Cihaz kayıt formunda geçmiş müşteri arama ve otomatik doldurma
- Cihaz kayıtta bayi seçimi ve otomatik müşteri bilgisi doldurma
- Telefon numarası normalize arama (537, 0537, 5377664248 gibi)
- Telefon numarası formatlama (+90 5XX XXX XX XX)
- Arama filtresi URL'de saklanır, geri dönünce kaybolmaz
- Sayfadan ayrılma uyarısı (form doldurulmuşken)
- **Kayıt düzenleme**; **silme** işlemleri **yönetici parolası** ile (`src/lib/verify-settings-password.ts`), servis kaydı **soft delete** (`deletedAt`). **Silme onayı:** `pendingDeleteId` yarışı giderildi; AlertDialog’da silinecek **id** yerelde tutulur (bayiler, stok, cari, ikinci el, dış servis, planlarım, cihaz sorgula, servis detay); React DevTools kapalıyken de güvenilir.
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
- **Google Contacts entegrasyonu** — yeni müşteri oluşturulunca Gmail kişilerine otomatik eklenir (`Şirketim` → Google Contacts; kişi adı: `{müşteri adı} #{kayıt numarası}`). **Google Cloud Console**’da uygulama **doğrulanmış**; OAuth akışında “doğrulanmamış uygulama” uyarısı yok.
- **Teslim modalı** — kendisine / başkasına teslim, teslim alan kişi ve not (`deliveryType`, `deliveryPersonName`, `deliveryNote`)
- **Tüm teslim durumları** için teslim bilgisi kaydı (`delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return`)
- **Ödeme Linki Gönder** butonu (servis detay, ücret kartı) — şu an toast / bilgi; **iyzico entegrasyonu yakında**
- **Performans optimizasyonları** (bellek içi cache, paralel veritabanı sorguları); **tanım listeleri** için cache anahtarları **shopId** bazlı (`device-types-${shopId}`, `brands-${shopId}-…`, `models-${shopId}-…`); liste API’lerinde **`dynamic = 'force-dynamic'`**; silme sonrası istemci yenilemelerinde **`cache: 'no-store'`** ve timestamp
- **Auth / Login koruması** (Supabase Auth)
- **Multi-tenant mimari** (her dükkan kendi verisini görür)
- **Landing page** — yeniden tasarlanmış içerik (`src/app/landing/page.tsx`, **`'use client'`**); **SEO metadata** `src/app/landing/layout.tsx` içinde. Hero, mock-up, özellikler, SSS, “Kimler Kullanabilir?”, fiyatlandırma, CTA; **“Kullanıcılarımız ne diyor?”** başlığı; **footer** linkleri: **`/gizlilik-politikasi`**, **`/hizmet-sartlari`**
- **Demo hesabı otomatik giriş** (`/login?demo=true`)
- **Kayıt olunca otomatik Shop oluşturma** (`/api/auth/register`)
- **Şirket bazlı veri izolasyonu** (`shopId`)
- **Şifre sıfırlama** — giriş sayfasından “Şifremi unuttum”; kayıtlı e-posta kontrolü + sıfırlama bağlantısı; üretim **`redirectTo`**: **`https://www.tamirtakip.com.tr/reset-password`**; **`/reset-password`** ile yeni şifre. Supabase **Site URL**: **`https://www.tamirtakip.com.tr`**. **Resend** SMTP (**EU region**; `smtp.resend.com:465`, kullanıcı `resend`, **from:** `noreply@tamirtakip.com.tr`); şablonlar **TamirTakip** markasıyla; e-posta doğrulama açık; doğrulama sonrası **`/email-dogrulama`**
- Cari yönetiminde detay modal
- Türkçe hata mesajları (giriş ekranı)
- Production deploy ([www.tamirtakip.com.tr](https://www.tamirtakip.com.tr); eski Vercel URL: [teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app))
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
# Cron (VPS — remind-waiting)
CRON_SECRET="..."
# Google Contacts (OAuth) — People API; örnek: .env.example
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."
NEXT_PUBLIC_APP_URL="https://tamirtakip.com.tr"
```

Supabase Dashboard → **Authentication → URL Configuration** içine **`/reset-password`** için tam URL ekleyin (örn. `https://www.tamirtakip.com.tr/reset-password` ve `http://localhost:3000/reset-password`). **Site URL** üretimde **`https://www.tamirtakip.com.tr`** olmalı.

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

Production’da e-posta onayını açabilirsin; redirect URL’leri ortama göre güncelle (**www.tamirtakip.com.tr** + localhost). **Resend** ile SMTP (**EU region**, `smtp.resend.com:465`); doğrulama sonrası **`/email-dogrulama`** sayfası.

## Proje Yapısı

```
src/
├── app/
│   ├── landing/              # Tanıtım (page: client; metadata: layout.tsx)
│   ├── admin/                # Yönetici paneli (yalnızca belirli e-posta)
│   ├── sorgula/              # Müşteri sorgulama (public)
│   ├── reset-password/       # Şifre sıfırlama formu (public)
│   ├── email-dogrulama/        # E-posta doğrulama sonrası landing (public)
│   ├── gizlilik-politikasi/    # Gizlilik Politikası (public)
│   ├── hizmet-sartlari/        # Hizmet Şartları (public)
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
│   └── api/                  # REST API (baileys/*, whatsapp/send, admin/*, cron/remind-waiting, demo/*, …)
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

- **ServiceOrder**: `deletedAt` (`DateTime?`), `repairDetails` (`String?`), `reminderSentAt` (`DateTime?` — cron hatırlatması); **`orderNumber`** — `@@unique([shopId, orderNumber])` (dükkan başına ayrı sıra; silinmiş kayıt numaraları tekrar kullanılmaz)
- **Bayi**: `@@unique([shopId, bayiCode])` (dükkan başına ayrı bayi kodu sırası)
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
- [x] Production deploy ([www.tamirtakip.com.tr](https://www.tamirtakip.com.tr))
- [x] Bayiler modülü
- [x] Autocomplete öneriler (şikayet / aksesuar / fiziksel hasar)
- [x] Bayi grup ve iskonto sistemi
- [x] Planlarım — tamamlandı geri al
- [x] Google Contacts entegrasyonu
- [x] Google OAuth — Cloud Console uygulama doğrulaması (doğrulanmamış uygulama uyarısı yok)
- [x] Yasal sayfalar (`/gizlilik-politikasi`, `/hizmet-sartlari`) + landing footer linkleri
- [x] Teslim modalı
- [ ] iyzico ödeme entegrasyonu
- [ ] Google yorum linki / metin ince ayarı (`buildMessage` / `teslim_edildi`)
- [ ] SMS entegrasyonu
- [x] Mobil uyumluluk (sidebar, grid, tablolar, formlar, şirketim sekmeleri, modallar)
- [ ] Ödeme linki WhatsApp metni
- [x] Admin paneli + cron hatırlatma + barkod/QR + SEO + demo salt okunur + e-posta doğrulama (`/email-dogrulama`, Resend)
- [x] Domain (**tamirtakip.com.tr**)

---
