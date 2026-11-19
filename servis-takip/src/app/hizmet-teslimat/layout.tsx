import type { Metadata } from "next";
import { siteOgImage } from "@/lib/site-og";

export const metadata: Metadata = {
  title: "Teslimat ve Hizmet Koşulları | TamirTakip",
  description: "TamirTakip hizmet teslimat koşulları.",
  alternates: { canonical: "/hizmet-teslimat" },
  openGraph: {
    title: "Teslimat ve Hizmet Koşulları | TamirTakip",
    description: "TamirTakip hizmet teslimat koşulları.",
    url: "/hizmet-teslimat",
    siteName: "TamirTakip",
    locale: "tr_TR",
    type: "website",
    images: [siteOgImage],
  },
};

export default function HizmetTeslimatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
