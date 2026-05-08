# CLAUDE.md — AI Geliştirici Rehberi

Bu dosya Claude ve Cursor gibi AI araçlarının projeyi doğru anlaması için hazırlanmıştır.

## Proje Özeti

Teknik servis dükkanları için Next.js 14 tabanlı web uygulaması. **Multi-tenant mimari**: oturum açmış kullanıcı kendi **Shop** kaydına (`Shop.userId`) bağlı veriyi görür; `shopId` ile tablo bazında izolasyon.

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
- **Herkese açık rotalar** (`publicPaths`): **`/login`**, **`/landing`**, **`/sorgula`**, **`/reset-password`** ve bunların alt yolları.
- **Matcher** içinde **`/`** açıkça tanımlıdır; kök adres için middleware tetiklenir (aksi halde kök korumalı kalıp yönlendirme çalışmayabilirdi).
- **Giriş yoksa** ve rota korumalıysa → **`/landing`** yönlendirilir (login değil).
- **Giriş varken `/login`** → **`/`** (panele yönlendirilir).
- **Çıkış** (`Sidebar`) → **`/landing`**.
- **Şifre sıfırlama**: Login sayfasında **Şifremi unuttum** → e-posta ile **`resetPasswordForEmail`** (`redirectTo`: `{origin}/reset-password`). Öncesinde **`POST /api/auth/check-email`** ile kayıtlı e-posta kontrolü (Supabase **Admin** `listUsers`; sunucuda **`SUPABASE_SERVICE_ROLE_KEY`** gerekir).
- **`src/app/reset-password/page.tsx`** — Kök dizinde, **public**; oturum/hash sonrası **`updateUser({ password })`**. Geçersiz oturumda girişe dönüş butonu (`window.location.href`).
- Supabase Dashboard → **Authentication → URL Configuration**: **`/reset-password`** redirect URL eklenmeli (prod + localhost).

### Multi-tenant

- Her kullanıcının bir **Shop** kaydı olabilir: **`Shop.userId`** (`String? @unique`) ile kullanıcıya bağlanır.
- **`src/lib/getShop.ts`** — Oturumdaki kullanıcı için `prisma.shop.findUnique({ where: { userId } })`; oturum yoksa `null`. **`prisma.shop.findFirst()` ile “ilk shop” kullanma** (API’lerde veri sızıntısı riski).
- **`getOrCreateDefaultShop()`** (`src/lib/default-shop.ts`) — Önce oturumlu kullanıcıya göre shop bulur/oluşturur; oturum yoksa legacy davranış (anonim ilk shop / varsayılan dükkan).
- Tüm ilişkili kayıtlar **`shopId`** ile bağlıdır; kayıt sırasında oluşturulan shop ile tutarlı kalınmalıdır.

### Landing page

- **`src/app/landing/page.tsx`** — Dashboard layout dışında, **public**.
- **“Demo İncele”** → **`/login?demo=true`** → e-posta / şifre otomatik doldurulur (`demo@demo.tr` / `demodemo`).
- **“Kullanmaya Başlayın”** / alt CTA **“Hemen Başlayın”** → **`#fiyatlandirma`** bölümüne `scrollIntoView({ behavior: 'smooth' })`.
- **“Servis Paneli”** → **`/login`**.

### Veritabanı

- **`ServiceOrder.repairFailedReason`** (`String?`) — durum **`repair_failed`** iken servis detayda modal ile girilen tamir olmama nedeni; müşteri **`/sorgula`** sonucunda da gösterilir (durum + dolu neden).
- Her iş kaydında **`shopId`** — tenant izolasyonu.
- **Shop**: `name` (zorunlu), `userId` (opsiyonel, oturumlu kullanıcı başına **unique**), `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `website`, `logoUrl`, WhatsApp alanları, `createdAt`, `updatedAt`. Fişler ve sidebar **`/api/shop`** ile beslenir.
- Shop yoksa **`getOrCreateDefaultShop`** ile oluşturulur (oturumluysa kullanıcıya bağlı; değilse legacy varsayılan).
- Prisma client: `src/lib/prisma.ts` üzerinden import et, direkt `new PrismaClient()` kullanma
- DATABASE_URL: Transaction pooler (port 6543) + ?pgbouncer=true&connection_limit=1
- DIRECT_URL: Session pooler (port 5432)

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

### Yeni Modeller

- **SparePart**: yedek parça stok yönetimi (`name`, `partCode`, `cost`, `stock`, isteğe bağlı `deviceTypeId`, `brandId`, `deviceModelId`; hepsi null = genel parça).
- **SparePartUsage**: hangi kayıtta hangi parça kullanıldı (`sparePartId`, `serviceOrderId`, `quantity`, `costAtTime`, `shopId`).
- **Cari**: `cariCode` (C202605001), `name`, `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `cargoInfo`, `cargoCode`.
- **Bayi**: `bayiCode` (B202605001), `firmaAdi`, `yetkiliKisi`, `phone`, `phoneDigits`, `vergiDairesi`, `tcVergiNo`.
- **Setting**: key-value ayar tablosu (`shopId + key` unique).
- **ExternalService**: dış servis firması (`shopId`, `name`, `contactName`, `phone`, `address`, `notes`); `ServiceOrder` üzerinden `externalServiceId` (opsiyonel) ve `externalNote` ile bağlanır.
- **WhatsAppMessage**: gelen WA mesajları (`shopId`, `from`, `message`, `timestamp`, `customerName`, `serviceOrderId`, `isRead`); webhook `metadata.phone_number_id` → `Shop.waPhoneNumberId` ile tenant eşlemesi.

### Bayiler Modülü

- `/bayiler` → Bayiler listesi
- `/api/bayiler` → GET (liste + istatistikler), POST (yeni bayi)
- `/api/bayiler/[id]` → GET (detay + cihaz listesi), PATCH, DELETE
- Bayi kodu: `B + YYYYMM + 3 hane` (ör. `B202605001`)
- `ServiceOrder.bayiId` → bayi ile ilişki
- Cihaz kayıtta bayi seçilince `yetkiliKisi` ve `phone` otomatik doldurulur
- Cihaz sorgulada `bayiId` dolu kayıtlar mor renkte (`#F5F3FF` bg, `#8B5CF6` border)

### Public müşteri yüzeyi

- **`/sorgula`** (`src/app/sorgula/page.tsx`) — Kayıt no (9 hane) + cep (10 hane, **5** ile başlar); **`GET /api/sorgula`** ile sonuç; **`repair_failed`** + **`repairFailedReason`** varsa kutu ile gösterilir. Anlık doğrulama mesajları + toast ile gönderim öncesi kontroller.

### Yeni Sayfalar

- `/stok` — Yedek parça stok yönetimi
- `/cari` — Cari yönetimi
- `/bayiler` — Bayi yönetimi ve detay modalı
- `/dis-servis` — Dış servis firmaları CRUD (arama, Dialog ile ekle/düzenle, bağlı kayıt varken silme engeli)
- `/sirketim` — Şirket bilgileri (ünvan, telefon, e-posta, web, adres, vergi; fişlerde kullanılır)
- `/kargo-fisi/[id]` — Kargo gönderi fişi (dashboard dışı)
- `/fis/[id]` — Müşteri Nüshası / Servis giriş fişi (dashboard dışı)
- `/dukkan-nushasi/[id]` — Cihaz Etiketi (dashboard dışı)
- `/servis-detay/[id]/duzenle` — Kayıt düzenleme
- `/raporlar` — Raporlar (**3 sekme:** Servis, Finansal, İkinci El)
- `/whatsapp-mesajlari` — Gelen WhatsApp mesajları (okundu işaretleme, servis detay linki)
- `/landing` — Tanıtım / SaaS landing (public, dashboard layout yok)
- `/sorgula` — Müşteri cihaz durumu sorgulama (dashboard dışı, public)
- `/reset-password` — Şifre sıfırlama formu (e-posta bağlantısı sonrası, public)

### Yeni API Route'lar

- `/api/auth/register` — **POST** (`{ userId, shopName }`) — kayıt sonrası oturumlu kullanıcı için **Shop** oluşturur (`userId` doğrulaması)
- `/api/auth/check-email` — **POST** (`{ email }`) — `{ exists: boolean }`; şifre sıfırlama öncesi e-posta kayıtlı mı (service role).
- `/api/bayiler` — **GET** (liste + cihaz/ciro istatistikleri), **POST**
- `/api/bayiler/[id]` — **GET** (detay + cihaz listesi), **PATCH**, **DELETE**
- `/api/spare-parts` — **GET** (filtreler: `?search`, `?deviceTypeId`, `?brandId`, `?deviceModelId`, `?stockStatus`, `?forServiceOrderId`), **POST**
- `/api/spare-parts/[id]` — **PATCH**, **DELETE**
- `/api/spare-parts/[id]/stock` — **PATCH** (`{ quantity, type: "add" | "subtract" }`)
- `/api/service-orders/[id]/spare-parts` — **GET**, **POST**; **DELETE** `?usageId=` (stok iadesi)
- `/api/cari` — **GET**, **POST**
- `/api/cari/[id]` — **GET**, **PATCH**, **DELETE**
- `/api/customers/search` — **GET** (`?q=` ile müşteri arama, min 3 karakter)
- `/api/exchange-rates` — **GET** (USD/EUR kurları; sunucu tarafı cache + dashboard’da ~10 dk’da bir istemci yenilemesi)
- `/api/settings` — **GET**, **PATCH** (yazdırma ayarları vb.)
- `/api/external-services` — **GET** (`?search=`), **POST**
- `/api/external-services/[id]` — **PATCH**, **DELETE** (bağlı `ServiceOrder` varsa 400 + `linkedCount`)
- `/api/shop` — **GET** (`getOrCreateDefaultShop`), **PATCH** (şirket bilgileri; `name` zorunlu); **GET** yanıtında `waUnreadCount` (okunmamış WA mesajı sayısı)
- `/api/whatsapp/webhook` — **GET** (Meta `hub.challenge` doğrulama, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`), **POST** (gelen mesaj → `WhatsAppMessage`)
- `/api/whatsapp/messages` — **GET** (`?orderId=` veya sayfalama), **PATCH** (`{ id }` → okundu)

**Not:** `DELETE /api/service-orders/[id]` önce parça kullanımları için stok iadesi yapar, sonra `SparePartUsage`, `StatusLog` ve kaydı siler.

### Build ve deploy (Vercel)

- **`npm run build`** → **`prisma generate && next build`** — CI’da Prisma Client üretimi garanti.
- **`src/app/api/**/route.ts`** — Tüm route dosyalarında **`export const dynamic = "force-dynamic"`** (statik önbelleğe alınmayan API davranışı). Çok satırlı import bloklarının **ortasına** bu satır yazılmamalı (parse hatası).
- **`useSearchParams`** kullanan istemci sayfaları **`Suspense`** ile sarılmalı (`login`, **`dis-servis`**, `cihaz-sorgula`, `bekleyen-cihazlar` vb.).

### Yardımcı Fonksiyonlar

- `src/lib/formatPhone.ts` → telefon numarasını `+90 5XX XXX XX XX` formatına çevirir
- `src/lib/whatsapp.ts` → `WA_TEMPLATES` (durum → Meta şablon adı + `getParams`), `WA_SECOND_HAND_PURCHASE`, `sendWhatsApp`, `formatPriceForWa`

### Ortam değişkenleri (güncel)

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (şifre sıfırlama `check-email` vb.)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (örn. `servis-takip-webhook` — Meta webhook doğrulama)

### Production

- URL: [https://teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app)
- Vercel → GitHub `main` branch'e push ile otomatik deploy
- Supabase redirect URL: `https://teknikservis-seven.vercel.app/**`
- WhatsApp webhook callback (örnek): `https://teknikservis-seven.vercel.app/api/whatsapp/webhook`

### Önemli Notlar

- **`Shop.userId`** (`@unique`) — oturumlu kullanıcı başına en fazla bir Shop.
- **Tek seferlik migration script**: `src/scripts/migrate-shop.ts` (eski `userId`’siz shop → yeni kullanıcı shop’una taşıma; prod’da bir kez çalıştırıldıysa tekrarlama).
- **Supabase**: geliştirmede **e-posta onayı kapalı** önerilir; production’da açılabilir (redirect URL’leri güncelle).
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

- `src/lib/cache.ts` — bellek içi cache (**device-types**, **brands**, **models**; yaklaşık **5 dk TTL**). Tanımlar / ilgili API’lerde POST/DELETE sonrası **invalidate** edilir.
- `src/lib/getShop.ts` — Oturumdaki kullanıcının shop'unu döndürür; **TTL önbelleği yok** (`setShopCache` / `invalidateShopCache` uyumluluk için no-op olabilir).
- Ağır dashboard / listeleme uçlarında mümkün olduğunca **`Promise.all`** ile paralel Prisma sorguları.
- **`$queryRaw`** yerine tercihen **`findMany` + JS tarafında gruplama** (okunabilirlik ve tip güvenliği).
- **`useEffect` bağımlılık dizilerini** dikkatli tut; aynı veriyi iki kez çekmeyi önle (Strict Mode + gereksiz `[load]` zincirleri).

## Form UX

- **Cihaz kayıt** formunda **Enter** ile bir sonraki alana odak (TAB benzeri sıra).
- **İkinci el alım** (`src/app/(dashboard)/cihaz-kayit/second-hand-form.tsx`), **cari** ve **bayi** formlarında aynı Enter navigasyonu (`handleEnterKey` + ref zinciri).
- İlgili **input / native select** alanlarında `onKeyDown` ile Enter işlenir.
- **Textarea:** **Shift+Enter** yeni satır; yalnız **Enter** sonraki alana geçer; son textarea’dan Enter **Kaydet** butonuna odaklar.

## Önemli Hatırlatmalar

- Geliştirme: **`npm run dev`** → `next dev --turbo` (package.json’da tanımlı).
- **İlk Supabase / DB bağlantısı** soğuk başlangıçta yavaş olabilir — normal; `prisma.$connect()` ısıtması `src/lib/prisma.ts` içinde kullanılıyor.
- **device-types** (ve marka/model) cache’i Tanımlar’da ekleme/silmede **invalidate** edilir; eski liste görürsen API/cache invalidasyonunu kontrol et.

## Kayıt Numarası Formatı

YYYYMM### — örnek: 202605001

- Her ay sıfırlanır
- Aynı yıl+ay prefix'ine sahip son kaydı bul, 1 artır
- İlk kayıtsa 001'den başla

## Telefon Formatı

+90 5XX XXX XX XX — veritabanına bu formatta kaydet

## API Route Kuralları

- Tüm GET route'larında ?search=, ?status=, ?hideDelivered= parametrelerini destekle
- Hata durumlarında Türkçe mesaj döndür
- Response'larda ilişkili tabloları include et (customer, deviceType, brand, deviceModel)

### WhatsApp — şablonlar (`WA_TEMPLATES`)

Kaynak: **`src/lib/whatsapp.ts`**. Her servis durumu için Meta’da onaylı **şablon adı** (`name`) ve **`getParams(order)`** ile gövde parametreleri. `sent_to_external` için şablon yok — durum güncellenince **WA sorusu çıkmaz**.

| Uygulama durumu | Meta şablon adı | Parametreler (sıra) |
|-----------------|-----------------|----------------------|
| `in_service` / `returned_device` | `servis_teslim_alindi` | müşteri adı, seri no, model (deviceModel → brand → `"Cihaz"`) |
| *(ayrı buton)* | `fiyat_bildirimi` | müşteri adı, seri no, model, fiyat (servis detay) |
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

İkinci el alım bildirimi: **`WA_SECOND_HAND_PURCHASE`** → `ikinci_el_satin_alindi` (satıcı, cihaz, fiyat).

### WhatsApp Webhook

- **Endpoint:** `/api/whatsapp/webhook`
- **GET:** Meta doğrulama (`hub.verify_token` = `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
- **POST:** Gelen mesajları **`WhatsAppMessage`** tablosuna yazar; **`metadata.phone_number_id`** ile **`Shop.waPhoneNumberId`** eşleştirilir
- **Callback URL (örnek):** `https://teknikservis-seven.vercel.app/api/whatsapp/webhook`
- **Verify token:** `.env` → `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

### WA Mesajları (gelen)

- **Sayfa:** `/whatsapp-mesajlari` — liste, okundu işaretleme, ilgili kayıt linki
- **API:** `/api/whatsapp/messages` — **GET** (liste veya `?orderId=`), **PATCH** (`{ id }`)
- **Sidebar:** “WA Mesajları” menüsünde okunmamış sayısı (yeşil badge); `/api/shop` → `waUnreadCount`
- **Dashboard:** `waUnreadCount > 0` ise uyarı bandı
- **Servis detay:** o kayda bağlı gelen mesajlar sağ sütunda

### Durum değişince WA bildirimi

- Durum **PATCH** başarılı olduktan sonra `WA_TEMPLATES[status]` tanımlıysa, müşteride telefon ve **`waEnabled` + token/phone number id** hazırsa **onay Dialog** açılır
- Kullanıcı onaylarsa **`POST /api/whatsapp/send`** (`templateName`, `parameters`)

### Cihaz kayıt — kayıt sonrası WA

- Servis kaydı oluşunca modal: **Evet** → `servis_teslim_alindi` (`WA_TEMPLATES.in_service`); **Hayır** → doğrudan **`/servis-detay/[id]`**
- **POST /api/service-orders** yanıtında **`order`** özeti (`id`, `customerName`, `customerPhone`, `serialNo`, `deviceModel`, `brand`) gönderilir

### WhatsApp gönderim altyapısı

- `/api/whatsapp/send` → **POST** (şablon mesaj; Graph API)
- Phone Number ID ve Access Token **`Shop`** (`waPhoneNumberId`, `waAccessToken`, `waEnabled`)
- **`/sirketim`** → WhatsApp API sekmesi
- Test token geçicidir; kalıcı token için System User gerekir

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
- **Silme:** AlertDialog ile onay
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
11. Tanımlar
12. Raporlar
13. WA Mesajları
14. Şirketim

## Klasör Yapısı

```
src/middleware.ts                             # Auth, public rotalar, /landing yönlendirme
src/app/landing/                            # SaaS landing (public)
src/app/(dashboard)/                          # Korumalı uygulama
src/app/(dashboard)/stok/
src/app/(dashboard)/cari/
src/app/(dashboard)/servis-detay/[id]/duzenle/
src/app/(dashboard)/raporlar/
src/app/(dashboard)/whatsapp-mesajlari/
src/app/api/whatsapp/webhook/
src/app/api/whatsapp/messages/
src/app/fis/[id]/
src/app/dukkan-nushasi/[id]/
src/app/kargo-fisi/[id]/
src/app/(auth)/login/
src/app/sorgula/                         # Müşteri sorgula (public)
src/app/reset-password/                  # Şifre sıfırlama (public)
src/app/api/
src/app/api/auth/register/                    # Kayıt sonrası Shop oluşturma
src/scripts/migrate-shop.ts                   # Tek seferlik shop veri taşıma (referans)
src/components/layout/
src/lib/prisma.ts
src/lib/supabase/
```

## Bilinen Sorunlar ve Çözümleri

- **"prepared statement already exists"**: pgbouncer=true parametresi eksik
- **Sürekli API isteği**: useEffect dependency array'ini kontrol et
- **shadcn Select bozuk görünüm**: Native HTML select kullan
- **Prisma .env okumaz**: .env dosyasına da DATABASE_URL yaz

## Yapılacaklar (TODO)

- [x] Stok yönetimi
- [x] Cari yönetimi
- [x] Kargo fişi yazdırma
- [x] Müşteri Nüshası ve Cihaz Etiketi
- [x] Döviz kurları
- [x] Telefon normalize arama
- [x] Yazdırma ayarları
- [x] Kayıt düzenleme / silme
- [x] Auth / Login koruması (Supabase Auth)
- [x] Multi-tenant (shop + `userId`)
- [x] Landing page
- [x] Şifre sıfırlama (akış + reset-password + check-email)
- [x] Public müşteri sorgulama (`/sorgula`, `repairFailedReason` gösterimi)
- [x] Vercel build uyumu (`prisma generate`, API `dynamic`, Suspense)
- [x] WhatsApp webhook + WA Mesajları sayfası
- [x] WhatsApp şablonları (13 durum + `fiyat_bildirimi`; Meta onaylı isimler)
- [x] Durum / kayıt sonrası WA bildirimi (onay modalı)
- [x] Production deploy (teknikservis-seven.vercel.app)
- [ ] Meta Business Verification (production mod)
- [ ] Google yorum linki (`teslim_edildi` şablonuna)
- [ ] SMS entegrasyonu
- [ ] Mobil uyumlu tasarım
- [ ] Domain bağlama
