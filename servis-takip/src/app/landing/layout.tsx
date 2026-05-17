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
  return children;
}
