import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppThemeProvider } from "@/components/theme-provider";
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
  title: "Servis Takip",
  description: "Teknik servis takip uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "font-sans")}
    >
      <body className="antialiased">
        <AppThemeProvider>
          {children}
          <Toaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}
