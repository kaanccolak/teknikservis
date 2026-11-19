import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/satis-sozlesmesi" },
};

export default function SatisSozlesmesiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
