import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TamirTakip — Online Teknik Servis Takip Programı | Ücretsiz Dene",
  description:
    "Türkiye'nin teknik servisleri için geliştirilmiş online servis takip programı. Cihaz kayıt, durum takibi, WhatsApp bildirimi, stok ve ciro yönetimi. Cep telefonu, beyaz eşya, televizyon servisleri için idealdir.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
