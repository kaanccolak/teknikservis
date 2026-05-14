import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TamirTakip — Yapay Zeka Destekli Teknik Servis Takip Programı",
  description:
    "TamirTakip ile teknik servis işlerinizi yapay zeka destekli olarak yönetin. AI arıza teşhisi, sesli servis notu, akıllı fiyat önerisi. Cihaz kayıt, WhatsApp bildirimi, stok yönetimi tek platformda. Kurulum gerektirmez.",
  keywords: [
    "teknik servis takip programı",
    "servis yönetim yazılımı",
    "yapay zeka teknik servis",
    "tamir servisi programı",
    "cep telefonu servis programı",
    "beyaz eşya servis takip",
    "WhatsApp servis bildirimi",
  ],
  openGraph: {
    title: "TamirTakip — Yapay Zeka Destekli Teknik Servis Takip Programı",
    description:
      "AI arıza teşhisi, sesli servis notu ve akıllı fiyat önerisi ile Türkiye'nin en gelişmiş teknik servis yönetim programı.",
    url: "https://tamirtakip.com.tr",
    type: "website",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
