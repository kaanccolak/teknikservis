# Servis Takip — Teknik Servis Yönetim Sistemi

## Proje Hakkında

Küçük ve orta ölçekli teknik servis dükkanları için geliştirilmiş web tabanlı iş takip uygulaması.

## Özellikler

- Cihaz kayıt ve takip
- Müşteri yönetimi
- Servis durumu güncelleme (Teknik Serviste, Onay Bekliyor, Onay Verildi, Parça Bekliyor, Onarım Tamamlandı, Teslim Edildi)
- Otomatik kayıt numarası (YYYYMM001 formatı)
- Cihaz türü, marka ve model tanım yönetimi
- **Yedek parça stok yönetimi** (cihaz türü / marka / modele göre filtreleme)
- **Kayıtta kullanılan parça takibi** ve otomatik stok düşme (iptal/silmede iade)
- **Servis giriş fişi yazdırma** (tarayıcı yazdır / PDF kaydet)
- **Kayıt düzenleme ve silme**
- Ciro takibi (günlük / haftalık / aylık / yıllık / **tarih aralığı**)
- Bekleme süresi takibi (renk kodlu)
- Durum geçmişi
- Arama ve filtreleme
- CSV export

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
```

4. Veritabanını oluştur:

```bash
npx prisma db push
```

5. Geliştirme sunucusunu başlat:

```bash
npm run dev
```

## Proje Yapısı

```
src/
├── app/
│   ├── (auth)/login/          # Giriş sayfası
│   ├── (dashboard)/           # Ana uygulama
│   │   ├── page.tsx           # Gösterge paneli
│   │   ├── cihaz-kayit/       # Yeni kayıt formu
│   │   ├── cihaz-sorgula/     # Kayıt listesi ve arama
│   │   ├── bekleyen-cihazlar/ # Bekleyen cihaz listesi
│   │   ├── stok/              # Yedek parça stok
│   │   ├── servis-detay/[id]/ # Kayıt detay, fiş, düzenleme
│   │   └── tanimlar/          # Cihaz türü/marka/model yönetimi
│   └── api/                   # API route'ları
├── components/
│   └── layout/                # Sidebar, TopBar
├── lib/
│   └── supabase/              # Supabase client
└── types/                     # TypeScript tipleri
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
- [x] Servis fişi yazdırma
- [x] Kayıt düzenleme / silme
- [ ] Auth / Login koruması
- [ ] Dükkan adı ayarı
- [ ] SMS entegrasyonu
- [ ] Multi-tenant geçişi

---
