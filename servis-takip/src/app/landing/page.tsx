"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);

  function goLogin() {
    router.push("/login");
  }

  function scrollToPricing() {
    document
      .getElementById("fiyatlandirma")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function goDemoLogin() {
    router.push("/login?demo=true");
  }

  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-brand">
            <span className="lp-brand-dot" aria-hidden />
            <span className="lp-brand-name">Servis Takip</span>
          </div>
          <div className="lp-nav-right">
            <button
              type="button"
              className="lp-btn-sorgula"
              onClick={() => router.push("/sorgula")}
            >
              Cihaz Sorgula
            </button>
            <button type="button" className="lp-btn-servis-panel" onClick={goLogin}>
              Servis Paneli
            </button>
          </div>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-inner">
          <span className="lp-hero-badge">
            ✦ Tüm Teknik Servisler İçin Tasarlandı
          </span>
          <h1 className="lp-hero-title">
            Servis yönetimini
            <br />
            <span className="lp-hero-title-accent">kolaylaştırın</span>
          </h1>
          <p className="lp-hero-lead">
            Cihaz kayıt, takip, stok ve WhatsApp bildirimleri — hepsi tek
            platformda.
          </p>
          <p className="lp-hero-tagline">
            Anasayfamız kadar sade ve anlaşılır bir tasarımda :)
          </p>
          <div className="lp-hero-actions">
            <button
              type="button"
              className="lp-btn-primary-lg"
              onClick={scrollToPricing}
            >
              Kullanmaya Başlayın
            </button>
            <button
              type="button"
              className="lp-btn-secondary-lg"
              onClick={goDemoLogin}
            >
              Demo İncele
            </button>
          </div>
          <p className="lp-hero-note">
            Kurulum gerektirmez · 5 dakikada başlayın
          </p>
        </div>
      </section>

      <div className="lp-social">
        <div className="lp-inner lp-social-inner">
          <span>✓ Kurulum desteği dahil</span>
          <span className="lp-social-sep">|</span>
          <span>✓ Türkçe arayüz</span>
          <span className="lp-social-sep">|</span>
          <span>✓ WhatsApp entegrasyonu</span>
        </div>
      </div>

      <section className="lp-features">
        <div className="lp-inner">
          <p className="lp-section-label">ÖZELLİKLER</p>
          <h2 className="lp-section-h2">
            İhtiyacınız olan her şey, tek platformda
          </h2>
          <div className="lp-feature-grid">
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#F0EFFE" }}>
                🔧
              </div>
              <h3 className="lp-feature-h3">Cihaz Kayıt ve Takip</h3>
              <p className="lp-feature-desc">
                Otomatik kayıt numarası, durum takibi ve geçmiş. Her cihazın
                nerede olduğunu bilin.
              </p>
            </article>
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#E8F5E9" }}>
                📦
              </div>
              <h3 className="lp-feature-h3">Stok Yönetimi</h3>
              <p className="lp-feature-desc">
                Yedek parça stok takibi, stok uyarıları ve stoktan otomatik
                düşüş.
              </p>
            </article>
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#E8F5E9" }}>
                💬
              </div>
              <h3 className="lp-feature-h3">WhatsApp Bildirimi</h3>
              <p className="lp-feature-desc">
                Fiyat bildirimi ve cihazın durum güncellemelerini müşteriye
                otomatik gönderin.
              </p>
            </article>
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#FFF8E1" }}>
                📊
              </div>
              <h3 className="lp-feature-h3">Raporlar ve Ciro</h3>
              <p className="lp-feature-desc">
                Aylık/yıllık raporlar, ciro takibi ve ikinci el kar/zarar özeti.
              </p>
            </article>
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#FFF3E0" }}>
                🖨
              </div>
              <h3 className="lp-feature-h3">Fiş ve Etiket Yazdırma</h3>
              <p className="lp-feature-desc">
                Müşteri nüshası, cihaz etiketi ve kargo fişi — barkodlu
                yazdırma.
              </p>
            </article>
            <article className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: "#E3F2FD" }}>
                📱
              </div>
              <h3 className="lp-feature-h3">İkinci El Yönetimi</h3>
              <p className="lp-feature-desc">
                Alım/satım kayıtları, alış ve satış fişi ile tam takip.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-how">
        <div className="lp-inner">
          <p className="lp-section-label">NASIL ÇALIŞIR</p>
          <h2 className="lp-section-h2 lp-how-h2">
            5 adımda dijital servise geçin
          </h2>
          <div className="lp-steps-row">
            <div className="lp-step">
              <div className="lp-step-circle">1</div>
              <div className="lp-step-title">Cihaz Kayıt</div>
              <p className="lp-step-desc">
                Müşteri ve cihaz bilgilerini girin
              </p>
            </div>
            <span className="lp-step-arrow" aria-hidden>
              →
            </span>
            <div className="lp-step">
              <div className="lp-step-circle">2</div>
              <div className="lp-step-title">Durum Takibi</div>
              <p className="lp-step-desc">Cihazın durumunu güncelleyin</p>
            </div>
            <span className="lp-step-arrow" aria-hidden>
              →
            </span>
            <div className="lp-step">
              <div className="lp-step-circle">3</div>
              <div className="lp-step-title">WA Bildirimi</div>
              <p className="lp-step-desc">
                Müşteriye otomatik mesaj gönderin
              </p>
            </div>
            <span className="lp-step-arrow" aria-hidden>
              →
            </span>
            <div className="lp-step">
              <div className="lp-step-circle">4</div>
              <div className="lp-step-title">Teslim</div>
              <p className="lp-step-desc">
                Cihazı teslim edin, ciro hesaplanır
              </p>
            </div>
            <span className="lp-step-arrow" aria-hidden>
              →
            </span>
            <div className="lp-step">
              <div className="lp-step-circle">5</div>
              <div className="lp-step-title">Raporlama</div>
              <p className="lp-step-desc">Performansınızı takip edin</p>
            </div>
          </div>
        </div>
      </section>

      <section id="fiyatlandirma" className="lp-price-section">
        <div className="lp-inner">
          <p className="lp-section-label">FİYATLANDIRMA</p>
          <h2 className="lp-section-h2 lp-price-h2">Şeffaf ve basit fiyat</h2>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                background: "#f0f0f0",
                borderRadius: "10px",
                padding: "4px",
                margin: "24px 0 40px",
              }}
            >
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                background: !isYearly ? "#fff" : "transparent",
                color: !isYearly ? "#0f0f0f" : "#666",
                boxShadow: !isYearly ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                background: isYearly ? "#fff" : "transparent",
                color: isYearly ? "#0f0f0f" : "#666",
                boxShadow: isYearly ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              Yıllık
              <span
                style={{
                  marginLeft: "6px",
                  background: "#534AB7",
                  color: "white",
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                %17 indirim
              </span>
            </button>
          </div>
          </div>
          <p className="lp-price-lead">
            Gizli ücret yok. Tüm özellikler tek pakette.
          </p>
          <div className="lp-price-card">
            <div className="lp-price-badge">
              {isYearly ? "En Avantajlı" : "En Popüler"}
            </div>
            <div
              style={{ transition: "all 0.3s" }}
              className="lp-price-display"
            >
              <div className="lp-price-row">
                <span className="lp-price-num">
                  {isYearly ? "₺XXX" : "₺XXX"}
                </span>
                <span className="lp-price-per"> /ay</span>
              </div>
              {isYearly ? (
                <p className="lp-price-yearly-bill">₺XXXX yıllık faturalandırılır</p>
              ) : null}
            </div>
            <p className="lp-price-sub">Tüm özellikler dahil</p>
            <ul className="lp-price-list">
              <li>✓ Sınırsız cihaz kaydı</li>
              <li>✓ WhatsApp bildirimleri modülü</li>
              <li>✓ Stok yönetimi modülü</li>
              <li>✓ İkinci el modülü</li>
              <li>✓ Raporlar ve ciro takibi modülü</li>
              <li>✓ Kurulum ve destek dahil</li>
            </ul>
            <button type="button" className="lp-price-cta" onClick={goLogin}>
              Hemen Başla →
            </button>
          </div>
        </div>
      </section>

      <section className="lp-quote-section">
        <span className="lp-quote-mark">&quot;</span>
        <blockquote className="lp-quote-text">
          Artık kağıt defter kullanmıyoruz. Müşteri &apos;cihazım hazır
          mı?&apos; diye aradığında saniyeler içinde cevap verebiliyoruz.
          WhatsApp bildirimi ise hayat kurtarıyor.
        </blockquote>
        <p className="lp-quote-author">— Teknik Servis Sahibi, İzmir</p>
      </section>

      <section className="lp-bottom-cta">
        <div className="lp-inner">
          <h2 className="lp-bottom-cta-title">
            Ücretsiz Demomuzu İnceledikten Sonra Başlayın.
          </h2>
          <p className="lp-bottom-cta-lead">
            Kurulum gerektirmez, 5 dakikada başlayın.
          </p>
          <button
            type="button"
            className="lp-bottom-cta-btn"
            onClick={scrollToPricing}
          >
            Hemen Başlayın
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span>© 2026 Servis Takip</span>
          <span>Tüm hakları saklıdır</span>
        </div>
      </footer>

      <style jsx>{`
        .lp {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #ffffff;
          color: #0f0f0f;
          min-height: 100vh;
        }

        .lp *,
        .lp *::before,
        .lp *::after {
          box-sizing: border-box;
        }

        .lp-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid #f0f0f0;
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
        }

        .lp-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lp-brand-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #534ab7;
          flex-shrink: 0;
        }

        .lp-brand-name {
          font-size: 16px;
          font-weight: 600;
          color: #0f0f0f;
        }

        .lp-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lp-btn-sorgula {
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          background: white;
          color: #534ab7;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }

        .lp-btn-sorgula:hover {
          background: #fafafa;
        }

        .lp-btn-servis-panel {
          background: #ffffff;
          color: #534ab7;
          border: 2px solid #534ab7;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .lp-btn-servis-panel:hover {
          background: #f0effe;
        }

        .lp-hero {
          padding: 100px 40px 80px;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }

        .lp-hero-badge {
          display: inline-block;
          background: #f0effe;
          color: #534ab7;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .lp-hero-title {
          font-size: 52px;
          font-weight: 700;
          line-height: 1.1;
          color: #0f0f0f;
          margin: 24px 0 20px;
        }

        .lp-hero-title-accent {
          color: #534ab7;
        }

        .lp-hero-lead {
          font-size: 18px;
          color: #666666;
          max-width: 520px;
          margin: 0 auto 10px;
          line-height: 1.6;
        }

        .lp-hero-tagline {
          font-size: 15px;
          font-weight: 600;
          color: #534ab7;
          max-width: 520px;
          margin: 0 auto 36px;
          line-height: 1.5;
          letter-spacing: -0.01em;
        }

        .lp-hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .lp-btn-primary-lg {
          background: #534ab7;
          color: #ffffff;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .lp-btn-primary-lg:hover {
          opacity: 0.92;
        }

        .lp-btn-secondary-lg {
          background: transparent;
          color: #534ab7;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          border: 2px solid #534ab7;
          cursor: pointer;
          font-family: inherit;
        }

        .lp-btn-secondary-lg:hover {
          background: rgba(83, 74, 183, 0.06);
        }

        .lp-hero-note {
          font-size: 13px;
          color: #999999;
          margin-top: 16px;
        }

        .lp-social {
          background: #f8f7ff;
          border-top: 1px solid #ede9ff;
          border-bottom: 1px solid #ede9ff;
          padding: 16px 40px;
        }

        .lp-social-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          font-size: 13px;
          color: #666666;
          flex-wrap: wrap;
        }

        .lp-social-sep {
          color: #cccccc;
          user-select: none;
        }

        .lp-features {
          padding: 80px 40px;
          text-align: center;
        }

        .lp-section-label {
          font-size: 12px;
          color: #534ab7;
          font-weight: 600;
          letter-spacing: 2px;
          margin: 0;
        }

        .lp-section-h2 {
          font-size: 36px;
          font-weight: 700;
          color: #0f0f0f;
          margin: 12px 0 48px;
        }

        .lp-how-h2 {
          margin-bottom: 48px;
        }

        .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          text-align: left;
        }

        .lp-feature-card {
          background: #ffffff;
          border: 1px solid #eeeeee;
          border-radius: 16px;
          padding: 28px;
          transition: all 0.2s ease;
        }

        .lp-feature-card:hover {
          border-color: #534ab7;
          transform: translateY(-2px);
        }

        .lp-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .lp-feature-h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 16px 0 8px;
          color: #0f0f0f;
        }

        .lp-feature-desc {
          font-size: 14px;
          color: #666666;
          line-height: 1.6;
          margin: 0;
        }

        .lp-how {
          background: #fafafa;
          padding: 80px 40px;
          text-align: center;
        }

        .lp-steps-row {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 0;
          flex-wrap: wrap;
        }

        .lp-step {
          width: 180px;
          text-align: center;
          position: relative;
          padding: 0 12px;
        }

        .lp-step-arrow {
          color: #534ab7;
          font-size: 20px;
          line-height: 48px;
          padding: 0 4px;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 12px;
        }

        .lp-step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #534ab7;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .lp-step-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f0f0f;
          margin-bottom: 6px;
        }

        .lp-step-desc {
          font-size: 12px;
          color: #666666;
          line-height: 1.5;
          margin: 0;
        }

        .lp-price-section {
          padding: 80px 40px;
          text-align: center;
        }

        .lp-price-h2 {
          margin-bottom: 0;
        }

        .lp-price-lead {
          font-size: 16px;
          color: #666666;
          margin: 0 0 8px;
        }

        .lp-price-display {
          width: 100%;
        }

        .lp-price-yearly-bill {
          margin: 10px 0 0;
          font-size: 13px;
          font-weight: 500;
          opacity: 0.85;
          color: #ffffff;
        }

        .lp-price-card {
          max-width: 420px;
          margin: 40px auto 0;
          background: #534ab7;
          border-radius: 20px;
          padding: 40px;
          color: #ffffff;
          text-align: center;
        }

        .lp-price-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .lp-price-row {
          line-height: 1;
        }

        .lp-price-num {
          font-size: 52px;
          font-weight: 700;
        }

        .lp-price-per {
          font-size: 18px;
          opacity: 0.8;
        }

        .lp-price-sub {
          font-size: 14px;
          opacity: 0.8;
          margin: 12px 0 32px;
        }

        .lp-price-list {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #ffffff;
          font-size: 14px;
        }

        .lp-price-cta {
          background: #ffffff;
          color: #534ab7;
          border: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 32px;
          width: 100%;
          font-family: inherit;
        }

        .lp-price-cta:hover {
          opacity: 0.95;
        }

        .lp-quote-section {
          padding: 60px 40px;
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .lp-quote-mark {
          font-size: 80px;
          color: #534ab7;
          line-height: 0.5;
          display: block;
          margin-bottom: 20px;
          font-family: Georgia, serif;
        }

        .lp-quote-text {
          font-size: 20px;
          color: #0f0f0f;
          line-height: 1.6;
          font-style: italic;
          margin: 0;
          font-weight: 400;
        }

        .lp-quote-author {
          font-size: 14px;
          color: #666666;
          margin-top: 16px;
          margin-bottom: 0;
        }

        .lp-bottom-cta {
          background: #0f0f0f;
          padding: 80px 40px;
          text-align: center;
        }

        .lp-bottom-cta-title {
          font-size: 36px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .lp-bottom-cta-lead {
          font-size: 16px;
          color: #999999;
          margin: 12px 0 32px;
        }

        .lp-bottom-cta-btn {
          background: #534ab7;
          color: #ffffff;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .lp-bottom-cta-btn:hover {
          opacity: 0.92;
        }

        .lp-footer {
          background: #0f0f0f;
          border-top: 1px solid #222222;
          padding: 24px 40px;
          color: #666666;
          font-size: 13px;
        }

        .lp-footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
