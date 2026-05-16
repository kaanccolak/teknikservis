"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function LandingPage() {
  const router = useRouter();

  function scrollToPricing() {
    document
      .getElementById("fiyatlandirma")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        Ana içeriğe geç
      </a>
      <main
        id="main-content"
        className={`${inter.className} min-h-screen bg-white text-slate-900 antialiased`}
      >
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/landing"
            className="flex shrink-0 items-center text-slate-900"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "5px",
                      borderRadius: "1.5px",
                      background: "white",
                    }}
                  />
                  <div
                    style={{
                      width: "10px",
                      height: "14px",
                      borderRadius: "1.5px",
                      background: "white",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5L3.5 6.5L7.5 2"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.5px",
                }}
              >
                tamir
                <span style={{ fontWeight: 300, color: "#4f46e5" }}>takip</span>
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sorgula"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-slate-50 sm:px-4"
            >
              Cihaz Sorgula
            </Link>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-lg border-2 border-indigo-600 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:px-4"
            >
              Servis Paneli
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div className="text-center lg:text-left">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100">
              Tüm teknik servisler için
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
              Teknik Servis Takip Programı
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 lg:mx-0 mx-auto">
              TamirTakip ile teknik servis işlerinizi online olarak kolayca
              yönetin. Cihaz kayıt, servis takip, stok yönetimi ve WhatsApp
              bildirimleri tek platformda. Kurulum gerektirmez.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={() => router.push("/login?register=true")}
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Kullanmaya Başlayın
              </button>
              <button
                type="button"
                onClick={() => router.push("/login?demo=true")}
                className="rounded-xl border-2 border-indigo-600 bg-white px-6 py-3.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Demo İncele
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Kurulum gerektirmez · 5 dakikada başlayın
            </p>
          </div>

          {/* Dashboard mock-up */}
          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <div
              className="rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100"
              aria-hidden
            >
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-400/90" />
                  <span className="size-3 rounded-full bg-amber-400/90" />
                  <span className="size-3 rounded-full bg-emerald-400/90" />
                </div>
                <div className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1.5 text-center text-[11px] text-slate-400 ring-1 ring-slate-200">
                  app.servistakip.com / cihaz-sorgula
                </div>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Son kayıtlar
                  </span>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                    Canlı
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-100/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                    <span className="col-span-3">No</span>
                    <span className="col-span-4">Müşteri</span>
                    <span className="col-span-3">Cihaz</span>
                    <span className="col-span-2 text-right">Durum</span>
                  </div>
                  {[
                    {
                      no: "202605014",
                      name: "Ahmet Y.",
                      dev: "iPhone 13",
                      badge: "Serviste",
                      badgeClass:
                        "bg-amber-100 text-amber-800 ring-amber-200/60",
                    },
                    {
                      no: "202605013",
                      name: "Elif K.",
                      dev: "Galaxy S22",
                      badge: "Onay bekliyor",
                      badgeClass:
                        "bg-violet-100 text-violet-800 ring-violet-200/60",
                    },
                    {
                      no: "202605012",
                      name: "Mehmet S.",
                      dev: "MacBook Air",
                      badge: "Tamamlandı",
                      badgeClass:
                        "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
                    },
                  ].map((row) => (
                    <div
                      key={row.no}
                      className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 bg-white px-3 py-2.5 text-[11px] last:border-0 sm:text-xs"
                    >
                      <span className="col-span-3 font-mono text-slate-600">
                        #{row.no.slice(-5)}
                      </span>
                      <span className="col-span-4 truncate font-medium text-slate-800">
                        {row.name}
                      </span>
                      <span className="col-span-3 truncate text-slate-600">
                        {row.dev}
                      </span>
                      <span className="col-span-2 flex justify-end">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset sm:text-[10px] ${row.badgeClass}`}
                        >
                          {row.badge}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2.5 text-[11px] text-slate-300">
                  <span>Bugün teslim</span>
                  <span className="font-semibold text-white">3 cihaz</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl lg:block" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 hidden h-28 w-28 rounded-full bg-violet-200/40 blur-2xl lg:block" />
          </div>
        </div>
      </section>

      {/* Sosyal kanıt bandı */}
      <section className="border-b border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-700">
            <span className="text-2xl font-bold text-indigo-600">Beta</span>{" "}
            sürecinde — ilk kullananlardan olun
          </p>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Kurulum yok</span> · Tarayıcıdan anında kullanın
          </p>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Yapay zeka</span> destekli tek teknik servis programı
          </p>
        </div>
      </section>

      {/* Özellikler */}
      <section className="border-b border-slate-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Özellikler
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Yapay Zeka Destekli Teknik Servis Programı
          </h2>
          <div className="mt-12">
            {/* AI Özellikleri — öne çıkan */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    letterSpacing: "0.05em",
                  }}
                >
                  YAPAY ZEKA
                </span>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  TamirTakip&apos;i rakiplerinden ayıran özellikler
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    emoji: "🤖",
                    title: "AI Arıza Teşhisi",
                    desc: "Cihaz ve şikayeti girin, yapay zeka olası arızaları ve kontrol adımlarını anında listelesin. Deneyimsiz teknisyenleri bile yönlendirir.",
                    bg: "bg-purple-50",
                    border: "#a78bfa",
                  },
                  {
                    emoji: "🎤",
                    title: "Sesli Servis Notu",
                    desc: "Mikrofona konuşun, AI sözlü notunuzu profesyonel servis raporuna dönüştürsün. Yazma zamanından tasarruf edin.",
                    bg: "bg-pink-50",
                    border: "#f472b6",
                  },
                  {
                    emoji: "💰",
                    title: "Akıllı Fiyat Önerisi",
                    desc: "Geçmiş servis kayıtlarınıza dayanarak benzer arızalar için fiyat aralığı önerir. Ne kadar çok kayıt, o kadar isabetli tahmin.",
                    bg: "bg-green-50",
                    border: "#4ade80",
                  },
                ].map((f) => (
                  <article
                    key={f.title}
                    className={`flex flex-col rounded-xl ${f.bg} p-6`}
                    style={{ border: `1.5px solid ${f.border}40` }}
                  >
                    <span style={{ fontSize: "32px" }}>{f.emoji}</span>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
            {/* Standart Özellikler */}
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#9ca3af",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                }}
              >
                DİĞER ÖZELLİKLER
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    emoji: "🔧",
                    title: "Cihaz kayıt ve takip",
                    desc: "Otomatik kayıt numarası, durum akışı ve geçmiş. Her cihazın nerede olduğunu anında görün.",
                  },
                  {
                    emoji: "📦",
                    title: "Stok yönetimi",
                    desc: "Yedek parça stok takibi, uyarılar ve servis kaydına bağlı otomatik stok düşümü.",
                  },
                  {
                    emoji: "💬",
                    title: "WhatsApp bildirimi",
                    desc: "Fiyat ve durum güncellemelerini müşteriye tek tıkla veya otomatik şablonlarla iletin.",
                  },
                  {
                    emoji: "📊",
                    title: "Raporlar ve ciro",
                    desc: "Aylık özetler, teslim edilen işler ve gelir takibi — kararlarınızı veriye dayandırın.",
                  },
                  {
                    emoji: "🖨️",
                    title: "Fiş ve etiket",
                    desc: "Müşteri nüshası, teslim fişi ve cihaz etiketi; barkodlu yazdırma ile profesyonel çıktı.",
                  },
                  {
                    emoji: "📱",
                    title: "İkinci el modülü",
                    desc: "Alım/satım kayıtları ve fişlerle ikinci el stokunuzu düzenli tutun.",
                  },
                ].map((f) => (
                  <article
                    key={f.title}
                    className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                  >
                    <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>{f.emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="border-b border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Nasıl çalışır
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Teknik Servis Programına 3 Adımda Başlayın
          </h2>
          <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Kayıt ol",
                desc: "Servis panelinden hesabınızı oluşturun; dakikalar içinde hazırsınız.",
              },
              {
                step: "2",
                title: "Cihaz ekle",
                desc: "Müşteri ve cihaz bilgilerini girin; kayıt numarası ve durum takibi otomatik başlar.",
              },
              {
                step: "3",
                title: "Takip et",
                desc: "Durumları güncelleyin, müşteriyi bilgilendirin ve teslimi tek ekrandan yönetin.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 2 ? (
                  <div
                    className="absolute left-[60%] top-8 hidden w-[80%] border-t-2 border-dashed border-indigo-200 sm:block"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/25">
                  {s.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referanslar */}
      <section className="border-b border-slate-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Referanslar
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Teknik Servisler TamirTakip Hakkında Ne Diyor?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600 sm:text-lg">
            Türkiye&apos;nin dört bir yanındaki teknik servislerden gerçek
            görüşler
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Artık kağıt defter kullanmıyoruz. Müşteri aradığında saniyeler içinde cihazın durumunu söylüyoruz; WhatsApp bildirimi iş yükünü ciddi azalttı.",
                author: "Teknik servis sahibi",
                city: "İzmir",
              },
              {
                quote:
                  "Stok ve servis kayıtları tek yerde. Parça çıkışı yapınca stok düşüyor; ay sonu ciroyu Excel’de toplamakla uğraşmıyoruz.",
                author: "Atölye müdürü",
                city: "Ankara",
              },
              {
                quote:
                  "Müşteri sorgu ekranı sayesinde telefon trafiği yarıya indi. Kayıt numarasıyla hem biz hem müşteri aynı bilgiyi görüyor.",
                author: "Mobil servis koordinatörü",
                city: "İstanbul",
              },
            ].map((t) => (
              <blockquote
                key={t.city}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <p className="text-4xl leading-none text-indigo-200">&ldquo;</p>
                <p className="mt-2 flex-1 text-base leading-relaxed text-slate-700">
                  {t.quote}
                </p>
                <footer className="mt-6 border-t border-slate-100 pt-4 text-sm font-medium text-slate-900">
                  — {t.author}
                  <span className="block text-xs font-normal text-slate-500">
                    {t.city}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="fiyatlandirma" className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Fiyatlandırma
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Yakında açıklanacak
          </h2>
          <p className="mt-4 text-slate-600">
            Paketler ve ücretlendirme netleştiğinde bu alanda duyurulacaktır.
            Şimdilik demo ile deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login?demo=true")}
            className="mt-8 rounded-xl border-2 border-indigo-600 bg-white px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            Demo ile incele
          </button>
        </div>
      </section>

      {/* Kimler Kullanabilir Bölümü */}
      <section
        style={{ padding: "80px 24px", background: "#f9fafb" }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              style={{
                fontSize: "13px",
                color: "#4f46e5",
                fontWeight: 600,
                letterSpacing: "2px",
                marginBottom: "12px",
              }}
            >
              HER TEKNİK SERVİS İÇİN
            </p>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              Hangi Servisler Kullanabilir?
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              TamirTakip, her türlü teknik servis ve tamirci için tasarlanmış
              online servis takip programıdır.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "📱",
                title: "Cep Telefonu Teknik Servisi",
                desc: "iPhone, Samsung, Xiaomi ve tüm marka cep telefonu tamiri için servis takip programı.",
              },
              {
                icon: "📺",
                title: "Televizyon Teknik Servisi",
                desc: "LED, OLED, Smart TV tamiri için televizyon teknik servis takip programı.",
              },
              {
                icon: "🧺",
                title: "Beyaz Eşya Teknik Servisi",
                desc: "Çamaşır makinesi, buzdolabı, bulaşık makinesi tamiri için beyaz eşya servis takip programı.",
              },
              {
                icon: "🎮",
                title: "Oyun Konsolu Servisi",
                desc: "PlayStation, Xbox, Nintendo tamiri için oyun konsolu servis kayıt ve takip programı.",
              },
              {
                icon: "💻",
                title: "Bilgisayar Teknik Servisi",
                desc: "Laptop, masaüstü bilgisayar tamiri için online servis kayıt programı.",
              },
              {
                icon: "🔧",
                title: "Genel Tamir & Servis",
                desc: "Her türlü elektronik cihaz tamiri için kapsamlı teknik servis yönetim programı.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    lineHeight: "1.6",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS Bölümü */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              style={{
                fontSize: "13px",
                color: "#4f46e5",
                fontWeight: 600,
                letterSpacing: "2px",
                marginBottom: "12px",
              }}
            >
              SSS
            </p>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div style={{ display: "grid", gap: "16px" }}>
            {[
              {
                q: "Yapay zeka özellikleri nasıl çalışıyor?",
                a: "TamirTakip, sektördeki tek yapay zeka destekli teknik servis programıdır. Arıza teşhisi için cihaz ve şikayet bilgisini girin, AI olası nedenleri listelesin. Sesli not özelliğiyle mikrofona konuşun, AI metni profesyonel servis notuna dönüştürsün. Fiyat önerisi ise dükkanınızın kendi geçmiş kayıtlarına dayanarak benzer arızalar için fiyat aralığı sunar.",
              },
              {
                q: "TamirTakip nedir?",
                a: "TamirTakip, teknik servisler için geliştirilmiş online servis takip programıdır. Cihaz kayıt, durum takibi, WhatsApp bildirimi, stok yönetimi ve ciro raporlaması gibi tüm servis yönetimi ihtiyaçlarınızı karşılar.",
              },
              {
                q: "Hangi teknik servisler kullanabilir?",
                a: "Cep telefonu, televizyon, beyaz eşya, oyun konsolu, bilgisayar ve her türlü elektronik cihaz tamiri yapan teknik servisler TamirTakip'i kullanabilir.",
              },
              {
                q: "WhatsApp entegrasyonu nasıl çalışıyor?",
                a: "Kendi WhatsApp numaranızı sisteme bağlayarak müşterilerinize otomatik bildirim gönderebilirsiniz. Cihaz durumu değiştiğinde, fiyat bildirimi yapıldığında veya cihaz teslim edildiğinde müşterinize otomatik mesaj gider.",
              },
              {
                q: "Kurulum gerekiyor mu?",
                a: "Hayır, TamirTakip tamamen online çalışan bir servis takip programıdır. Herhangi bir kurulum veya yükleme gerekmez. Kayıt olduktan sonra anında kullanmaya başlayabilirsiniz.",
              },
              {
                q: "Mobil cihazdan kullanabilir miyim?",
                a: "Evet, TamirTakip mobil uyumlu tasarımı ile telefon ve tablet üzerinden de kullanılabilir. Dükkanınızda olmadığınızda bile servis kayıtlarınıza erişebilirsiniz.",
              },
              {
                q: "Verilerimin güvenliği nasıl sağlanıyor?",
                a: "Tüm verileriniz şifreli olarak saklanır. Her dükkanın verileri birbirinden tamamen bağımsızdır. Şirket ayarlarınızı parola korumasıyla güvence altına alabilirsiniz.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "10px",
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Dijital servise bugün adım atın
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Kurulum gerektirmez. Ekibinizle birlikte dakikalar içinde kayıt
            almaya başlayın.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Hemen başlayın
            </button>
            <button
              type="button"
              onClick={() => router.push("/login?demo=true")}
              className="rounded-xl border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Demo ile tanış
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Link
            href="/landing"
            className="flex items-center text-slate-900"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "5px",
                      borderRadius: "1.5px",
                      background: "white",
                    }}
                  />
                  <div
                    style={{
                      width: "10px",
                      height: "14px",
                      borderRadius: "1.5px",
                      background: "white",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5L3.5 6.5L7.5 2"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.5px",
                }}
              >
                tamir
                <span style={{ fontWeight: 300, color: "#4f46e5" }}>takip</span>
              </span>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
            <Link href="/landing" className="hover:text-indigo-600">
              Ana sayfa
            </Link>
            <Link href="/sorgula" className="hover:text-indigo-600">
              Cihaz sorgula
            </Link>
            <Link href="/login" className="hover:text-indigo-600">
              Giriş yap
            </Link>
            <a
              href="/gizlilik-politikasi"
              style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}
            >
              Gizlilik Politikası
            </a>
            <a
              href="/hizmet-sartlari"
              style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}
            >
              Hizmet Şartları
            </a>
          </div>
          <p className="text-center text-xs text-slate-500 sm:text-right">
            © {new Date().getFullYear()} TamirTakip · Tüm hakları saklıdır
          </p>
        </div>
      </footer>
    </main>
    </>
  );
}
