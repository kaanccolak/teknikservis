import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TamirTakip — Teknik Servis Takip Programı | Yapay Zeka Destekli",
  description:
    "Türkiye'nin en gelişmiş teknik servis takip programı. AI arıza teşhisi, WhatsApp bildirimi, stok yönetimi, ciro takibi. Kurulum gerektirmez, tarayıcıdan anında kullanın.",
  keywords: [
    "teknik servis takip programı",
    "servis takip programı",
    "teknik servis yazılımı",
    "servis yönetim programı",
    "tamir servisi programı",
    "cep telefonu servis programı",
    "beyaz eşya servis takip",
    "WhatsApp servis bildirimi",
    "yapay zeka teknik servis",
    "online servis kayıt programı",
    "teknik servis uygulaması",
    "servis takip uygulaması",
  ],
  alternates: {
    canonical: "https://www.tamirtakip.com.tr/landing",
  },
  openGraph: {
    title: "TamirTakip — Teknik Servis Takip Programı",
    description:
      "Türkiye'nin en gelişmiş teknik servis takip programı. AI arıza teşhisi, WhatsApp bildirimi, stok yönetimi tek platformda.",
    url: "https://www.tamirtakip.com.tr/landing",
    siteName: "TamirTakip",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "TamirTakip — Teknik Servis Takip Programı",
    description:
      "Türkiye'nin en gelişmiş teknik servis takip programı. Yapay zeka destekli, kurulum gerektirmez.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://www.tamirtakip.com.tr/#software",
                name: "TamirTakip",
                url: "https://www.tamirtakip.com.tr",
                description:
                  "Teknik servis işletmeleri için bulut tabanlı yönetim yazılımı. Cihaz kayıt, müşteri takibi, WhatsApp bildirimi, stok yönetimi ve raporlama.",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: [
                  {
                    "@type": "Offer",
                    name: "Basic",
                    price: "100",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "100",
                      priceCurrency: "TRY",
                      unitCode: "MON",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Premium",
                    price: "180",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "180",
                      priceCurrency: "TRY",
                      unitCode: "MON",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Enterprise",
                    price: "280",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "280",
                      priceCurrency: "TRY",
                      unitCode: "MON",
                    },
                  },
                ],
                featureList: [
                  "Cihaz kayıt ve takip",
                  "WhatsApp bildirim sistemi",
                  "İkinci el cihaz modülü",
                  "Stok yönetimi",
                  "Personel yönetimi",
                  "Raporlar ve ciro takibi",
                  "Google Contacts entegrasyonu",
                  "Bayi ve cari yönetimi",
                ],
                inLanguage: "tr",
                availableLanguage: "Turkish",
                countriesSupported: "TR",
              },
              {
                "@type": "Organization",
                "@id": "https://www.tamirtakip.com.tr/#organization",
                name: "TamirTakip",
                url: "https://www.tamirtakip.com.tr",
                logo: "https://www.tamirtakip.com.tr/icon.svg",
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "destek@tamirtakip.com.tr",
                  contactType: "customer support",
                  availableLanguage: "Turkish",
                },
              },
              {
                "@type": "WebSite",
                "@id": "https://www.tamirtakip.com.tr/#website",
                url: "https://www.tamirtakip.com.tr",
                name: "TamirTakip",
                description: "Teknik servis takip programı",
                inLanguage: "tr",
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
