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
- **Shop**: `name` (zorunlu), `userId` (opsiyonel, oturumlu kullanıcı başına **unique**), `phone`, `phoneDigits`, `email`, `address`, `taxOrTcNo`, `taxOffice`, `website`, `logoUrl`, (veritabanında isteğe bağlı eski Meta alanları `wa*` kalabilir; **giden WhatsApp** artık **Baileys** üzerinden), **Google Contacts OAuth** (`googleAccessToken`, `googleRefreshToken`, `googleTokenExpiry`), `createdAt`, `updatedAt`. Fişler ve sidebar **`/api/shop`** ile beslenir; GET yanıtında token’lar dönmez, yalnızca `googleContactsConnected` (boolean).
- Shop yoksa **`getOrCreateDefaultShop`** ile oluşturulur (oturumluysa kullanıcıya bağlı; değilse legacy varsayılan).
- Prisma client: `src/lib/prisma.ts` üzerinden import et, direkt `new PrismaClient()` kullanma
- DATABASE_URL: Transaction pooler (port 6543) + ?pgbouncer=true&connection_limit=1
- DIRECT_URL: Session pooler (port 5432)

### Google Contacts entegrasyonu

- **Google Cloud Console** → Servis Takip projesi (**elegant-leaf-495811-k9**); **People API** etkin.
- **OAuth 2.0** (Web istemci): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (sunucu); tarayıcıda `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. **Authorized redirect URI**: `{NEXT_PUBLIC_APP_URL veya origin}/api/auth/google/callback` (localhost + üretim URL’leri).
- Her dükkan kendi Gmail hesabını **`/sirketim`** → **Google Contacts** sekmesinden bağlar (`prompt=consent`, `access_type=offline`, scope: `https://www.googleapis.com/auth/contacts`).
- **Yeni müşteri** (`POST /api/service-orders` içinde yeni `Customer` kaydı) oluşunca **`addContactToGoogle(shopId, { name, phone }, orderNumber)`** arka planda çağrılır (`.catch` ile log).
- **Kişi adı formatı (Google Contacts):** `{müşteri adı} #{kayıt numarası}` (örn. `Ahmet Mehmet #202605024`); `orderNumber` yoksa yalnızca müşteri adı.
- Token’lar **`Shop`** tablosunda: `googleAccessToken`, `googleRefreshToken`, `googleTokenExpiry`. Yenileme: `src/lib/googleContacts.ts` içinde **`refreshGoogleToken`**.
- **Callback:** `GET /api/auth/google/callback` — kod → token, `getShop()` ile shop, Prisma `update`. Başarı/hata: `/sirketim?googleSuccess=true` | `googleError=true`.
- **Kaynak:** `src/lib/googleContacts.ts` (`addContactToGoogle`, `refreshGoogleToken`).
- **Test / doğrulama:** OAuth ekranında uygulama test modunda olabilir; Google’ın **100 test kullanıcı** limiti geçerli olabilir. Üretimde domain doğrulaması / OAuth ekranı yayınlama gerekebilir.
- **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** zorunlu (bağlan URL’si). Üretim tabanı: `NEXT_PUBLIC_APP_URL` (örn. `https://teknikservis-seven.vercel.app`) — token değişimi ve istemci `redirect_uri` ile uyumlu olmalı.

### Teslim modalı (servis detay)

- **`delivered`**, **`delivered_repair_failed`**, **`delivered_no_problem`**, **`delivered_customer_return`** seçilince teslim bilgisi modalı açılır (`pendingDeliveryStatus`).
- **`deliveryType`:** `'self' | 'other'` — başkasına teslimde **`deliveryPersonName`** zorunlu; **`deliveryNote`** opsiyonel.
- **`ServiceOrder`** alanları: `deliveryType`, `deliveryPersonName`, `deliveryNote` (Prisma + `PATCH /api/service-orders/[id]`).
- Servis detayda **Durum geçmişi** altında teslim özeti kutusu (teslim durumları + `deliveryType` doluysa).
- Onay sonrası ilgili durum için **WhatsApp** şablonu varsa onay modalı (`WA_TEMPLATES[pendingDeliveryStatus]`).

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
- **Bayi**: `bayiCode` (B202605001), `firmaAdi`, `yetkiliKisi`, `phone`, `phoneDigits`, `vergiDairesi`, `tcVergiNo`, **`grup`** (`grup1` %10 | `grup2` %20 | `null`).
- **Setting**: key-value ayar tablosu (`shopId + key` unique).
- **ExternalService**: dış servis firması (`shopId`, `name`, `contactName`, `phone`, `address`, `notes`); `ServiceOrder` üzerinden `externalServiceId` (opsiyonel) ve `externalNote` ile bağlanır.
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
- `/sirketim` — Şirket bilgileri (ünvan, telefon, e-posta, web, adres, vergi; fişlerde kullanılır); sekmeler: **Şirket Bilgileri**, **WhatsApp** (Baileys pairing kodu ile kendi numaranızı bağlama), **Google Contacts**
- `/kargo-fisi/[id]` — Kargo gönderi fişi (dashboard dışı)
- `/fis/[id]` — Müşteri Nüshası / Servis giriş fişi (dashboard dışı)
- `/dukkan-nushasi/[id]` — Cihaz Etiketi (dashboard dışı)
- `/servis-detay/[id]/duzenle` — Kayıt düzenleme
- `/raporlar` — Raporlar (**3 sekme:** Servis, Finansal, İkinci El)
- `/landing` — Tanıtım / SaaS landing (public, dashboard layout yok)
- `/sorgula` — Müşteri cihaz durumu sorgulama (dashboard dışı, public)
- `/reset-password` — Şifre sıfırlama formu (e-posta bağlantısı sonrası, public)

### Yeni API Route'lar

- `/api/auth/register` — **POST** (`{ userId, shopName }`) — kayıt sonrası oturumlu kullanıcı için **Shop** oluşturur (`userId` doğrulaması)
- `/api/auth/check-email` — **POST** (`{ email }`) — `{ exists: boolean }`; şifre sıfırlama öncesi e-posta kayıtlı mı (service role).
- `/api/auth/google/callback` — **GET** — Google OAuth kodunu token’a çevirir; `getShop()`; `Shop` Google alanlarını günceller; `/sirketim`’e yönlendirir
- `/api/bayiler` — **GET** (liste + cihaz/ciro istatistikleri), **POST**
- `/api/bayiler/[id]` — **GET** (detay + cihaz listesi), **PATCH**, **DELETE**
- `/api/spare-parts` — **GET** (filtreler: `?search`, `?deviceTypeId`, `?brandId`, `?deviceModelId`, `?stockStatus`, `?forServiceOrderId`), **POST**
- `/api/spare-parts/[id]` — **PATCH**, **DELETE**
- `/api/spare-parts/[id]/stock` — **PATCH** (`{ quantity, type: "add" | "subtract" }`)
- `/api/service-orders/[id]/spare-parts` — **GET**, **POST**; **DELETE** `?usageId=` (stok iadesi)
- `/api/cari` — **GET**, **POST**
- `/api/cari/[id]` — **GET**, **PATCH**, **DELETE**
- `/api/customers/search` — **GET** (`?q=` ile müşteri arama, min 3 karakter)
- `/api/suggestions` — **GET** (`?field=&q=&deviceTypeId=`); `field`: `complaint` | `accessories` | `physicalCondition` (Prisma’da `physicalDamage` ile eşlenir); `getShop()` ile shop; min 2 karakter; geçmiş `ServiceOrder` metinlerinden frekansa göre öneri
- `/api/exchange-rates` — **GET** (USD/EUR kurları; sunucu tarafı cache + dashboard’da ~10 dk’da bir istemci yenilemesi)
- `/api/settings` — **GET**, **PATCH** (yazdırma ayarları vb.)
- `/api/external-services` — **GET** (`?search=`), **POST**
- `/api/external-services/[id]` — **PATCH**, **DELETE** (bağlı `ServiceOrder` varsa 400 + `linkedCount`)
- `/api/shop` — **GET** (`getOrCreateDefaultShop`), **PATCH** (şirket bilgileri; `name` zorunlu); **GET** yanıtında `googleContactsConnected`. **PATCH** ile Google token’ları istemciden **ayarlanamaz**; `googleAccessToken: null` gönderilerek bağlantı kesilir (refresh + expiry de temizlenir)
- `/api/baileys/connect` — **POST** (`{ phone }`) — dükkan WhatsApp eşlemesi / pairing (VPS’teki Baileys API)
- `/api/baileys/status` — **GET** — oturum bağlı mı (`connected`)
- `/api/baileys/send` — **POST** (`{ to, message }`) — doğrudan düz metin (genelde dahili; müşteri bildirimi `POST /api/whatsapp/send` üzerinden)
- `/api/baileys/disconnect` — **POST** — oturumu kapat
- `/api/whatsapp/send` — **POST** (`templateName`, `parameters`) — istemci hâlâ “şablon anahtarı + parametre” gönderir; sunucu **`buildMessage`** ile düz metne çevirip **Baileys** üzerinden iletir (`getSessionStatus` ile bağlantı kontrolü)

**Not:** `DELETE /api/service-orders/[id]` önce parça kullanımları için stok iadesi yapar, sonra `SparePartUsage`, `StatusLog` ve kaydı siler.

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
- `NEXT_PUBLIC_APP_URL` — örn. `https://teknikservis-seven.vercel.app` (callback `redirect_uri` ile uyumlu kök URL; geliştirmede `http://localhost:3000` tercih edilebilir)

### Production

- URL: [https://teknikservis-seven.vercel.app](https://teknikservis-seven.vercel.app)
- Vercel → GitHub `main` branch'e push ile otomatik deploy
- Supabase redirect URL: `https://teknikservis-seven.vercel.app/**`
- **Baileys sunucusu (VPS):** Hetzner **46.62.253.209**, Ubuntu **24.04**, plan **CX23**; oturum dosyaları **`/opt/baileys/sessions/{shopId}/`**; süreç **PM2** (`baileys-api`) — sunucu yeniden başlasa bile otomatik kalkar. SSH: `ssh root@46.62.253.209`; log / yeniden başlatma: `pm2 logs baileys-api`, `pm2 restart baileys-api`

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

- **`src/components/layout/Sidebar.tsx`** — Tüm **`Link`** bileşenlerine **`prefetch={false}`** verildi; gereksiz prefetch istekleri azaltıldı, dashboard ilk yükleme daha hafif.
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

Kaynak parametreleri: **`src/lib/whatsapp.ts`** — `WA_TEMPLATES[status].name` ve **`getParams(order)`** (sıra korunur). **Gönderilen metin** Meta şablonu değil **düz metin**; `POST /api/whatsapp/send` içinde **`buildMessage(templateName, parameters)`** ile üretilir, ardından Baileys **`sendBaileysMessage`** çağrılır. `sent_to_external` için kayıt yok — **WA sorusu çıkmaz**. **`buildMessage`** güncellendi: tüm servis durumları için **Türkçe düz metin** mesajlar tanımlandı.

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

### WA Mesajları sayfası

- **`/whatsapp-mesajlari`** rotası, sayfa ve **sidebar** içindeki **“WA Mesajları”** menü öğesi **kaldırıldı**.

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
13. Şirketim

## Klasör Yapısı

```
src/middleware.ts                             # Auth, public rotalar, /landing yönlendirme
src/app/landing/                            # SaaS landing (public)
src/app/(dashboard)/                          # Korumalı uygulama
src/app/(dashboard)/stok/
src/app/(dashboard)/cari/
src/app/(dashboard)/servis-detay/[id]/duzenle/
src/app/(dashboard)/raporlar/
src/app/api/baileys/connect/
src/app/api/baileys/status/
src/app/api/baileys/send/
src/app/api/baileys/disconnect/
src/app/api/whatsapp/send/
src/app/fis/[id]/
src/app/dukkan-nushasi/[id]/
src/app/kargo-fisi/[id]/
src/app/(auth)/login/
src/app/sorgula/                         # Müşteri sorgula (public)
src/app/reset-password/                  # Şifre sıfırlama (public)
src/app/api/
src/app/api/auth/register/                    # Kayıt sonrası Shop oluşturma
src/app/api/auth/google/callback/             # Google Contacts OAuth callback
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
- [x] WhatsApp bildirimleri (Baileys VPS + `POST /api/whatsapp/send` + `buildMessage`)
- [x] Mantıksal şablon anahtarları / parametreler (`WA_TEMPLATES` + `fiyat_bildirimi`)
- [x] Durum / kayıt sonrası WA bildirimi (onay modalı)
- [x] Production deploy (teknikservis-seven.vercel.app)
- [x] Autocomplete öneriler (cihaz kayıt şikayet / aksesuar / fiziksel hasar)
- [x] Bayi grup ve iskonto sistemi
- [x] Planlarım — tamamlandı geri al
- [x] Google Contacts entegrasyonu
- [x] Teslim modalı (teslim durumları + `deliveryType` / not)
- [ ] iyzico ödeme entegrasyonu
- [ ] Google OAuth production doğrulaması (domain alınınca)
- [ ] Google yorum linki / metin ince ayarı (`buildMessage` / `teslim_edildi`)
- [ ] SMS entegrasyonu
- [ ] Mobil uyumlu tasarım
- [ ] Ödeme linki WhatsApp metni
- [ ] Domain bağlama
