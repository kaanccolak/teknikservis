import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/sorgula" },
};

export default function SorgulaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
