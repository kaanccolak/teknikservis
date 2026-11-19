import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/hizmet-teslimat" },
};

export default function HizmetTeslimatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
