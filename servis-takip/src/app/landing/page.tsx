"use client";

import CookieBanner from "@/components/CookieBanner";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function LandingPage() {
  const [yillikOdeme, setYillikOdeme] = useState(false);
  const router = useRouter();

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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
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
      <section className="border-b border-slate-100 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600">
              Özellikler
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Yapay Zeka Destekli Teknik Servis Programı
            </h2>
          </div>

          {/* AI Özellikleri */}
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-600">
            Yapay Zeka
          </p>
          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            {/* AI Arıza Teşhisi */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-6 border border-indigo-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl shadow-lg">
                  🤖
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Arıza Teşhisi</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Cihaz ve şikayeti girin, yapay zeka olası arızaları ve kontrol adımlarını anında listelesin.
              </p>
              {/* Animasyonlu demo */}
              <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs font-mono text-slate-700 border border-indigo-100">
                <p className="text-indigo-500 mb-1">● Analiz ediliyor...</p>
                <p>1. Batarya bağlantısını kontrol et</p>
                <p>2. Şarj portunu incele</p>
                <p className="animate-pulse text-slate-400">3. ▌</p>
              </div>
            </div>

            {/* Sesli Servis Notu */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 border border-pink-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-xl shadow-lg">
                  🎤
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sesli Servis Notu</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Mikrofona konuşun, AI sözlü notunuzu profesyonel servis raporuna dönüştürsün.
              </p>
              {/* Ses dalgası animasyonu */}
              <div className="mt-4 rounded-xl bg-white/80 p-3 border border-pink-100 flex items-center gap-1.5">
                <div className="h-3 w-1 rounded-full bg-rose-400 animate-[bounce_0.6s_ease-in-out_infinite]" />
                <div className="h-5 w-1 rounded-full bg-rose-500 animate-[bounce_0.6s_ease-in-out_0.1s_infinite]" />
                <div className="h-7 w-1 rounded-full bg-rose-600 animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" />
                <div className="h-4 w-1 rounded-full bg-rose-500 animate-[bounce_0.6s_ease-in-out_0.3s_infinite]" />
                <div className="h-6 w-1 rounded-full bg-rose-400 animate-[bounce_0.6s_ease-in-out_0.4s_infinite]" />
                <div className="h-3 w-1 rounded-full bg-rose-300 animate-[bounce_0.6s_ease-in-out_0.5s_infinite]" />
                <span className="ml-2 text-xs text-slate-500">Dinleniyor...</span>
              </div>
            </div>

            {/* Akıllı Fiyat Önerisi */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border border-emerald-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl shadow-lg">
                  💰
                </div>
                <h3 className="text-lg font-bold text-slate-900">Akıllı Fiyat Önerisi</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Geçmiş servis kayıtlarına dayanarak benzer arızalar için fiyat aralığı önerir.
              </p>
              {/* Fiyat animasyonu */}
              <div className="mt-4 rounded-xl bg-white/80 p-3 border border-emerald-100">
                <p className="text-xs text-slate-500 mb-1">Önerilen fiyat aralığı</p>
                <p className="text-lg font-bold text-emerald-600">₺1.500 — ₺2.000</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-emerald-100">
                  <div className="h-1.5 w-2/3 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Diğer Özellikler */}
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Diğer Özellikler
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { ikon: "📋", baslik: "Cihaz kayıt ve takip", aciklama: "Otomatik kayıt numarası, durum akışı ve geçmiş. Her cihazın nerede olduğunu anında görün." },
              { ikon: "📦", baslik: "Stok yönetimi", aciklama: "Yedek parça stok takibi, uyarılar ve servis kaydına bağlı otomatik stok düşümü." },
              { ikon: "💬", baslik: "WhatsApp bildirimi", aciklama: "Fiyat ve durum güncellemelerini müşteriye tek tıkla veya otomatik şablonlarla iletin." },
              { ikon: "📊", baslik: "Raporlar ve ciro", aciklama: "Aylık özetler, teslim edilen işler ve gelir takibi — kararlarınızı veriye dayandırın." },
              { ikon: "🧾", baslik: "Fiş ve etiket", aciklama: "Müşteri nüshası, teslim fişi ve cihaz etiketi; barkodlu yazdırma ile profesyonel çıktı." },
              { ikon: "🔄", baslik: "İkinci el modülü", aciklama: "Alım/satım kayıtları ve fişlerle ikinci el stokunuzu düzenli tutun." },
            ].map((item) => (
              <div
                key={item.baslik}
                className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xl">
                  {item.ikon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.baslik}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{item.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="border-b border-slate-100 bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Nasıl çalışır
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Teknik Servis Programına 3 Adımda Başlayın
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3">
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
      <section className="border-b border-slate-100 py-12 sm:py-16">
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
      <section id="fiyatlandirma" className="border-b border-slate-100 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600">
              Fiyatlandırma
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              İhtiyacınıza Uygun Planı Seçin
            </h2>
            <p className="mt-3 text-slate-500 text-sm">
              İlk 30 gün tüm özellikler ücretsiz — kredi kartı gerekmez.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setYillikOdeme(false)}
                className={!yillikOdeme ? "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm" : "px-5 py-2 text-sm font-medium text-slate-500"}
              >
                Aylık
              </button>
              <button
                type="button"
                onClick={() => setYillikOdeme(true)}
                className={yillikOdeme ? "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm" : "px-5 py-2 text-sm font-medium text-slate-500"}
              >
                Yıllık <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">2 ay ücretsiz</span>
              </button>
            </div>
          </div>
          {!yillikOdeme && <div className="grid gap-6 lg:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Basic</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺90</span>
                  <span className="mb-1 text-slate-400 text-sm">/ay</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-4 text-sm text-slate-500">Küçük ve tek kişilik servisler için ideal başlangıç.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız cihaz kayıt ve takip</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Cihaz sorgula ekranı</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Fiş, etiket ve müşteri nüshası</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>İkinci el modülü</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Dış servisler ve bekleyen cihazlar</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Cari ve bayi yönetimi</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Planlarım ve hazır tanımlar</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız WhatsApp mesajı ve şablonları</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Yardım ve Destek AI</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Ücretsiz Başla</button>
            </div>
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow">En Çok Tercih Edilen</span>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Premium</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺130</span>
                  <span className="mb-1 text-slate-400 text-sm">/ay</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-4 text-sm text-slate-500">Büyüyen servisler için ekip ve analiz özellikleri.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Tüm Basic Paket İçeriği</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Stok yönetimi</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Raporlar ve ciro görünümü</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Tüm AI özellikleri</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Google Contacts entegrasyonu</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>5 personele kadar kullanım</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Personel yetki ve giriş yönetimi</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg">Ücretsiz Başla</button>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Enterprise</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺160</span>
                  <span className="mb-1 text-slate-400 text-sm">/ay</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-4 text-sm text-slate-500">Çok personelli ve büyük servisler için tam güç.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Tüm Premium Paket İçeriği</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız personel</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Haftalık rapor e-postası</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Öncelikli destek</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Ücretsiz Başla</button>
            </div>
          </div>}
          {yillikOdeme && <div className="grid gap-6 lg:grid-cols-3">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Basic</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺900</span>
                  <span className="mb-1 text-slate-400 text-sm">/yıl</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">Aylık ₺75 — 2 ay ücretsiz</p>
                <p className="mt-4 text-sm text-slate-500">Küçük ve tek kişilik servisler için ideal başlangıç.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız cihaz kayıt ve takip</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Cihaz sorgula ekranı</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Fiş, etiket ve müşteri nüshası</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>İkinci el modülü</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Dış servisler ve bekleyen cihazlar</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Cari ve bayi yönetimi</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Planlarım ve hazır tanımlar</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız WhatsApp mesajı ve şablonları</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Yardım ve Destek AI</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Ücretsiz Başla</button>
            </div>
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow">En Çok Tercih Edilen</span>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Premium</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺1.300</span>
                  <span className="mb-1 text-slate-400 text-sm">/yıl</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">Aylık ₺108 — 2 ay ücretsiz</p>
                <p className="mt-4 text-sm text-slate-500">Büyüyen servisler için ekip ve analiz özellikleri.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Tüm Basic Paket İçeriği</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Stok yönetimi</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Raporlar ve ciro görünümü</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Tüm AI özellikleri</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Google Contacts entegrasyonu</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>5 personele kadar kullanım</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-indigo-500">✓</span>Personel yetki ve giriş yönetimi</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg">Ücretsiz Başla</button>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Enterprise</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">₺1.600</span>
                  <span className="mb-1 text-slate-400 text-sm">/yıl</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">+KDV (%20)</p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">Aylık ₺133 — 2 ay ücretsiz</p>
                <p className="mt-4 text-sm text-slate-500">Çok personelli ve büyük servisler için tam güç.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Tüm Premium Paket İçeriği</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Sınırsız personel</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Haftalık rapor e-postası</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Öncelikli destek</li>
                </ul>
              </div>
              <button type="button" onClick={() => router.push("/login?register=true")} className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Ücretsiz Başla</button>
            </div>
          </div>}
          <p className="mt-8 text-center text-xs text-slate-400">Tüm planlar 30 günlük ücretsiz denemeyle başlar. Kredi kartı gerekmez. İstediğiniz zaman iptal edebilirsiniz.</p>
        </div>
      </section>      {/* Kimler Kullanabilir Bölümü */}
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
            <a href="/kvkk" className="text-sm text-slate-500 hover:text-slate-700 transition">
              KVKK
            </a>
          </div>
          <p className="text-center text-xs text-slate-500 sm:text-right">
            © {new Date().getFullYear()} TamirTakip · Tüm hakları saklıdır
          </p>
        </div>
      </footer>
      <CookieBanner />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "TamirTakip",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Türkiye'nin yapay zeka destekli teknik servis takip programı. Cihaz kayıt, WhatsApp bildirimi, stok yönetimi tek platformda.",
            url: "https://www.tamirtakip.com.tr",
            offers: {
              "@type": "Offer",
              price: "90",
              priceCurrency: "TRY",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: "90",
                priceCurrency: "TRY",
                unitText: "MONTH",
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "50",
            },
            inLanguage: "tr",
          }),
        }}
      />
    </main>
    </>
  );
}











