import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teknik Servis Takip Programı | TamirTakip — Ücretsiz Deneyin",
  description:
    "Teknik servis takip programı arıyorsanız TamirTakip'i deneyin. Cihaz kayıt, WhatsApp bildirimi, stok yönetimi, AI arıza teşhisi. Kurulum gerektirmez. 30 gün ücretsiz.",
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
    "teknik servis takip",
    "telefon tamiri programı",
    "elektronik servis yazılımı",
    "ücretsiz servis takip programı",
  ],
  alternates: {
    canonical: "/landing",
  },
  openGraph: {
    title: "Teknik Servis Takip Programı | TamirTakip",
    description:
      "Teknik servis takip programı arıyorsanız TamirTakip'i deneyin. WhatsApp bildirimi, AI arıza teşhisi, stok yönetimi tek platformda. 30 gün ücretsiz.",
    url: "/landing",
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
                    price: "130",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "130",
                      priceCurrency: "TRY",
                      unitText: "MONTH",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Basic",
                    price: "1300",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "1300",
                      priceCurrency: "TRY",
                      unitText: "YEAR",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Premium",
                    price: "210",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "210",
                      priceCurrency: "TRY",
                      unitText: "MONTH",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Premium",
                    price: "2100",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "2100",
                      priceCurrency: "TRY",
                      unitText: "YEAR",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Enterprise",
                    price: "300",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "300",
                      priceCurrency: "TRY",
                      unitText: "MONTH",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Enterprise",
                    price: "3000",
                    priceCurrency: "TRY",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "3000",
                      priceCurrency: "TRY",
                      unitText: "YEAR",
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
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.tamirtakip.com.tr/logo.png",
                  width: 512,
                  height: 512,
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+90-537-766-42-48",
                  email: "destek@tamirtakip.com.tr",
                  contactType: "customer support",
                  availableLanguage: "Turkish",
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "İzmir",
                  addressCountry: "TR",
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
