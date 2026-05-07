# CLAUDE.md — AI Geliştirici Rehberi

Bu dosya Claude ve Cursor gibi AI araçlarının projeyi doğru anlaması için hazırlanmıştır.

## Proje Özeti

Teknik servis dükkanları için Next.js 14 tabanlı web uygulaması. Single-tenant şu an, multi-tenant'a hazır mimari (her tabloda shopId var).

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Dil**: TypeScript
- **Stil**: Tailwind CSS + shadcn/ui
- **Veritabanı**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.22
- **Auth**: Supabase Auth (henüz aktif değil)

## Önemli Kurallar

### Veritabanı

- Her tabloda `shopId` alanı var — multi-tenant hazırlığı için, şimdilik tek shop kullanılıyor
- **Shop** (tek kayıt): `name` (zorunlu), `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `website`, `logoUrl`, `createdAt`, `updatedAt`. Fişler ve sidebar başlığı `/api/shop` ile bu kayıttan beslenir.
- Shop yoksa otomatik oluştur: ilk kaydı bul, yoksa "Varsayılan Dükkan" adıyla oluştur (`getOrCreateDefaultShop`)
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
- **Setting**: key-value ayar tablosu (`shopId + key` unique).
- **ExternalService**: dış servis firması (`shopId`, `name`, `contactName`, `phone`, `address`, `notes`); `ServiceOrder` üzerinden `externalServiceId` (opsiyonel) ve `externalNote` ile bağlanır.

### Yeni Sayfalar

- `/stok` — Yedek parça stok yönetimi
- `/cari` — Cari yönetimi
- `/dis-servis` — Dış servis firmaları CRUD (arama, Dialog ile ekle/düzenle, bağlı kayıt varken silme engeli)
- `/sirketim` — Şirket bilgileri (ünvan, telefon, e-posta, web, adres, vergi; fişlerde kullanılır)
- `/kargo-fisi/[id]` — Kargo gönderi fişi (dashboard dışı)
- `/fis/[id]` — Müşteri Nüshası / Servis giriş fişi (dashboard dışı)
- `/dukkan-nushasi/[id]` — Cihaz Etiketi (dashboard dışı)
- `/servis-detay/[id]/duzenle` — Kayıt düzenleme
- `/raporlar` — Raporlar (**3 sekme:** Servis, Finansal, İkinci El)

### Yeni API Route'lar

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
- `/api/shop` — **GET** (ilk shop), **PATCH** (şirket bilgileri güncelle; `name` zorunlu)

**Not:** `DELETE /api/service-orders/[id]` önce parça kullanımları için stok iadesi yapar, sonra `SparePartUsage`, `StatusLog` ve kaydı siler.

### Önemli Notlar

- Fiş sayfaları (`fis`, `dukkan-nushasi`, `kargo-fisi`) dashboard layout'u dışında `src/app/` root altında, sidebar görünmez. Şirket ünvanı bu sayfalarda `GET /api/shop` ile alınır (siparişe gömülü `shop.name` yedek olarak kullanılabilir).
- Telefon araması `phoneDigits` alanı üzerinden yapılır (normalize edilmiş rakamlar).
- Kargo fişi aynı sekmede açılır (`router.push`, `window.open` değil).
- Ciro kartı varsayılan gizli, göz ikonu ile açılır.
- Döviz kurları: alış -2%, satış +2% olarak revize edilir.
- Tarayıcı header/footer yazdırmada kullanıcı tarafından manuel kapatılmalıdır.

## Performans Notları

- `src/lib/cache.ts` — bellek içi cache (**device-types**, **brands**, **models**; yaklaşık **5 dk TTL**). Tanımlar / ilgili API’lerde POST/DELETE sonrası **invalidate** edilir.
- `src/lib/getShop.ts` — shop önbelleği (**~1 dk TTL**).
- Ağır dashboard / listeleme uçlarında mümkün olduğunca **`Promise.all`** ile paralel Prisma sorguları.
- **`$queryRaw`** yerine tercihen **`findMany` + JS tarafında gruplama** (okunabilirlik ve tip güvenliği).
- **`useEffect` bağımlılık dizilerini** dikkatli tut; aynı veriyi iki kez çekmeyi önle (Strict Mode + gereksiz `[load]` zincirleri).

## Form UX

- **Cihaz kayıt** formunda **Enter** ile bir sonraki alana odak (TAB benzeri sıra).
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

### WhatsApp Entegrasyonu

- `/api/whatsapp/send` → **POST** (şablon mesaj gönderir)
- `src/lib/whatsapp.ts` → `WA_TEMPLATES` ve `sendWhatsApp` helper
- Şablon adı: `fiyat_bildirimi` (Meta'da onay bekliyor)
- Phone Number ID ve Access Token `Shop` tablosunda saklanır (`waPhoneNumberId`, `waAccessToken`, `waEnabled`)
- `/sirketim` sayfasındaki WhatsApp API sekmesinden yapılandırılır
- Test token geçicidir (24 saat); kalıcı token için System User gerekir

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

## Klasör Yapısı

```
src/app/(dashboard)/                          # Korumalı sayfalar (auth gelince)
src/app/(dashboard)/stok/                     # Yedek parça stok
src/app/(dashboard)/cari/                     # Cari yönetimi
src/app/(dashboard)/servis-detay/[id]/duzenle/  # Kayıt düzenleme
src/app/(dashboard)/raporlar/                  # Raporlar (3 sekme)
src/app/fis/[id]/                             # Müşteri nüshası
src/app/dukkan-nushasi/[id]/                  # Cihaz etiketi
src/app/kargo-fisi/[id]/                      # Kargo gönderi fişi
src/app/(auth)/                               # Login sayfası
src/app/api/
src/app/api/spare-parts/                      # Parça CRUD + stok
src/app/api/service-orders/[id]/spare-parts/  # Kayıt parça kullanımı
src/app/api/cari/                             # Cari CRUD
src/app/api/customers/search/                 # Geçmiş müşteri arama
src/app/api/exchange-rates/                   # Kur servisi
src/app/api/settings/                         # Yazdırma/uygulama ayarları
src/components/layout/                        # Sidebar, TopBar
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
- [ ] Auth / Login koruması (Supabase Auth)
- [ ] Multi-tenant geçişi (shopId bazlı)
- [ ] WhatsApp Business API aktivasyonu (altyapı hazır)
- [ ] Domain bağlama
- [ ] Production deploy (Vercel)
