import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cihaz Durumu Sorgula | TamirTakip",
  description:
    "Kayıt numaranızla teknik servisteki cihazınızın durumunu online sorgulayın.",
  alternates: { canonical: "/sorgula" },
  openGraph: {
    title: "Cihaz Durumu Sorgula | TamirTakip",
    description:
      "Kayıt numaranızla teknik servisteki cihazınızın durumunu online sorgulayın.",
    url: "/sorgula",
    siteName: "TamirTakip",
    locale: "tr_TR",
    type: "website",
  },
};

export default function SorgulaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
