# CLAUDE.md — AI Geliştirici Rehberi

Bu dosya Claude ve Cursor gibi AI araçlarının projeyi doğru anlaması için hazırlanmıştır.

## Proje Özeti

Teknik servis dükkanları için Next.js 14 tabanlı web uygulaması. **Multi-tenant mimari**: oturum açmış kullanıcı kendi **Shop** kaydına (`Shop.userId`) bağlı veriyi görür; `shopId` ile tablo bazında izolasyon.

## Onboarding sistemi

- İlk girişte **WelcomeModal** (`src/components/onboarding/WelcomeModal.tsx`) — uygulama özeti, Hızlı Kurulum yönlendirmesi, güvenlik önerisi.
- Her sayfada ilk ziyarette **PageGuideModal** (`src/components/onboarding/PageGuideModal.tsx`) — o sayfaya özel kısa rehber.
- Hangi modal’ların gösterildiği **/api/settings** (Setting tablosu, shopId + key) ile saklanır; farklı cihazdan girişte tekrar açılmaz.

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Dil**: TypeScript
- **Stil**: Tailwind CSS + shadcn/ui
- **Veritabanı**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.22
- **Auth**: Supabase Auth (middleware ile dashboard koruması aktif)

## Önemli Kurallar

### Auth sistemi

- **Supabase Auth** kullanılıyor.
- **`src/middleware.ts`** — Dashboard rotalarını korur; `/api/*` matcher dışında (API route’lar doğrudan işlenir).
- **Herkese açık rotalar** (`publicPaths`): **`/login`**, **`/landing`**, **`/sorgula`**, **`/reset-password`**, **`/email-dogrulama`**, **`/gizlilik-politikasi`**, **`/hizmet-sartlari`**, **`/sitemap.xml`**, **`/robots.txt`**, **`/api/cron`** öneki (ör. cron endpoint’leri) ve bunların alt yolları.
- **Matcher** içinde **`/`** açıkça tanımlıdır; kök adres için middleware tetiklenir (aksi halde kök korumalı kalıp yönlendirme çalışmayabilirdi).
- **Giriş yoksa** ve rota korumalıysa → **`/landing`** yönlendirilir (login değil).
- **Giriş varken `/login`** → e-posta **`kaanccolak@gmail.com`** ise **`/admin`**, aksi halde **`/`** (middleware). Başarılı **giriş** ve **kayıt** sonrası istemci tarafında da `supabase.auth.getUser()` ile aynı **`/admin`** yönlendirmesi (`src/app/(auth)/login/page.tsx`).
- **Çıkış** (`Sidebar`) → **`/landing`**.
- **Şifre sıfırlama**: Login sayfasında **Şifremi unuttum** → e-posta ile **`resetPasswordForEmail`**; üretim **`redirectTo`**: **`https://www.tamirtakip.com.tr/reset-password`**. Öncesinde **`POST /api/auth/check-email`** ile kayıtlı e-posta kontrolü (Supabase **Admin** `listUsers`; sunucuda **`SUPABASE_SERVICE_ROLE_KEY`** gerekir). Supabase Dashboard **Site URL**: **`https://www.tamirtakip.com.tr`**.
- **E-posta (Resend + Supabase SMTP):** **Resend** entegrasyonu (**EU region**); **tamirtakip.com.tr** domain doğrulandı. Supabase Auth SMTP: **`smtp.resend.com:465`**, kullanıcı **`resend`**, gönderen **`noreply@tamirtakip.com.tr`**. E-posta şablonları (**Confirm signup**, **Reset password**) **TamirTakip** markasıyla güncellendi; e-posta doğrulama açık. Doğrulama sonrası yönlendirme: **`/email-dogrulama`** (**`src/app/email-dogrulama/page.tsx`** — doğrulama landing sayfası).
- **`src/app/reset-password/page.tsx`** — Kök dizinde, **public**; oturum/hash sonrası **`updateUser({ password })`**. Geçersiz oturumda girişe dönüş butonu (`window.location.href`).
- Supabase Dashboard → **Authentication → URL Configuration**: **`/reset-password`** redirect URL eklenmeli (prod + localhost).

### Personel Giriş Modu

- **`sessionStorage` anahtarları**: `activePersonnelId`, `activePersonnelName`, `activePersonnelIsAdmin` (`"true"` / `"false"`).
- **Cookie**: `personnelIsAdmin` — middleware `/sirketim`, `/raporlar`, `/planlarim` rotalarını bu cookie ile korur. Değer `"false"` ise bu rotalara erişim engellenir.
- **Admin olmayan personelde**: cihaz kayıt ve servis detay sayfalarında personel dropdown'ı gizlenir; `sessionStorage`'daki `activePersonnelId` otomatik atanır.
- **Sidebar**: `lg:sticky lg:top-0 lg:h-screen` — sayfa kaydırılınca sabit kalır.
- **Çıkış / personel değiştirme**: `sessionStorage` ve `personnelIsAdmin` cookie'si temizlenir (`handleSignOut`, `handlePersonelDegistir`).
- **Demo guard**: `POST /api/settings` ve `POST /api/hizli-kurulum` demoGuard ile korunur.

### Bildirim Sistemi (Announcements)

- Admin panelinden (`/admin`) tüm dükkanlara bildirim gönderilebilir.
- `TopBar` (`src/components/layout/TopBar.tsx`) — sağ üstte zil ikonu; okunmamış bildirim varsa koyu buton + sayı gösterir. Tıklayınca dropdown açılır, okunmamışlar otomatik okundu işaretlenir.
- Bildirim içeriğinde `whiteSpace: "pre-wrap"` — enter ile satır sonları korunur.
- Silme: önce `AnnouncementRead` cascade silinir, sonra `Announcement` silinir.
- `Shop` modeline `announcementReads AnnouncementRead[]` ilişkisi eklenmiştir.

### Planlanan: Haftalık Dükkan Raporu E-postası

- Her Pazartesi sabahı cron ile tetiklenecek
- Önceki haftanın Pazartesi 00:00 — Cumartesi 20:00 aralığındaki kayıtlar analiz edilecek
- Resend ile dükkan sahibinin e-postasına gönderilecek
- İçerik: yeni kayıt, teslim, ciro, en çok gelen cihaz, personel bazlı özet
- Detaylar netleşince implement edilecek

### Multi-tenant

- Her kullanıcının bir **Shop** kaydı olabilir: **`Shop.userId`** (`String? @unique`) ile kullanıcıya bağlanır.
- **`src/lib/getShop.ts`** — Oturumdaki kullanıcı için `prisma.shop.findUnique({ where: { userId } })`; oturum yoksa `null`. **`prisma.shop.findFirst()` ile “ilk shop” kullanma** (API’lerde veri sızıntısı riski).
- **`getOrCreateDefaultShop()`** (`src/lib/default-shop.ts`) — Önce oturumlu kullanıcıya göre shop bulur/oluşturur; oturum yoksa legacy davranış (anonim ilk shop / varsayılan dükkan). Oturum **`kaanccolak@gmail.com`** ise **dükkan oluşturma atlanır** (hata fırlatır; admin paneli API’leri bu kullanıcı için dükkan beklenmez).
- Tüm ilişkili kayıtlar **`shopId`** ile bağlıdır; kayıt sırasında oluşturulan shop ile tutarlı kalınmalıdır.

### Landing page

- **`src/app/landing/page.tsx`** — Dashboard layout dışında, **public** (`'use client'`); **metadata** (`title`, `description`, `keywords`, OpenGraph, Twitter card) **`src/app/landing/layout.tsx`** içinde. **tamamen yeniden tasarlanmış** içerik: hero + dashboard mock-up, sosyal kanıt bandı, özellik kartları, 3 adım, referanslar, fiyatlandırma, CTA, footer; **H1** SEO için optimize; **SSS** ve **“Kimler Kullanabilir?”** bölümleri. **Footer:** **`/gizlilik-politikasi`**, **`/hizmet-sartlari`** linkleri. Testimonial başlığı: **“Kullanıcılarımız ne diyor?”** PageSpeed Insights (referans skorlar): Performans **100**, SEO **100**, En İyi Uygulamalar **100**, Erişilebilirlik **94**.
- **“Demo İncele”** → **`/login?demo=true`** → e-posta / şifre otomatik doldurulur (`demo@demo.tr` / `demodemo`).
- **“Kullanmaya Başlayın”** / alt CTA **“Hemen Başlayın”** → **`#fiyatlandirma`** bölümüne `scrollIntoView({ behavior: 'smooth' })`.
- **“Servis Paneli”** → **`/login`**.

### Veritabanı

- **`ServiceOrder.orderNumber`**: **dükkan bazında benzersiz** — `@@unique([shopId, orderNumber])` (global `orderNumber` `@unique` kaldırıldı; her dükkan kendi **001** sırasından başlar). Silinmiş kayıtların numaraları da sayılır; **numara tekrar kullanılmaz**.
- **`Bayi.bayiCode`**: **dükkan bazında benzersiz** — `@@unique([shopId, bayiCode])` (global `@unique` kaldırıldı).
- **`Cari.cariCode`**: **dükkan bazında benzersiz** — `@@unique([shopId, cariCode])` (global `@unique` kaldırıldı). Format: `C + YYYY + MM + 3 hane` (ör. `C202605001`) — `allocateCariCode(shopId)` ile üretilir.
- **`Personnel.password`** (`String?`) — bcrypt hash; opsiyonel. **`Personnel.isAdmin`** (`Boolean @default(false)`) — admin yetkisi.
- **`ServiceOrder.repairFailedReason`** (`String?`) — durum **`repair_failed`** iken servis detayda modal ile girilen tamir olmama nedeni; müşteri **`/sorgula`** sonucunda da gösterilir (durum + dolu neden).
- **`ServiceOrder.reminderSentAt`** (`DateTime?`) — **cron** hatırlatma gönderilince set edilir; **Bekleyen Cihazlar** listesinde gösterilir.
- **`ServiceOrder.repairDetails`** (`String?`) — **Onarım Tamamlandı** (`completed`) seçiminde açılan modal ile girilen onarım özeti; servis detayda **Arıza ve Notlar** bölümünde gösterilir ve düzenlenebilir; **Teslim Fişi** sayfasında kullanılır.
- Her iş kaydında **`shopId`** — tenant izolasyonu.
- **Shop**: `name` (zorunlu), `userId` (opsiyonel, oturumlu kullanıcı başına **unique**), `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `website`, `logoUrl`, **`settingsPassword`** (`String?` — şirket ayarları / silme için yönetici parolası), **`receiptNotes`** (`String?` — müşteri nüshası / fişlerde servis şartları metni), (veritabanında isteğe bağlı eski Meta alanları `wa*` kalabilir; **giden WhatsApp** artık **Baileys** üzerinden), **Google Contacts OAuth** (`googleAccessToken`, `googleRefreshToken`, `googleTokenExpiry`), `createdAt`, `updatedAt`. Fişler ve sidebar **`/api/shop`** ile beslenir; GET yanıtında token’lar dönmez, yalnızca `googleContactsConnected` (boolean).
- **`WaTemplate`**: `shopId`, `templateName`, `message` — dükkan başına WhatsApp metin özelleştirmesi; gönderimde önce DB şablonu, yoksa kod içi varsayılan kullanılır.
- **`StatusLog`**: `oldPrice` / `newPrice` (`Float?`, opsiyonel) — ücret güncellemelerinde durum geçmişinde eski → yeni fiyat gösterimi.
- Shop yoksa **`getOrCreateDefaultShop`** ile oluşturulur (oturumluysa kullanıcıya bağlı; değilse legacy varsayılan).
- Prisma client: `src/lib/prisma.ts` üzerinden import et, direkt `new PrismaClient()` kullanma
- DATABASE_URL: Transaction pooler (port 6543) + ?pgbouncer=true&connection_limit=1
- DIRECT_URL: Session pooler (port 5432)

### Shop Plan Alanları

- `planType` — `"trial"` / `"basic"` / `"premium"` / `"enterprise"` (varsayılan: `"trial"`)
- `trialEndsAt` — trial bitiş tarihi (DateTime?)
- `subscriptionStatus` — `"trial"` / `"active"` / `"expired"` / `"cancelled"` (varsayılan: `"trial"`)
- `planStartedAt` — ödeme planının başladığı tarih (DateTime?)
- Şu an tüm dükkanlar trial modunda, kısıtlamalar henüz aktif değil

### Şirketim sayfası

- **Parola koruması**: ilk girişte **şirket ayarları parolası** oluşturma; sonraki girişlerde parola sorulur. **`sessionStorage`** ile aynı tarayıcı oturumunda tekrar sorulmaz.
- **Sekme çubuğu** yatay kaydırılabilir (mobil uyum); sticky üst şerit.
- **Tanımlar** (cihaz türü / marka / model) **Şirketim** içinde sekme olarak taşındı; **sidebar’dan Tanımlar linki kaldırıldı** (rota `tanimlar` gerekiyorsa yönlendirme ile korunabilir).
- **Tanımlar — düzenleme:** Her satırda **Düzenle**; inline mod (isim input, **Kaydet** / **İptal**). **PATCH** API’leri: **`src/app/api/device-types/[id]/route.ts`**, **`src/app/api/brands/[id]/route.ts`**, **`src/app/api/models/[id]/route.ts`**.
- **Yazdırma Ayarları** sekmesi kaldırıldı.
- **Fiş / Nüsha Ayarları** sekmesi — **`receiptNotes`** (müşteri nüshası servis şartları) düzenlenir.
- **Mesaj Şablonları** sekmesi — her durum için WhatsApp metni; değişkenler: `{isim}`, `{seriNo}`, `{cihaz}`, `{fiyat}`, `{neden}` (şablonda kullanım).
- **Silinen Kayıtlar** sekmesi — `deletedAt` dolu servis kayıtları listesi.
- **`/whatsapp-mesajlari`** sayfası ve sidebar **WA Mesajları** linki **kaldırıldı** (özet: bkz. aşağıdaki WA Mesajları bölümü).
- **Hızlı Kurulum** — Tanımlar sekmesinde; 13 servis türünden seçim yapılınca cihaz türleri, markalar ve modeller otomatik yüklenir. Yükleme geri alınabilir (`POST /api/hizli-kurulum`, `POST /api/hizli-kurulum/geri-al`). Yükleme verisi `Setting` tablosunda `hizli_kurulum_${timestamp}` key ile saklanır.
- **Cihaz türü / marka cascade silme** — alt kayıtlar varsa çift onay popup'ı ile cascade silinir.
- **Cihaz Etiketi termal mod** — `etiket_genislik` (mm) ayarı; `≤100mm` ise termal layout aktif (monospace, minimal padding, `@page size: Xmm auto`).
- **Personel Giriş Modu** — Setting key: `personel_giris_modu` (`"true"` / `"false"`). Aktifken giriş sonrası `PersonelSecimEkrani` (`src/components/PersonelSecimEkrani.tsx`) gösterilir; personel seçimi `sessionStorage` (`activePersonnelId`, `activePersonnelName`, `activePersonnelIsAdmin`) ve `personnelIsAdmin` cookie'sine kaydedilir.
- **Admin yetkisi**: `isAdmin: true` olan personel tüm menüyü görür. `isAdmin: false` olan personelde sidebar'dan `/sirketim`, `/raporlar`, `/planlarim` gizlenir; URL koruması middleware'de `personnelIsAdmin` cookie'si ile sağlanır.
- **Personel şifre doğrulama**: `POST /api/personnel/verify` — `personnelId` + `password` alır, bcrypt ile doğrular.
- Personel giriş modu kapatılınca `personnelIsAdmin` cookie ve sessionStorage otomatik temizlenir.
- Sekme butonları `padding: "10px 14px"`, `fontSize: "13px"` — tüm sekmeler ekrana sığar.

### Google Contacts entegrasyonu

- **Google Cloud Console** → Servis Takip projesi (**elegant-leaf-495811-k9**); **People API** etkin.
- **OAuth 2.0** (Web istemci): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (sunucu); tarayıcıda `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. **Authorized redirect URI**: `{NEXT_PUBLIC_APP_URL veya origin}/api/auth/google/callback` (localhost + üretim URL’leri).
- Her dükkan kendi Gmail hesabını **`/sirketim`** → **Google Contacts** sekmesinden bağlar (`prompt=consent`, `access_type=offline`, scope: `https://www.googleapis.com/auth/contacts`).
- **Yeni müşteri** (`POST /api/service-orders` içinde yeni `Customer` kaydı) oluşunca **`addContactToGoogle(shopId, { name, phone }, orderNumber)`** arka planda çağrılır (`.catch` ile log).
- **Kişi adı formatı (Google Contacts):** `{müşteri adı} #{kayıt numarası}` (örn. `Ahmet Mehmet #202605024`); `orderNumber` yoksa yalnızca müşteri adı.
- Token’lar **`Shop`** tablosunda: `googleAccessToken`, `googleRefreshToken`, `googleTokenExpiry`. Yenileme: `src/lib/googleContacts.ts` içinde **`refreshGoogleToken`**.
- **Callback:** `GET /api/auth/google/callback` — kod → token, `getShop()` ile shop, Prisma `update`. Başarı/hata: `/sirketim?googleSuccess=true` | `googleError=true`.
- **Kaynak:** `src/lib/googleContacts.ts` (`addContactToGoogle`, `refreshGoogleToken`).
- **Google OAuth:** Uygulama **Google Cloud Console** üzerinde **doğrulanmış** durumda; kullanıcılar Google Contacts bağlarken **“doğrulanmamış uygulama”** uyarısı görmez.
- **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** zorunlu (bağlan URL’si). Üretim tabanı: **`NEXT_PUBLIC_APP_URL`** (örn. **`https://tamirtakip.com.tr`**) — token değişimi ve istemci `redirect_uri` ile uyumlu olmalı.

### Teslim modalı (servis detay)

- **`delivered`**, **`delivered_repair_failed`**, **`delivered_no_problem`**, **`delivered_customer_return`** seçilince teslim bilgisi modalı açılır (`pendingDeliveryStatus`).
- **`deliveryType`:** `'self' | 'other'` — başkasına teslimde **`deliveryPersonName`** zorunlu; **`deliveryNote`** opsiyonel.
- **`ServiceOrder`** alanları: `deliveryType`, `deliveryPersonName`, `deliveryNote` (Prisma + `PATCH /api/service-orders/[id]`).
- Servis detayda **Durum geçmişi** altında teslim özeti kutusu (teslim durumları + `deliveryType` doluysa).
- Onay sonrası ilgili durum için **WhatsApp** şablonu varsa onay modalı (`WA_TEMPLATES[pendingDeliveryStatus]`).

### Servis detay (güncel davranışlar)

- **`completed`** (Onarım Tamamlandı) seçilince **onarım detayı** modalı; metin **`repairDetails`** olarak kaydedilir, **Arıza ve Notlar** alanında gösterilir ve düzenlenebilir.
- **Teslim Fişi** butonu → **`/teslim-fisi/[id]`** (müşteri/cihaz, onarım detayı, ücret, imza alanları, servis şartları; **kullanılan parçalar bölümü yok**, kasıtlı).
- **Durum geçmişi** kaydırılabilir kutu içinde; fiyat değişiklikleri **StatusLog** `oldPrice` / `newPrice` ile gösterilir (eski → yeni).
- **Serbest WhatsApp** mesajı gönderme alanı (düz metin).
- **Silme**: **soft delete** (`deletedAt`); kritik silmelerde **yönetici parolası** — doğrulama **`src/lib/verify-settings-password.ts`** (merkezi).
- **Silme onayı (race condition):** **`pendingDeleteId`** ile yarış durumu giderildi; **AlertDialog** “Evet, Sil” **`onClick`** içinde silinecek kaydın **`id`** değeri **yerel değişkene** alınır, callback doğrudan bu kimlikle çalışır (state gecikmesine bağlı yanlış silme engellenir; React DevTools kapalıyken de güvenilir). Etkilenen sayfalar: **bayiler**, **stok**, **cari**, **ikinci el** (`ikinci-el` veya ilgili rota), **dış servis** (`dis-servis`), **planlarım**, **cihaz sorgula**, **servis detay**.

### Servis Durumları

Geçerli durum anahtarları (`ServiceOrder.status`) — yalnızca `src/lib/service-order-status.ts` içindeki liste / API doğrulaması:

- in_service → Teknik Serviste
- returned_device → Teknik Serviste (Tekrar Geldi) — cihaz kayıtta “Cihaz tekrar mı geldi?” işaretlenince başlangıç durumu
- waiting_approval → Onay Bekliyor
- approval_given → Onay Verildi
- waiting_part → Parça Bekliyor
- sent_to_external → Dış Servise Gönderildi (`externalServiceId`, `externalNote` ile birlikte atanır; servis detayda dış servis seçim diyaloğu açılır)
- repair_failed → Tamiri Olmuyor
- no_problem_found → Sorun Görülmedi
- customer_return_request → Müşteri İade İstiyor
- completed → Onarım Tamamlandı
- delivered → Teslim Edildi
- delivered_repair_failed → Teslim Edildi (Tamir Olmuyor)
- delivered_no_problem → Teslim Edildi (Sorun Görülmedi)
- delivered_customer_return → Teslim Edildi (Müşteri İade İstedi)

**Teslim edildi grubu** (dashboard / `hideDelivered` / ciro `totalPrice` toplamı): `delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return`.

**Tamamlananları gizle** (`hideCompleted`): `completed` + teslim edildi grubu.

### Kaldırılan Özellikler

- **"Ücret Bildirilecek"** servis durumu kaldırıldı.
- **"Servisine Gönderildi"** ve **"Teslim Edilecek"** durumları kaldırıldı.
- **"Servisteki Cihazlar"** rotası/sidebar metni **"Bekleyen Cihazlar"** (`/bekleyen-cihazlar`) olarak yeniden adlandırıldı.
- **Sidebar’dan Tanımlar** menü öğesi kaldırıldı (Tanımlar → Şirketim sekmesi).
- **Şirketim** içinden **Yazdırma Ayarları** sekmesi kaldırıldı.
- **`/whatsapp-mesajlari`** rotası ve **WA Mesajları** sidebar linki kaldırıldı.

### Yeni Modeller

- **SparePart**: yedek parça stok yönetimi (`name`, `partCode`, `cost`, `stock`, isteğe bağlı `deviceTypeId`, `brandId`, `deviceModelId`; hepsi null = genel parça).
- **SparePartUsage**: hangi kayıtta hangi parça kullanıldı (`sparePartId`, `serviceOrderId`, `quantity`, `costAtTime`, `shopId`).
- **Cari**: `cariCode` (C202605001), `name`, `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `cargoInfo`, `cargoCode`.
- **Bayi**: `bayiCode` (B202605001), `firmaAdi`, `yetkiliKisi`, `phone`, `phoneDigits`, `vergiDairesi`, `tcVergiNo`, **`grup`** (`grup1` %10 | `grup2` %20 | `null`).
- **Setting**: key-value ayar tablosu (`shopId + key` unique).
- **ExternalService**: dış servis firması (`shopId`, `name`, `contactName`, `phone`, `address`, `notes`); `ServiceOrder` üzerinden `externalServiceId` (opsiyonel) ve `externalNote` ile bağlanır.
- **Personnel**: `name`, `password` (`String?`, bcrypt hash), `isAdmin` (`Boolean`, varsayılan `false`), `shopId`.
- **Announcement**: `title`, `content`, `createdAt` — admin tarafından oluşturulan uygulama bildirimleri.
- **AnnouncementRead**: `shopId`, `announcementId`, `readAt` — hangi dükkanın hangi bildirimi okuduğu; `@@unique([shopId, announcementId])`.
- **WhatsAppMessage**: geçmiş / gelen mesaj kayıtları (`shopId`, `from`, `message`, `timestamp`, …); eski Meta webhook akışıyla ilişkili olabilir. Giden bildirimler **Baileys** ile gönderilir.

### Bayiler Modülü

- `/bayiler` → Bayiler listesi (grup rozeti: Grup 1 · %10 / Grup 2 · %20)
- `/api/bayiler` → GET (liste + istatistikler), POST (yeni bayi; `grup` opsiyonel)
- `/api/bayiler/[id]` → GET (detay + cihaz listesi), PATCH, DELETE
- Bayi kodu: `B + YYYYMM + 3 hane` (ör. `B202605001`)
- `ServiceOrder.bayiId` → bayi ile ilişki
- Cihaz kayıtta bayi seçilince `yetkiliKisi` ve `phone` otomatik doldurulur; **inline yeni bayi** formunda da `grup` seçilebilir
- Cihaz sorgulada `bayiId` dolu kayıtlar mor renkte (`#F5F3FF` bg, `#8B5CF6` border)
- **Bayi cirosu** yalnızca **tamamlanmış / teslim** kayıtların `totalPrice` toplamıdır (`SERVICE_ORDER_HIDE_COMPLETED_STATUSES` ile uyumlu): `completed`, `delivered`, `delivered_repair_failed`, `delivered_no_problem`, `delivered_customer_return`. **`GET /api/bayiler`** ve **`GET /api/bayiler/[id]`** aynı durum filtresini kullanır; liste/detaydaki **cihaz sayısı** tüm bağlı kayıtları içermeye devam eder.

### Public müşteri yüzeyi

- **`/sorgula`** (`src/app/sorgula/page.tsx`) — Kayıt no (9 hane) + cep (10 hane, **5** ile başlar); **`GET /api/sorgula`** ile sonuç; **`repair_failed`** + **`repairFailedReason`** varsa kutu ile gösterilir. Anlık doğrulama mesajları + toast ile gönderim öncesi kontroller.

### Yeni Sayfalar

- `/stok` — Yedek parça stok yönetimi
- `/cari` — Cari yönetimi
- `/bayiler` — Bayi yönetimi ve detay modalı
- `/dis-servis` — Dış servis firmaları CRUD (arama, Dialog ile ekle/düzenle, bağlı kayıt varken silme engeli)
- `/sirketim` — Şirket bilgileri + **parola koruması**; sekmeler: **Şirket Bilgileri**, **WhatsApp** (Baileys pairing), **Mesaj Şablonları**, **Silinen Kayıtlar**, **Google Contacts**, **Tanımlar**, **Fiş / Nüsha Ayarları** (`receiptNotes`). (**Yazdırma Ayarları** sekmesi kaldırıldı.)
- `/kargo-fisi/[id]` — Kargo gönderi fişi (dashboard dışı)
- `/teslim-fisi/[id]` — Teslim fişi (dashboard dışı; parça listesi yok)
- `/fis/[id]` — Müşteri Nüshası / Servis giriş fişi (dashboard dışı)
- `/dukkan-nushasi/[id]` — Cihaz Etiketi (dashboard dışı)
- `/servis-detay/[id]/duzenle` — Kayıt düzenleme
- `/raporlar` — Raporlar (**3 sekme:** Servis, Finansal, İkinci El)
- `/admin` — Yönetici paneli (yalnızca `kaanccolak@gmail.com`; bkz. Admin paneli)
- `/sorgula` — Müşteri cihaz durumu sorgulama (dashboard dışı, public)
- `/reset-password` — Şifre sıfırlama formu (e-posta bağlantısı sonrası, public)
- `/email-dogrulama` — E-posta doğrulama sonrası landing (public)
- `/gizlilik-politikasi` — Gizlilik Politikası (`src/app/gizlilik-politikasi/page.tsx`, public)
- `/hizmet-sartlari` — Hizmet Şartları (`src/app/hizmet-sartlari/page.tsx`, public)

### Yeni API Route'lar

- `/api/auth/register` — **POST** (`{ userId, shopName }`) — kayıt sonrası oturumlu kullanıcı için **Shop** oluşturur (`userId` doğrulaması)
- `/api/auth/check-email` — **POST** (`{ email }`) — `{ exists: boolean }`; şifre sıfırlama öncesi e-posta kayıtlı mı (service role).
- `/api/auth/google/callback` — **GET** — Google OAuth kodunu token’a çevirir; `getShop()`; `Shop` Google alanlarını günceller; `/sirketim`’e yönlendirir
- `/api/device-types/[id]` — **PATCH** (`{ name }`) — cihaz türü adı; **DELETE** (parola + bağımlılık kontrolü)
- `/api/brands/[id]` — **PATCH** (`{ name }`) — marka adı; **DELETE**
- `/api/models/[id]` — **PATCH** (`{ name }`) — model adı
- `/api/bayiler` — **GET** (liste + cihaz/ciro istatistikleri), **POST**
- `/api/bayiler/[id]` — **GET** (detay + cihaz listesi), **PATCH**, **DELETE** (bayi kodu dükkan içinde benzersiz; bkz. Prisma `@@unique([shopId, bayiCode])`)
- `/api/spare-parts` — **GET** (filtreler: `?search`, `?deviceTypeId`, `?brandId`, `?deviceModelId`, `?stockStatus`, `?forServiceOrderId`), **POST**
- `/api/spare-parts/[id]` — **PATCH**, **DELETE**
- `/api/spare-parts/[id]/stock` — **PATCH** (`{ quantity, type: "add" | "subtract" }`)
- `/api/service-orders/[id]/spare-parts` — **GET**, **POST**; **DELETE** `?usageId=` (stok iadesi)
- `/api/cari` — **GET**, **POST**
- `/api/cari/[id]` — **GET**, **PATCH**, **DELETE**
- `/api/customers/search` — **GET** (`?q=` ile müşteri arama, min 3 karakter)
- `/api/suggestions` — **GET** (`?field=&q=&deviceTypeId=`); `field`: `complaint` | `accessories` | `physicalCondition` (Prisma’da `physicalDamage` ile eşlenir); `getShop()` ile shop; min 2 karakter; geçmiş `ServiceOrder` metinlerinden frekansa göre öneri
- `/api/exchange-rates` — **GET** (`src/app/api/exchange-rates/route.ts`). **Kaynak:** TCMB resmi XML **`https://www.tcmb.gov.tr/kurlar/today.xml`** (USD/EUR `ForexBuying` / `ForexSelling` regex ile parse). **Fallback:** **`open.er-api.com`** (`/v6/latest/USD` ve EUR). Dashboard’da ~10 dk’da bir istemci yenilemesi.
- `/api/settings` — **GET**, **PATCH** (yazdırma ayarları vb.)
- `/api/personnel/verify` — **POST** (`{ personnelId, password }`) — bcrypt şifre doğrulama; başarılıysa `{ ok: true }`.
- `/api/personnel/[id]` — **PATCH** (`{ name?, password?, isAdmin? }`), **DELETE**
- `/api/announcements` — **GET** — o dükkanın tüm bildirimleri + `isRead` durumu.
- `/api/announcements/read` — **POST** (`{ announcementId }`) — bildirimi okundu işaretle.
- `/api/admin/announcements` — **GET** (tüm bildirimler + kaç dükkan okudu), **POST** (`{ title, content }`), **DELETE** (`{ id }`, cascade ile AnnouncementRead da silinir).
- `/api/external-services` — **GET** (`?search=`), **POST**
- `/api/external-services/[id]` — **PATCH**, **DELETE** (bağlı `ServiceOrder` varsa 400 + `linkedCount`)
- `/api/shop` — **GET** (`getOrCreateDefaultShop`), **PATCH** (şirket bilgileri; `name` zorunlu); **GET** yanıtında `googleContactsConnected`. **PATCH** ile Google token’ları istemciden **ayarlanamaz**; `googleAccessToken: null` gönderilerek bağlantı kesilir (refresh + expiry de temizlenir)
- `/api/shop/wa-templates` — **GET** / **PATCH** — dükkan WhatsApp mesaj şablonları (**WaTemplate**); gönderim akışında önce DB, yoksa varsayılan metin
- `/api/baileys/connect` — **POST** (`{ phone }`) — dükkan WhatsApp eşlemesi / pairing (VPS’teki Baileys API)
- `/api/baileys/status` — **GET** — oturum bağlı mı (`connected`)
- `/api/baileys/send` — **POST** (`{ to, message }`) — doğrudan düz metin (genelde dahili; müşteri bildirimi `POST /api/whatsapp/send` üzerinden)
- `/api/baileys/disconnect` — **POST** — oturumu kapat
- `/api/whatsapp/send` — **POST** (`templateName`, `parameters`) — istemci hâlâ “şablon anahtarı + parametre” gönderir; sunucu **`buildMessage`** ile düz metne çevirip **Baileys** üzerinden iletir (`getSessionStatus` ile bağlantı kontrolü)
- `/api/admin/stats` — **GET** — yalnızca **`kaanccolak@gmail.com`** (Supabase `getUser`); dükkan listesi (iletişim, toplam servis sayısı, **bu ayki kayıt sayısı**, `waEnabled` + `waPhoneNumberId`, her dükkan için Baileys **`getSessionStatus`** → `waConnected`), toplam kayıt, bugünkü kayıt, aktif / bu ay yeni dükkan sayıları
- `/api/admin/shops/[id]` — **DELETE** — aynı admin e-posta kontrolü; dükkan silme
- `/api/cron/remind-waiting` — **POST** — **`Authorization: Bearer CRON_SECRET`**; **15+ gün** teslim alınmamış kayıtlar için WhatsApp hatırlatması (Baileys). Durumlar: **`customer_return`**, **`repair_failed`**, **`completed`**, **`no_problem_found`**; **`reminderSentAt`** ile en az **15 gün** arayla tekrar; çalıştırma başına en fazla **10** kayıt; mesajlar arası **5 sn** bekleme (spam önlemi). VPS örnek cron: **`0 10 * * * curl -X POST https://www.tamirtakip.com.tr/api/cron/remind-waiting`** (header’da Bearer). Vercel **60 sn** timeout riski için `take: 10`.

### Admin paneli (`/admin`)

- **Erişim:** yalnızca **`kaanccolak@gmail.com`** — **`src/middleware.ts`** (`/admin` öneki: oturumsuz → `/login`, yanlış kullanıcı → `/`).
- **Giriş yönlendirmesi:** Bu kullanıcı giriş/kayıt sonrası doğrudan **`/admin`** (middleware + login akışı ile uyumlu).
- **UI:** **`src/app/admin/page.tsx`** — **client** bileşen; veri **`GET /api/admin/stats`**. Özet kartlar + dükkan listesi (isim, e-posta, telefon, adres, kayıt tarihi, toplam servis sayısı, **bu ayki kayıt sayısı**, **Baileys** `getSessionStatus` ile **WA bağlantı durumu**, **Sil** → **`DELETE /api/admin/shops/[id]`**). Header’da **Çıkış Yap** (`signOut` → `/login`).
- **Not:** Bu kullanıcı için **`getOrCreateDefaultShop()`** dükkan oluşturmaz (yukarıda Multi-tenant).

### Barkod tarama

- **`src/components/barcode-scanner.tsx`** — **`@zxing/browser`** ile kamera üzerinden barkod okuma.
- **Cihaz Sorgula**, **Bekleyen Cihazlar**, **İkinci El** sayfalarında kamera ikonu ile açılır; mobil tarayıcılarda (Chrome, Safari) kullanım hedeflenir.
- **Zoom:** Kamera açıkken **+ / −** ile yakınlaştırma/uzaklaştırma; destekleyen cihazlarda **`getCapabilities().zoom`** ile **min / max** okunur, başlangıçta **minimum zoom** uygulanır (geniş açı). Zoom yoksa kontroller **gizlenir**.
- **Tarama çerçevesi:** Yaklaşık **%90 × %40** (yatay uzun barkodlar için geniş, alçak çerçeve).

### QR kod (müşteri nüshası)

- Paket: **`react-qr-code`**.
- **`src/app/fis/[id]/page.tsx`** — barkodun altında QR; değer: **`https://tamirtakip.com.tr/sorgula?kayitNo=...&telefon=...`** (telefon normalize); müşteri okutunca **cihaz sorgulama** sayfasına gider.

### SEO ve domain

- **Üretim domain:** **`tamirtakip.com.tr`** (aktif; İsimtescil → **Vercel**). **`NEXT_PUBLIC_APP_URL`** Vercel ortamında **`https://tamirtakip.com.tr`** olacak şekilde güncellendi. Google Search Console bağlı; **sitemap** gönderildi.
- **`src/app/sitemap.ts`**, **`src/app/robots.ts`** — dinamik sitemap / robots.
- **`src/app/icon.tsx`** — Next.js 14 favicon (indigo kare + **T** + yeşil onay).
- **Kök `layout` metadata:** `title`, `description`, `keywords`, OpenGraph, Twitter card (uygulama geneli).

### Logo (görsel kimlik)

- Modern / tech: **indigo `#4f46e5`** kare + **T** harfi + **yeşil `#22c55e`** onay rozeti; **“tamir”** kalın koyu, **“takip”** ince indigo — bitişik yazım.
- **Navbar**, **sidebar**, **login**, **landing** üzerinde kullanılır.

### Bekleyen Cihazlar (liste filtresi + hatırlatma etiketi)

- Liste varsayılanında yalnız şu **`ServiceOrder.status`** değerleri: **`completed`**, **`waiting_approval`**, **`approval_given`**, **`waiting_part`**, **`repair_failed`**, **`no_problem_found`**, **`customer_return_request`**, **`sent_to_external`** (`src/app/(dashboard)/bekleyen-cihazlar/page.tsx` — `in_service` / `returned_device` yok).
- **`reminderSentAt`** — cron hatırlatması gönderilince set edilir; arayüzde tarih gösterilir.

### Demo hesap (salt okunur)

- **`src/lib/demo-guard.ts`** — **`demo_unlocked`** cookie ile bypass.
- **`POST /api/demo/unlock`**, **`POST /api/demo/lock`** — şifre doğrulama / cookie silme.
- **`src/components/demo-banner.tsx`** — sarı / yeşil banner; **“Demo Modundan Çık”** / **“Salt Okunur Moda Geç”**.
- **Demo şifresi:** `Kaanky316293!` (üretimde dağıtım dikkati).
- **`/sirketim`** — **`isDemo`** iken parola değiştirme, WA bağlama, şablon kaydetme vb. devre dışı.

**Not:** Servis kaydı silme **soft delete** (`deletedAt`) ve **yönetici parolası** (`verify-settings-password`) ile yapılır; uygun yerlerde parça stok iadesi korunur. Kalıcı satır silme yerine listelerden düşer, **Silinen Kayıtlar** sekmesinde görünür.

### Build ve deploy (Vercel)

- **`npm run build`** → **`prisma generate && next build`** — CI’da Prisma Client üretimi garanti.
- **`src/app/api/**/route.ts`** — Tüm route dosyalarında **`export const dynamic = "force-dynamic"`** (statik önbelleğe alınmayan API davranışı). Çok satırlı import bloklarının **ortasına** bu satır yazılmamalı (parse hatası).
- **`useSearchParams`** kullanan istemci sayfaları **`Suspense`** ile sarılmalı (`login`, **`dis-servis`**, `cihaz-sorgula`, `bekleyen-cihazlar` vb.).

### Yardımcı Fonksiyonlar

- `src/lib/formatPhone.ts` → telefon numarasını `+90 5XX XXX XX XX` formatına çevirir
- `src/lib/whatsapp.ts` → `WA_TEMPLATES` (durum → **mantıksal şablon anahtarı** `name` + `getParams`); istemci/servis detay bu anahtarları `POST /api/whatsapp/send` ile gönderir; metin üretimi **`src/app/api/whatsapp/send/route.ts`** içindeki **`buildMessage`**
- `src/lib/baileys-client.ts` → VPS’teki Baileys REST API: `connectShopWhatsApp`, `getSessionStatus`, `sendBaileysMessage`, `disconnectShopWhatsApp` (`BAILEYS_API_URL`, `BAILEYS_API_KEY`, header `x-api-key`)

### Ortam değişkenleri (güncel)

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (şifre sıfırlama `check-email` vb.)
- `BAILEYS_API_URL` — Baileys REST tabanı (örn. `https://…`); `BAILEYS_API_KEY` — isteklerde `x-api-key`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth token değişimi; istemci kimliği yalnızca public ise `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ile aynı olabilir)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (OAuth yetkilendirme URL’si)
- `CRON_SECRET` — **`POST /api/cron/remind-waiting`** için Bearer doğrulama (VPS cron)
- `NEXT_PUBLIC_APP_URL` — OAuth `redirect_uri` / kök URL (Vercel üretim: **`https://tamirtakip.com.tr`**; **`https://www.tamirtakip.com.tr`** veya localhost geliştirme URL’leri ile uyum için Dashboard redirect’leri eklenmeli; geliştirme: `http://localhost:3000`)

### Production

- **Canlı domain:** **[https://www.tamirtakip.com.tr](https://www.tamirtakip.com.tr)** (apex → www yönlendirmesi; DNS İsimtescil, hosting **Vercel**). Eski / alternatif: [https://teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app).
- Vercel → GitHub **`main`** push ile otomatik deploy.
- Supabase **Site URL** ve redirect’ler: **`https://www.tamirtakip.com.tr`** (localhost geliştirme URL’leri eklenmeli).
- **VPS cron:** `crontab -l` ile görüntülenebilir (ör. günlük **10:00** hatırlatma `curl` — bkz. **`/api/cron/remind-waiting`**).
- **Baileys sunucusu (VPS):** Hetzner **46.62.253.209**, Ubuntu **24.04**, plan **CX23**; oturum dosyaları **`/opt/baileys/sessions/{shopId}/`**; süreç **PM2** (`baileys-api`). SSH: `ssh root@46.62.253.209`; log / yeniden başlatma: `pm2 logs baileys-api`, `pm2 restart baileys-api`

### Önemli Notlar

- **`Shop.userId`** (`@unique`) — oturumlu kullanıcı başına en fazla bir Shop.
- **Tek seferlik migration script**: `src/scripts/migrate-shop.ts` (eski `userId`’siz shop → yeni kullanıcı shop’una taşıma; prod’da bir kez çalıştırıldıysa tekrarlama).
- **Supabase**: geliştirmede **e-posta onayı kapalı** önerilir; production’da **açılabilir** — **Resend** SMTP, **tamirtakip.com.tr** domain, şablonlar **TamirTakip**; doğrulama sonrası **`/email-dogrulama`**; redirect URL’leri güncelle.
- Fiş sayfaları (`fis`, `dukkan-nushasi`, `kargo-fisi`) dashboard layout'u dışında `src/app/` root altında, sidebar görünmez. Şirket ünvanı bu sayfalarda `GET /api/shop` ile alınır (siparişe gömülü `shop.name` yedek olarak kullanılabilir).
- Telefon araması `phoneDigits` alanı üzerinden yapılır (normalize edilmiş rakamlar).
- Kargo fişi aynı sekmede açılır (`router.push`, `window.open` değil).
- Ciro kartı varsayılan gizli, göz ikonu ile açılır.
- Döviz kurları: alış -2%, satış +2% olarak revize edilir.
- Tarayıcı header/footer yazdırmada kullanıcı tarafından manuel kapatılmalıdır.
- **Servis detay** — **Tamiri Olmuyor** seçimi doğrudan durumu değiştirmez; önce modal ile **`repairFailedReason`** alınır, sonra **`PATCH`** ile hem durum hem neden güncellenir.
- **Dashboard ciro kartı** — Günlük varsayılan yüklemede ana dashboard’daki ciro ile uyum için **`dailyRevenueFromDashboard`** ile gereksiz ek **`/api/dashboard`** çağrısı önlenir.

## Demo verisi (isteğe bağlı)

- **`npm run seed:demo`** (`src/scripts/seed-demo.ts`) — İlk **`Shop.userId`** dolu kayıt (demo hesabı) için örnek tanımlar, müşteriler, servis kayıtları, stok, ikinci el, planlar, cari. **`Demo`** adıyla aramaz; shop seçimi **`userId IS NOT NULL`** ile yapılır.

## Performans Notları

- **`src/components/layout/Sidebar.tsx`** — Tüm **`Link`** bileşenlerine **`prefetch={false}`** verildi; gereksiz prefetch istekleri azaltıldı, dashboard ilk yükleme daha hafif. **Mobilde** hamburger + drawer; masaüstünde sabit genişlik.
- **Responsive / mobil (özet):** dashboard grid dar ekranda sütun kırılımı; **cihaz sorgula** tablosu yatay kaydırma; **cihaz kayıt** formu sütunları alt alta; **servis detay** üst aksiyonlar sarma + yatay kaydırma; **şirketim** sekme şeridi yatay kaydırma; **WelcomeModal** içerik kaydırılabilir; **şirketim parola** input `fontSize: 16px` (iOS zoom); **silinen kayıtlar** tablosu yatay kaydırma.
- `src/lib/cache.ts` — bellek içi cache (**device-types**, **brands**, **models**; yaklaşık **5 dk TTL**). **Anahtarlar dükkan bazlı:** `device-types-${shop.id}`, `brands-${shop.id}-${deviceTypeId}`, `models-${shop.id}-${brandId}` (farklı dükkanların tanım listeleri karışmaz). Tanımlar / ilgili API’lerde POST/DELETE/**PATCH** sonrası **invalidate** edilir. Liste **GET** route’larında **`export const dynamic = "force-dynamic"`**; silme sonrası istemci tarafı yenilemelerde **`cache: "no-store"`** ve **timestamp** query ile önbellek bypass.
- `src/lib/getShop.ts` — Oturumdaki kullanıcının shop'unu döndürür; **TTL önbelleği yok** (`setShopCache` / `invalidateShopCache` uyumluluk için no-op olabilir).
- Ağır dashboard / listeleme uçlarında mümkün olduğunca **`Promise.all`** ile paralel Prisma sorguları.
- **`$queryRaw`** yerine tercihen **`findMany` + JS tarafında gruplama** (okunabilirlik ve tip güvenliği).
- **`useEffect` bağımlılık dizilerini** dikkatli tut; aynı veriyi iki kez çekmeyi önle (Strict Mode + gereksiz `[load]` zincirleri).

## Form UX

- **Cihaz kayıt** (`src/app/(dashboard)/cihaz-kayit/page.tsx`): cihaz türü / marka / model **native `<select>`** alanlarının yanında **“+”** butonu; tıklanınca modal ile isim girip **POST** (`/api/device-types`, `/api/brands`, `/api/models`) kayıt; liste yenilenir ve yeni tanım **otomatik seçilir** (Tanımlar sayfasına gitmeden).
- **Cihaz kayıt** formunda **Enter** ile bir sonraki alana odak (TAB benzeri sıra).
- **İkinci el alım** (`src/app/(dashboard)/cihaz-kayit/second-hand-form.tsx`), **cari** ve **bayi** formlarında aynı Enter navigasyonu (`handleEnterKey` + ref zinciri).
- İlgili **input / native select** alanlarında `onKeyDown` ile Enter işlenir.
- **Textarea:** **Shift+Enter** yeni satır; yalnız **Enter** sonraki alana geçer; son textarea’dan Enter **Kaydet** butonuna odaklar.
- **Şikayet / aksesuar / fiziksel hasar** alanlarında **`SuggestionTextarea`** (`src/components/SuggestionTextarea.tsx`) — öneri listesi `createPortal` + `position: fixed` (overflow/z-index sorunları için).

### Autocomplete öneriler

- **`src/components/SuggestionTextarea.tsx`** — textarea + öneri listesi (portal → `document.body`).
- **`src/hooks/useSuggestions.ts`** — 300 ms debounce, ok tuşları / Enter / Escape.
- **`GET /api/suggestions`** — `?field=&q=&deviceTypeId=`; `field`: `complaint` | `accessories` | `physicalCondition` (DB: `physicalDamage`).
- Geçmiş kayıtlardan öğrenir; tekrar sayısına göre sıralar; opsiyonel `deviceTypeId` ile aynı tür önceliği.
- Min **2** karakter, **300** ms debounce.
- Her dükkan kendi **`shopId`** verisinden öneri alır (`getShop`).

### Bayi grup ve iskonto sistemi

- **`Bayi.grup`**: `grup1` (%10) | `grup2` (%20) | `null`.
- **Servis detay** ücret kaydında: kullanıcı **brüt** girer; API’ye **`Math.round(brüt × (1 - discountRate))`** (net) gönderilir.
- **`ServiceOrder.totalPrice`** = kayıtlı **net** tutar.
- Kalıcı gösterim: **brüt** ≈ `Math.round(net / (1 - discountRate))`, **iskonto** = brüt − net, kartta yeşil özet.
- Yazarken ayrı önizleme kutusu yalnızca input doluyken gösterilir (çift iskonto algısı olmasın diye).

### Ödeme linki

- Servis detay **Ücret** kartında **Ödeme Linki Gönder** butonu (mavi).
- Modal: tutar, müşteri bilgisi, bilgi notu; **iyzico** entegrasyonu yapılınca gerçek ödeme linki üretilecek.
- **`handleSendPaymentLink`** — şu an modal kapanır ve **`toast.info`** ile bilgilendirme (“Ödeme linki özelliği yakında aktif olacak.” benzeri); gerçek ödeme akışı yok.

### Planlarım

- **`/planlarim`** — tamamlanmış satırda **Geri Al** butonu.
- **`PATCH /api/payment-plans/[id]`** — `{ isCompleted: false, completedAt: null }` ile tamamlanmayı geri alma.

## Önemli Hatırlatmalar

- Geliştirme: **`npm run dev`** → `next dev --turbo` (package.json’da tanımlı).
- **İlk Supabase / DB bağlantısı** soğuk başlangıçta yavaş olabilir — normal; `prisma.$connect()` ısıtması `src/lib/prisma.ts` içinde kullanılıyor.
- **device-types** / **brands** / **models** cache’i **dükkan bazlı anahtarlarla** (`device-types-${shop.id}`, …) invalidasyonu; Tanımlar’da ekleme / silme / **düzenleme (PATCH)** sonrası güncellenir. Eski liste görürsen API/cache invalidasyonu, **`force-dynamic`** ve istemci **`cache: 'no-store'`** + timestamp yenilemesini kontrol et.

## Kayıt Numarası Formatı

YYYYMM### — örnek: 202605001

- Her ay sıfırlanır
- Aynı yıl+ay prefix'ine sahip son kaydı bul, 1 artır
- İlk kayıtsa 001'den başla
- **`allocateServiceOrderNumber`** — **`shopId`** parametresi ile **dükkan bazında** numara üretir; **silinmiş** (`deletedAt` dolu) kayıtların numaraları da sayılır (**tekrar kullanılmaz**).

## Telefon Formatı

+90 5XX XXX XX XX — veritabanına bu formatta kaydet

## API Route Kuralları

- Tüm GET route'larında ?search=, ?status=, ?hideDelivered= parametrelerini destekle
- Hata durumlarında Türkçe mesaj döndür
- Response'larda ilişkili tabloları include et (customer, deviceType, brand, deviceModel)

### WhatsApp (Baileys) — mimari

- **Meta WhatsApp Business API** giden mesaj için **kaldırıldı**; bildirimler **Baileys** tabanlı kendi altyapımızdan gider.
- **VPS:** Hetzner **46.62.253.209**, Ubuntu **24.04**, **CX23**; **PM2** ile `baileys-api` yönetimi (restart sonrası otomatik ayağa kalkma). SSH: `ssh root@46.62.253.209`. Log / restart: `pm2 logs baileys-api`, `pm2 restart baileys-api`.
- **Oturum dosyaları:** `/opt/baileys/sessions/{shopId}/` (VPS üzerinde).
- **Oturum temizliği (Baileys sunucu):** WhatsApp’tan cihaz silindiğinde **`loggedOut`** event’i alınır; **`deleteSession`** ile session dosyaları otomatik temizlenir. Yeni bağlantı kurulmadan önce eski session temizlenir: **`/session/connect`** endpoint’i önce **`deleteSession`** çağırır, ardından yeni eşleme akışına devam eder.
- **Şirketim:** sekme adı **“WhatsApp API”** → **“WhatsApp”** olarak güncellendi; her dükkan kendi numarasını **pairing kodu** ile bağlar (`/api/baileys/connect`, durum `/api/baileys/status`, kesme `/api/baileys/disconnect`).
- **Şirketim — WhatsApp sekmesi telefon alanı:** Sabit **+90** prefix gösterilir; kullanıcı yalnızca **10 haneli** ulusal numarayı girer (yalnızca rakam, en fazla 10 karakter). API’ye **`+90` + girilen rakamlar** birleşik gönderilir.
- **Pairing kodu gösterimi:** Dönen **8 karakterlik** kod arayüzde ortadan tire ile ayrılır (örn. `ABCD-1234`).
- **Next.js ortamı:** `BAILEYS_API_URL`, `BAILEYS_API_KEY`; istemci kütüphane **`src/lib/baileys-client.ts`**.

### WhatsApp — mantıksal şablon anahtarları (`WA_TEMPLATES` + `buildMessage`)

Kaynak parametreleri: **`src/lib/whatsapp.ts`** — `WA_TEMPLATES[status].name` ve **`getParams(order)`** (sıra korunur). **Gönderilen metin** Meta şablonu değil **düz metin**; `POST /api/whatsapp/send` içinde önce **`WaTemplate`** (Prisma, `shopId` + `templateName`) ile dükkan özelleştirmesi aranır, yoksa **`buildMessage(templateName, parameters)`** varsayılanı kullanılır; ardından Baileys **`sendBaileysMessage`**. Özelleştirme UI: **`/sirketim`** → **Mesaj Şablonları**; API: **`/api/shop/wa-templates`**. `sent_to_external` için kayıt yok — **WA sorusu çıkmaz**. **`buildMessage`** güncellendi: tüm servis durumları için **Türkçe düz metin** mesajlar tanımlandı.

| Uygulama durumu | Anahtar (`templateName`) | Parametreler (sıra, `getParams` ile uyumlu) |
|-----------------|---------------------------|---------------------------------------------|
| `in_service` / `returned_device` | `servis_teslim_alindi` | müşteri adı, seri no, model |
| *(ayrı buton)* | `fiyat_bildirimi` | müşteri adı, seri no, model, fiyat |
| `waiting_approval` | `onay_bekleniyor` | müşteri adı, seri no, model |
| `approval_given` | `onay_verildi` | müşteri adı, seri no, model |
| `waiting_part` | `parca_bekleniyor` | müşteri adı, seri no, model |
| `repair_failed` | `tamiri_olmuyor` | müşteri adı, seri no, model, tamir olmama nedeni |
| `no_problem_found` | `sorun_gorulmedi` | müşteri adı, seri no, model |
| `customer_return_request` | `musteri_iade_istiyor` | müşteri adı, seri no, model |
| `completed` | `onarim_tamamlandi` | müşteri adı, seri no, model |
| `delivered` | `teslim_edildi` | müşteri adı, seri no, model |
| `delivered_repair_failed` | `teslim_tamir_olmuyor` | müşteri adı, seri no, model |
| `delivered_no_problem` | `teslim_sorun_gorulmedi` | müşteri adı, seri no, model |
| `delivered_customer_return` | `teslim_musteri_iade` | müşteri adı, seri no, model |

İkinci el alım: **`WA_SECOND_HAND_PURCHASE`** → `ikinci_el_satin_alindi`.

### WA Mesajları sayfası (kaldırıldı)

- **`/whatsapp-mesajlari`** rotası ve sidebar **“WA Mesajları”** linki yok; mesaj geçmişi bu sayfadan takip edilmez (bildirim gönderimi servis akışı + Baileys üzerinden devam eder).

### Durum değişince WA bildirimi

- Durum **PATCH** başarılı olduktan sonra `WA_TEMPLATES[status]` tanımlıysa, müşteride telefon ve **Baileys oturumu hazır** (`/api/baileys/status` / servis detaydaki hazırlık mantığı) ise **onay Dialog** açılabilir.
- Kullanıcı onaylarsa **`POST /api/whatsapp/send`** (`templateName`, `parameters`) → **`buildMessage`** → Baileys.

### Cihaz kayıt — kayıt sonrası WA

- Servis kaydı oluşunca modal: **Evet** → `servis_teslim_alindi` (`WA_TEMPLATES.in_service`); **Hayır** → doğrudan **`/servis-detay/[id]`**
- **POST /api/service-orders** yanıtında **`order`** özeti (`id`, `customerName`, `customerPhone`, `serialNo`, `deviceModel`, `brand`) gönderilir

### WhatsApp gönderim uç noktası

- **`POST /api/whatsapp/send`** — Baileys üzerinden düz metin gönderir (`getSessionStatus` ile bağlantı doğrulaması).

### Ciro Hesabı

- Ciro `StatusLog` tablosuna göre hesaplanır
- O gün/hafta/ay delivered statüsüne geçen ve hala delivered olan kayıtlar dahil edilir
- Durum geri alınırsa kayıt ciroya dahil edilmez

### Durum Renkleri

- Cihaz Bilgileri kartı mevcut durumun rengini kullanır (`statusBadge.bg`, `statusBadge.border`)
- `src/lib/statusConfig.ts` içindeki `getStatusBadge` fonksiyonu kullanılır

## UI Kuralları

- shadcn/ui bileşenlerini kullan
- **Native HTML `<select>` kullan** (shadcn `Select` değil — dropdown pozisyon sorunu var)
- Türkçe tüm label ve mesajlar
- **Toast:** sonner
- **Silme:** AlertDialog ile onay; kritik silmelerde **onay** sırasında silinecek kaydın **`id`** değeri **yerel değişkene** alınmalı (`pendingDeleteId` yarışı önlenir).
- **Garanti bilgisi / Genel durum** (cihaz kayıt ve düzenleme): toggle buton grupları — **yeşil** olumlu (Garantili, Kurcalanmamış), **kırmızı** olumsuz (Garantisiz, Kurcalanmış); seçili değil: beyaz/gri border
- Durum badge renkleri (`serviceOrderStatusToneClass`):
  - in_service: mavi
  - returned_device: mor
  - waiting_approval: turuncu
  - approval_given: açık yeşil
  - waiting_part: sarı
  - sent_to_external: mor (violet)
  - repair_failed: kırmızı
  - no_problem_found: gri
  - customer_return_request: turuncu
  - completed: gri
  - delivered: koyu yeşil
  - delivered_repair_failed: koyu kırmızı
  - delivered_no_problem: koyu gri
  - delivered_customer_return: koyu turuncu

## Menü Sırası (güncel)

1. Gösterge Paneli
2. Cihaz Kayıt
3. Cihaz Sorgula
4. İkinci El Cihazlar
5. Bekleyen Cihazlar
6. Dış Servisler
7. Stok Yönetimi
8. Cari Yönetimi
9. Bayiler
10. Planlarım
11. Raporlar
12. Şirketim — içinde **Tanımlar** sekmesi (ayrı sidebar maddesi yok)

**Not:** **Tanımlar** artık yalnızca **Şirketim** alt sekmesi; **WA Mesajları** sayfası/linki kaldırıldı.

## Klasör Yapısı

```
src/middleware.ts                             # Auth, public rotalar, /landing, /admin
src/app/admin/                            # Admin paneli (client + /api/admin/*)
src/app/sitemap.ts
src/app/robots.ts
src/app/icon.tsx
src/app/landing/                            # SaaS landing (public; metadata: layout.tsx; footer: gizlilik + hizmet şartları)
src/app/gizlilik-politikasi/                # Gizlilik Politikası (public)
src/app/hizmet-sartlari/                    # Hizmet Şartları (public)
src/components/barcode-scanner.tsx
src/components/PersonelSecimEkrani.tsx   # Giriş sonrası personel seçim ekranı
src/components/demo-banner.tsx
src/lib/demo-guard.ts
src/app/(dashboard)/                          # Korumalı uygulama
src/app/(dashboard)/stok/
src/app/(dashboard)/cari/
src/app/(dashboard)/servis-detay/[id]/duzenle/
src/app/(dashboard)/raporlar/
src/app/api/cron/remind-waiting/            # VPS cron — teslim alınmayan cihaz hatırlatması
src/app/api/admin/stats/
src/app/api/admin/shops/[id]/
src/app/api/baileys/status/
src/app/api/baileys/send/
src/app/api/baileys/disconnect/
src/app/api/whatsapp/send/
src/app/api/hizli-kurulum/           # Hızlı kurulum — tanım/marka/model toplu yükleme
src/app/api/hizli-kurulum/geri-al/   # Hızlı kurulum geri alma
src/app/api/ai-assistant/            # Groq Llama 3.3 70B — yardım & destek chatbotu
src/app/api/ai-teshis/               # AI arıza teşhisi
src/app/api/ai-servis-notu/          # Sesli not → AI metin düzenleme
src/app/api/ai-fiyat-onerisi/        # Geçmiş kayıtlara dayalı akıllı fiyat önerisi
src/app/api/ai-haftalik-ozet/        # Haftalık performans özeti + AI değerlendirmesi
src/app/api/oneri/                   # Kullanıcı öneri/geri bildirim → Resend mail
src/lib/hizli-kurulum-data.ts        # 13 servis türü için tanım/marka/model seed verisi
src/components/AiAssistant.tsx       # Sağ alt köşe chat balonu (Yardım & Destek)
src/components/HaftalikOzet.tsx      # Dashboard haftalık performans özeti widget'ı
src/components/OneriModal.tsx        # Öneri & geri bildirim modalı
src/app/fis/[id]/
src/app/dukkan-nushasi/[id]/
src/app/kargo-fisi/[id]/
src/app/teslim-fisi/[id]/
src/app/(auth)/login/
src/app/sorgula/                         # Müşteri sorgula (public)
src/app/reset-password/                  # Şifre sıfırlama (public)
src/app/api/announcements/           # Bildirim listesi + okundu işaretleme
src/app/api/admin/announcements/     # Admin bildirim yönetimi
src/app/api/
src/app/api/auth/register/                    # Kayıt sonrası Shop oluşturma
src/app/api/auth/google/callback/             # Google Contacts OAuth callback
src/scripts/migrate-shop.ts                   # Tek seferlik shop veri taşıma (referans)
src/components/layout/
src/lib/prisma.ts
src/lib/verify-settings-password.ts         # Şirket ayarları / silme parola doğrulama
src/lib/supabase/
```

## Bilinen Sorunlar ve Çözümleri

- **"prepared statement already exists"**: pgbouncer=true parametresi eksik
- **Sürekli API isteği**: useEffect dependency array'ini kontrol et
- **shadcn Select bozuk görünüm**: Native HTML select kullan
- **Prisma .env okumaz**: .env dosyasına da DATABASE_URL yaz
- **Sidebar scroll sorunu**: `lg:sticky lg:top-0 lg:h-screen` + nav'a `min-h-0` ile çözüldü.

## Yapay Zeka Özellikleri

**Model:** Groq API — `llama-3.3-70b-versatile` (ücretsiz tier, günlük 14.400 istek)
**API Key:** `GROQ_API_KEY` (Vercel env)

### Özellikler

- **Yardım & Destek Chatbotu** (`src/components/AiAssistant.tsx` + `POST /api/ai-assistant`) — Sağ alt köşe "Yardım & Destek" balonu. TamirTakip hakkında sorulara cevap verir. Sorun bildiriminde destek telefonu paylaşır (+90 537 766 42 48).
- **AI Arıza Teşhisi** (`POST /api/ai-teshis`) — Cihaz kayıt formunda şikayet alanının altında. Cihaz + şikayet bilgisine göre olası arıza nedenleri ve kontrol adımları listeler. Sadece ilgili cihaza özel cevap verir.
- **Sesli Servis Notu** (`POST /api/ai-servis-notu`) — Web Speech API (tr-TR) ile ses tanıma; ham metni profesyonel servis notuna dönüştürür. Alanlar: şikayet, aksesuar, fiziksel hasar, kargo bilgisi (cihaz kayıt) + yapılan onarım, teknisyen notu, onarım detayı popup'ı (servis detay).
- **Akıllı Fiyat Önerisi** (`POST /api/ai-fiyat-onerisi`) — Dükkanın kendi geçmiş teslim kayıtlarından cihaz + şikayet benzerliğine göre fiyat aralığı önerir. Yeterli kayıt yoksa "veri yetersiz" döner. Harici veri kullanmaz.
- **Haftalık Performans Özeti** (`POST /api/ai-haftalik-ozet` + `src/components/HaftalikOzet.tsx`) — Dashboard'da geçen haftanın verilerini (yeni kayıt, teslim, ciro, en çok gelen cihaz, ortalama tamir süresi, bekleyen eski kayıtlar) analiz edip AI yorumu ekler.

### Önemli Notlar
- Fiyat önerisi **sadece o dükkanın verilerini** kullanır (`shopId` filtreli); farklı dükkanların verisi karışmaz.
- Sesli not için tarayıcı **Chrome veya Edge** gerekir (Web Speech API).
- Demo hesapta AI özellikleri `demoGuard` ile engellenebilir.

## Fiyatlandırma

### Paketler
| Paket | Aylık | Açıklama |
|-------|-------|----------|
| Basic | ₺90 +KDV | Tek kişilik servisler |
| Premium | ₺130 +KDV | 5 personel, stok, raporlar, AI |
| Enterprise | ₺160 +KDV | Sınırsız personel, haftalık rapor |

### Paket İçerikleri
- **Basic**: Sınırsız cihaz kayıt, ikinci el, bekleyen, dış servis, cari, bayi, planlarım, WhatsApp, mesaj şablonları, Yardım&Destek AI
- **Premium**: Basic + stok yönetimi, raporlar, ciro görünümü, tüm AI özellikleri, Google Contacts, 5 personel, personel yetki ve giriş yönetimi
- **Enterprise**: Premium + sınırsız personel, haftalık rapor e-postası, öncelikli destek

### Önemli Notlar
- İlk 30 gün tüm özellikler ücretsiz, kredi kartı gerekmez
- Beta döneminde tüm dükkanlar sınırsız kullanım hakkına sahip
- Ödeme altyapısı şirket kurulunca (iyzico) implement edilecek
- Landing page fiyatlandırma bölümü: `src/app/landing/page.tsx` satır 501 civarı

## Yapılacaklar (TODO)

- [x] Hızlı Kurulum (13 servis türü, otomatik tanım/marka/model yükleme + geri alma)
- [x] Cihaz etiketi termal yazıcı desteği (mm bazlı kağıt boyutu, termal layout)
- [x] Fiş/nüsha barkod header'a taşındı
- [x] Onboarding modal durumu DB'ye taşındı (Setting tablosu, cihaz bağımsız)
- [x] Dashboard cache kaldırıldı (no-store, silinen kayıtlar anında yansır)
- [x] AI Yardım & Destek chatbotu (Groq Llama 3.3 70B, sağ alt köşe)
- [x] AI Arıza Teşhisi (cihaz kayıt formunda, ayrı endpoint)
- [x] Sesli servis notu (Web Speech API + AI düzenleme; cihaz kayıt + servis detay)
- [x] Akıllı fiyat önerisi (geçmiş kayıt benzerliği, arıza bazlı eşleştirme)
- [x] Haftalık performans özeti (dashboard, AI değerlendirmesi)
- [x] Öneri & geri bildirim sistemi (menüde 💡 butonu, Resend mail)
- [x] Landing page AI bölümü + SEO meta güncelleme
- [x] Müşteri sorgulama multi-tenant fix (findMany ile shopId izolasyonu)
- [x] İkinci el alım formuna + butonu (cihaz türü/marka/model anında ekleme)
- [x] Dashboard tooltip'leri (tüm stat kartları)
- [x] Cascade silme (cihaz türü/marka, çift onay popup)
- [x] Stok yönetimi
- [x] Cari yönetimi
- [x] Kargo fişi yazdırma
- [x] Müşteri Nüshası ve Cihaz Etiketi
- [x] Döviz kurları
- [x] Telefon normalize arama
- [x] Fiş / etiket yazdırma (tarayıcı); **Şirketim → Yazdırma Ayarları** sekmesi kaldırıldı
- [x] Kayıt düzenleme / silme
- [x] Auth / Login koruması (Supabase Auth)
- [x] Multi-tenant (shop + `userId`)
- [x] Landing page
- [x] Şifre sıfırlama (akış + reset-password + check-email)
- [x] Public müşteri sorgulama (`/sorgula`, `repairFailedReason` gösterimi)
- [x] Vercel build uyumu (`prisma generate`, API `dynamic`, Suspense)
- [x] WhatsApp bildirimleri (Baileys VPS + `POST /api/whatsapp/send` + `buildMessage`)
- [x] Mantıksal şablon anahtarları / parametreler (`WA_TEMPLATES` + `fiyat_bildirimi`)
- [x] Durum / kayıt sonrası WA bildirimi (onay modalı)
- [x] Production deploy (**tamirtakip.com.tr**; eski: teknikservis-seven.vercel.app)
- [x] Admin paneli (`/admin`, `/api/admin/stats` bu ayki kayıt + Baileys WA, `/api/admin/shops/[id]`, `getOrCreateDefaultShop` admin istisnası)
- [x] Otomatik hatırlatma cron (`/api/cron/remind-waiting`, `CRON_SECRET`, `reminderSentAt`)
- [x] Barkod tarayıcı (`barcode-scanner`, cihaz sorgula / bekleyen / ikinci el; zoom +/−, min zoom, çerçeve %90×%40)
- [x] QR kod müşteri nüshu (`react-qr-code`, `/fis/[id]`)
- [x] SEO (`sitemap.ts`, `robots.ts`, `icon.tsx`, metadata, landing layout)
- [x] Demo salt okunur (`demo-guard`, demo API, banner, Şirketim `isDemo`)
- [x] Autocomplete öneriler (cihaz kayıt şikayet / aksesuar / fiziksel hasar)
- [x] Bayi grup ve iskonto sistemi
- [x] Planlarım — tamamlandı geri al
- [x] Google Contacts entegrasyonu
- [x] Teslim modalı (teslim durumları + `deliveryType` / not)
- [x] Tanımlar inline düzenleme + PATCH (`device-types` / `brands` / `models` `[id]`)
- [x] Silme onayı `pendingDeleteId` yarış düzeltmesi (liste sayfaları)
- [x] Tanım cache shopId anahtarları + liste `force-dynamic` / silme sonrası `no-store` + timestamp
- [x] `orderNumber` / `bayiCode` dükkan bazlı unique + `allocateServiceOrderNumber(shopId)` (silinmiş numaralar sayılır)
- [x] Resend e-posta (**EU region**) + `/email-dogrulama` (doğrulama landing)
- [ ] Paket kısıtlamaları — planType'a göre Basic'te stok/raporlar/ciro gizlensin, şirket kurulunca ve iyzico entegrasyonu tamamlanınca implement edilecek
- [ ] iyzico ödeme entegrasyonu — şirket kurulunca
- [ ] Trial/abonelik akışı — kayıt olunca 30 günlük trial başlasın, süre dolunca paket seçim ekranı
- [ ] Trial süresi uyarı sistemi — şirket kurulunca ve iyzico entegrasyonu tamamlanınca:
  - Kayıt olunca `trialEndsAt = şimdi + 30 gün` set edilecek
  - Süre bitişine 3 gün kala dashboard'da sarı banner: "Deneme süreniz 3 gün içinde bitiyor. Planınızı seçin."
  - Süre bitince dashboard yerine "Süreniz doldu" ekranı — ödeme yapana kadar kilitli
  - Resend ile otomatik hatırlatma e-postası (3 gün kala, 1 gün kala, bitince)
- [ ] Otomatik ödeme hatırlatma e-postası — Resend ile
- [x] Google OAuth — Google Cloud Console uygulama doğrulaması tamamlandı
- [ ] Google yorum linki / metin ince ayarı (`buildMessage` / `teslim_edildi`)
- [ ] SMS entegrasyonu
- [x] Mobil uyumlu tasarım (sidebar drawer, grid/form/tablo/şirketim sekmeleri, modallar)
- [ ] Ödeme linki WhatsApp metni
- [ ] Haftalık dükkan raporu e-postası — her Pazartesi, önceki haftanın (Pazartesi–Cumartesi 20:00) servis kayıtlarını analiz edip dükkan sahibine mail at (Resend ile). İçerik: yeni kayıt sayısı, teslim edilen, ciro, en çok gelen cihaz, personel bazlı özet. Detaylar ileride netleşecek.
- [x] Domain bağlama (**tamirtakip.com.tr**)
- [x] Yasal sayfalar + landing footer (`/gizlilik-politikasi`, `/hizmet-sartlari`)

## Güvenlik

### HTTP Güvenlik Başlıkları
`next.config.mjs` dosyasına eklendi:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — Supabase, Anthropic API bağlantılarına izin verir

### DNS / Mail Güvenliği
- **SPF**: `tamirtakip.com.tr` için `v=spf1 include:amazonses.com ~all` (isimtescil'de TXT)
- **DKIM**: `resend._domainkey.tamirtakip.com.tr` — Resend tarafından doğrulanmış
- **DMARC**: `_dmarc.tamirtakip.com.tr` — `v=DMARC1; p=quarantine;`

### KVKK
- `/kvkk` sayfası oluşturuldu
- Cookie banner eklendi (`src/components/CookieBanner.tsx`) — localStorage'da `cerez-onay` anahtarı
- Kayıt formuna KVKK onay checkbox'ı eklendi — işaretlenmeden kayıt olunamaz
- Footer'a KVKK linki eklendi

## SEO
- `src/app/landing/layout.tsx` — title, description, keywords, OpenGraph, Twitter Card, canonical URL
- `src/app/landing/page.tsx` — JSON-LD structured data (SoftwareApplication schema)
- `src/app/sitemap.ts` — www ile 6 URL (landing, login, sorgula, kvkk, gizlilik, hizmet şartları)
- Google Search Console — hem www hem www'suz mülk eklendi, sitemap gönderildi
- Referanslar gerçek dükkan isimleriyle güncellendi (Atarici, Konsol Plus, MOTSAN)

## Personel Yetki Sistemi

### Genel Yapı
- Personel giriş modu kapalıysa yetki sistemi devreye girmez — herkes her şeyi yapabilir
- `isAdmin: true` olan personel tüm yetkilere sahip, hiçbir kısıtlamaya takılmaz
- `isAdmin: false` olan personel için granüler yetki sistemi aktif

### Yetki Depolama
- Personel seçilince yetkiler `sessionStorage.activePersonnelPermissions` (JSON) olarak kaydedilir
- Çıkış, personel değiştirme veya personel giriş modu kapatılınca temizlenir

### usePersonelYetki Hook
`src/hooks/usePersonelYetki.ts` — tüm sayfalarda kullanılan yetki kontrol hook'u:
```typescript
const { yetkiVar } = usePersonelYetki();
yetkiVar("canEditServis") // true/false döner, admin ise her zaman true
```

### Sayfa Erişim Yetkileri (Personnel DB alanları)
- `canViewCihazKayit` — Cihaz Kayıt sayfası
- `canViewCihazSorgula` — Cihaz Sorgula sayfası
- `canViewBekleyen` — Bekleyen Cihazlar sayfası
- `canViewIkinciEl` — İkinci El Cihazlar sayfası
- `canViewDisServis` — Dış Servisler sayfası
- `canViewStok` — Stok Yönetimi sayfası
- `canViewCari` — Cari Yönetimi sayfası
- `canViewBayiler` — Bayiler sayfası
- `canViewPlanlarim` — Planlarım sayfası (yoksa dashboard'da blur)
- `canViewRaporlar` — Raporlar sayfası
- `canViewSirketim` — Şirketim sayfası

### Servis İşlem Yetkileri
- `canCreateRecord` — Cihaz kaydı yapma (servis & ikinci el)
- `canEditServis` — Servis kaydı düzenleme
- `canDeleteServis` — Servis kaydı silme
- `canUpdateServisStatus` — Servis durum güncelleme
- `canEditIkinciEl` — İkinci el kaydı düzenleme
- `canDeleteIkinciEl` — İkinci el kaydı silme
- `canSellIkinciEl` — İkinci el satışa çevirme / satış iptal
- `canAddDisServis` / `canEditDisServis` / `canDeleteDisServis` — Dış servis işlemleri
- `canAddStok` / `canEditStok` / `canDeleteStok` — Stok işlemleri
- `canAddCari` / `canEditCari` / `canDeleteCari` — Cari işlemleri
- `canAddBayi` / `canEditBayi` / `canDeleteBayi` — Bayi işlemleri
- `canAddPlan` / `canEditPlan` / `canDeletePlan` — Plan işlemleri
- `canViewCiro` — Dashboard ciro görme
- `canPrintMusteri` — Müşteri nüshası çıktısı
- `canPrintTeslim` — Teslim fişi çıktısı
- `canPrintEtiket` — Cihaz etiketi çıktısı
- `canPrintAlimFisi` — İkinci el alım fişi çıktısı
- `canPrintSatisFisi` — İkinci el satış fişi çıktısı

### Uygulanan Sayfalar
- `src/app/(dashboard)/servis-detay/[id]/page.tsx`
- `src/app/(dashboard)/ikinci-el/[id]/page.tsx`
- `src/app/(dashboard)/ikinci-el/page.tsx`
- `src/app/(dashboard)/dis-servis/page.tsx`
- `src/app/(dashboard)/stok/page.tsx`
- `src/app/(dashboard)/cari/page.tsx`
- `src/app/(dashboard)/bayiler/page.tsx`
- `src/app/(dashboard)/planlarim/page.tsx`
- `src/app/(dashboard)/cihaz-kayit/page.tsx`
- `src/app/(dashboard)/page.tsx` (ciro, planlarım blur, son kayıtlar blur)

### Middleware URL Koruması
`personnelIsAdmin` cookie'si ile `/sirketim`, `/raporlar`, `/planlarim` rotaları korunuyor.
Admin olmayan personel bu URL'lere direkt giremez.

### Personel Ekle/Düzenle UI
`src/app/(dashboard)/sirketim/page.tsx` — yetkiGruplari array'i ile gruplandırılmış checkbox UI.
Admin yetkisi verilince tüm yetki checkboxları gizlenir.

## Bugün Yapılanlar (19 Mayıs 2026)

### Yetki Sistemi
- `src/hooks/usePersonelYetki.ts` — granüler yetki kontrol hook'u
- 28 yetki alanı: canView* (sayfa erişim) + canCreate/Edit/Delete/Print* (işlem)
- Tüm sayfalara yetki kontrolleri eklendi
- Dashboard: Planlarım blur, Son Kayıtlar blur, Ciro kilitleme
- Personeller UI yeniden tasarlandı — iki kolon layout

### İkinci El
- Satılmış kayıtlar düzenlenebilir hale getirildi
- Satış iptal butonu eklendi
- Alım fişine Alıcı (dükkan) bilgileri eklendi
- Satış fişine Satıcı (dükkan) bilgileri eklendi
- `deviceCode` global unique → `@@unique([shopId, deviceCode])` düzeltildi

### Raporlar
- Silinen kayıtlar (`deletedAt: null`) raporlara dahil edilmeyecek

### Bayi
- Silme işleminde soft-delete edilmiş kayıtlar sayılmıyor
- Silme öncesi bağlı kayıt sayısı gösteriliyor

### Güvenlik
- HTTP güvenlik başlıkları `next.config.mjs`'e eklendi
- SPF, DKIM, DMARC DNS kayıtları isimtescil'de düzenlendi

### KVKK
- `/kvkk` sayfası oluşturuldu
- Cookie banner eklendi
- Kayıt formuna KVKK checkbox eklendi
- Footer'a KVKK linki eklendi

### SEO
- Meta tags, OpenGraph, Twitter Card, canonical URL
- JSON-LD structured data
- Sitemap güncellendi (6 URL, www ile)
- Google Search Console'a www mülkü eklendi

### Fiyatlandırma
- Tek paket modeline geçildi: ₺100/ay, ₺1.000/yıl
- Landing page fiyatlandırma bölümü yeniden tasarlandı
- Referanslar gerçek dükkan isimleriyle güncellendi
