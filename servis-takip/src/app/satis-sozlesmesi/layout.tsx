import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | TamirTakip",
  description: "TamirTakip mesafeli satış sözleşmesi.",
  alternates: { canonical: "/satis-sozlesmesi" },
  openGraph: {
    title: "Mesafeli Satış Sözleşmesi | TamirTakip",
    description: "TamirTakip mesafeli satış sözleşmesi.",
    url: "/satis-sozlesmesi",
    siteName: "TamirTakip",
    locale: "tr_TR",
    type: "website",
  },
};

export default function SatisSozlesmesiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
