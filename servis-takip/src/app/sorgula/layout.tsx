import type { Metadata } from "next";
import { siteOgImage } from "@/lib/site-og";

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
    images: [siteOgImage],
  },
};

export default function SorgulaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
