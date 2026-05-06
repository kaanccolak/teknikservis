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
- Native HTML select kullan (shadcn Select bileşeni değil — dropdown pozisyon sorunu var)
- Türkçe tüm label ve mesajlar
- Toast için sonner kullan
- Silme işlemlerinde AlertDialog ile onay al
- Durum badge renkleri:
  - in_service: mavi
  - waiting_approval: turuncu
  - approval_given: açık yeşil
  - waiting_part: sarı
  - completed: gri
  - delivered: koyu yeşil

## Klasör Yapısı

```
src/app/(dashboard)/          # Korumalı sayfalar (auth gelince)
src/app/(auth)/               # Login sayfası
src/app/api/                  # API route'ları
src/components/layout/        # Sidebar, TopBar
src/lib/prisma.ts             # Prisma singleton
src/lib/supabase/             # Supabase client (browser + server)
```

## Bilinen Sorunlar ve Çözümleri

- **"prepared statement already exists"**: pgbouncer=true parametresi eksik
- **Sürekli API isteği**: useEffect dependency array'ini kontrol et
- **shadcn Select bozuk görünüm**: Native HTML select kullan
- **Prisma .env okumaz**: .env dosyasına da DATABASE_URL yaz

## Yapılacaklar (TODO)

- [ ] Auth / Login koruması (Supabase Auth)
- [ ] Servis fişi yazdırma
- [ ] SMS entegrasyonu
- [ ] Dükkan adı ayarı
- [ ] Multi-tenant geçişi
