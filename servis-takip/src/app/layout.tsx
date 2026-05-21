import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TamirTakip — Teknik Servis Takip Programı",
  description:
    "TamirTakip, teknik servisler için online servis takip programı. Cihaz kayıt, WhatsApp bildirimi, stok yönetimi ve raporlama tek platformda. Cep telefonu, beyaz eşya, televizyon tamiri için servis yönetim yazılımı.",
  keywords: [
    "teknik servis takip programı",
    "online servis takip programı",
    "servis takip programı",
    "teknik servis programı",
    "online servis programı",
    "online servis kayıt programı",
    "servis kayıt programı",
    "teknik servis",
    "cep telefonu teknik servis programı",
    "cep telefonu teknik servis takip programı",
    "telefoncu teknik servis takip programı",
    "telefon tamiri teknik servis takip",
    "beyaz eşya teknik servis takip programı",
    "beyaz eşya servis takip",
    "beyaz eşya servis takip programı",
    "televizyon tamiri takip programı",
    "televizyon teknik servis takip programı",
    "whatsapp servis bildirimi",
    "tamirci yönetim programı",
    "teknik servis takip",
    "tamirtakip",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  metadataBase: new URL("https://tamirtakip.com.tr"),
  openGraph: {
    title: "TamirTakip — Teknik Servis Takip Programı",
    description:
      "Teknik servisler için online cihaz kayıt, takip ve WhatsApp bildirim platformu.",
    url: "https://tamirtakip.com.tr",
    siteName: "TamirTakip",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TamirTakip — Teknik Servis Takip Programı",
    description:
      "Teknik servisler için online cihaz kayıt, takip ve WhatsApp bildirim platformu.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://tamirtakip.com.tr",
  },
  verification: {
    google: "acF0jejAxOq2qcKxmXaCisP1QTv9z6we4zw9i0P4aUE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={cn(geistSans.variable, geistMono.variable, "font-sans")}
    >
      <head>
        <link
          rel="preload"
          href="/_next/static/media/8e9860b6e62d6359-s.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
