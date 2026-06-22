"use client";
import Link from "next/link";

export default function HizmetTeslimatPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif", color: "#111827", lineHeight: 1.7 }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/landing" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px" }}>← Ana Sayfaya Dön</Link>
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Teslimat ve Hizmet Koşulları</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Son güncelleme: Haziran 2026</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>Hizmet Niteliği</h2>
      <p>TamirTakip, fiziksel ürün satışı yapmayan, tamamen dijital bir yazılım hizmetidir (SaaS). Kargo veya fiziksel teslimat söz konusu değildir.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>Hizmet Aktivasyonu</h2>
      <p>Abonelik ödemesi onaylandıktan sonra hesabınız <strong>anında</strong> aktive edilir. Aktivasyon bildirimi kayıtlı e-posta adresinize gönderilir. Herhangi bir kurulum veya yükleme gerekmez; hizmete web tarayıcınız üzerinden hemen erişebilirsiniz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>Erişim Koşulları</h2>
      <p>Hizmet 7/24 erişilebilir durumdadır. Planlı bakım çalışmaları öncesinde kullanıcılar bilgilendirilir. Teknik bir sorun yaşamanız durumunda destek@tamirtakip.com.tr adresinden bize ulaşabilirsiniz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>Deneme Süresi</h2>
      <p>Tüm yeni kullanıcılara <strong>30 günlük ücretsiz deneme</strong> sunulmaktadır. Deneme süresi boyunca kredi kartı bilgisi talep edilmez ve herhangi bir ücret alınmaz.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>Destek</h2>
      <p>Teknik destek ve sorularınız için: <a href="mailto:destek@tamirtakip.com.tr" style={{ color: "#4f46e5" }}>destek@tamirtakip.com.tr</a> | +90 537 766 42 48</p>
    </div>
  );
}
