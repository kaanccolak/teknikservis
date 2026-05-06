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
- Shop yoksa otomatik oluştur: ilk kaydı bul, yoksa "Varsayılan Dükkan" adıyla oluştur
- Prisma client: `src/lib/prisma.ts` üzerinden import et, direkt `new PrismaClient()` kullanma
- DATABASE_URL: Transaction pooler (port 6543) + ?pgbouncer=true&connection_limit=1
- DIRECT_URL: Session pooler (port 5432)

### Servis Durumları

Sadece şu durumlar geçerli, başka durum ekleme:

- in_service → Teknik Serviste
- waiting_approval → Onay Bekliyor
- approval_given → Onay Verildi
- waiting_part → Parça Bekliyor
- completed → Onarım Tamamlandı
- delivered → Teslim Edildi

### Kaldırılan Özellikler

- **"Ücret Bildirilecek"** servis durumu kaldırıldı.
- **"Servisine Gönderildi"** ve **"Teslim Edilecek"** durumları kaldırıldı.
- **"Servisteki Cihazlar"** rotası/sidebar metni **"Bekleyen Cihazlar"** (`/bekleyen-cihazlar`) olarak yeniden adlandırıldı.

### Yeni Modeller

- **SparePart**: yedek parça stok yönetimi (`name`, `partCode`, `cost`, `stock`, isteğe bağlı `deviceTypeId`, `brandId`, `deviceModelId`; hepsi null = genel parça).
- **SparePartUsage**: hangi kayıtta hangi parça kullanıldı (`sparePartId`, `serviceOrderId`, `quantity`, `costAtTime`, `shopId`).

### Yeni Sayfalar

- `/stok` — Yedek parça stok yönetimi
- `/servis-detay/[id]/fis` — Servis giriş fişi (print-friendly; ücret/parça tablosu yok, giriş belgesi)
- `/servis-detay/[id]/duzenle` — Kayıt düzenleme

### Yeni API Route'lar

- `/api/spare-parts` — **GET** (filtreler: `?search`, `?deviceTypeId`, `?brandId`, `?deviceModelId`, `?stockStatus`, `?forServiceOrderId`), **POST**
- `/api/spare-parts/[id]` — **PATCH**, **DELETE**
- `/api/spare-parts/[id]/stock` — **PATCH** (`{ quantity, type: "add" | "subtract" }`)
- `/api/service-orders/[id]/spare-parts` — **GET**, **POST**; **DELETE** `?usageId=` (stok iadesi)

**Not:** `DELETE /api/service-orders/[id]` önce parça kullanımları için stok iadesi yapar, sonra `SparePartUsage`, `StatusLog` ve kaydı siler.

### Kayıt Numarası Formatı

YYYYMM### — örnek: 202605001

- Her ay sıfırlanır
- Aynı yıl+ay prefix'ine sahip son kaydı bul, 1 artır
- İlk kayıtsa 001'den başla

### Telefon Formatı

+90 5XX XXX XX XX — veritabanına bu formatta kaydet

### API Route Kuralları

- Tüm GET route'larında ?search=, ?status=, ?hideDelivered= parametrelerini destekle
- Hata durumlarında Türkçe mesaj döndür
- Response'larda ilişkili tabloları include et (customer, deviceType, brand, deviceModel)

### UI Kuralları

- shadcn/ui bileşenlerini kullan
- **Native HTML `<select>` kullan** (shadcn `Select` değil — dropdown pozisyon sorunu var)
- Türkçe tüm label ve mesajlar
- **Toast:** sonner
- **Silme:** AlertDialog ile onay
- **Garanti bilgisi / Genel durum** (cihaz kayıt ve düzenleme): toggle buton grupları — **yeşil** olumlu (Garantili, Kurcalanmamış), **kırmızı** olumsuz (Garantisiz, Kurcalanmış); seçili değil: beyaz/gri border
- Durum badge renkleri:
  - in_service: mavi
  - waiting_approval: turuncu
  - approval_given: açık yeşil
  - waiting_part: sarı
  - completed: gri
  - delivered: koyu yeşil

## Klasör Yapısı

```
src/app/(dashboard)/                          # Korumalı sayfalar (auth gelince)
src/app/(dashboard)/stok/                     # Yedek parça stok
src/app/(dashboard)/servis-detay/[id]/fis/    # Servis giriş fişi (yazdır)
src/app/(dashboard)/servis-detay/[id]/duzenle/  # Kayıt düzenleme
src/app/(auth)/                               # Login sayfası
src/app/api/
src/app/api/spare-parts/                      # Parça CRUD + stok
src/app/api/service-orders/[id]/spare-parts/  # Kayıt parça kullanımı
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
- [x] Servis fişi yazdırma
- [x] Kayıt düzenleme / silme
- [ ] Auth / Login koruması (Supabase Auth)
- [ ] Dükkan adı ayarı
- [ ] SMS entegrasyonu
- [ ] Multi-tenant geçişi
