import type { MetadataRoute } from "next";
import { blogPosts } from "./blog/data";

const STATIC_LAST_MODIFIED = "2026-01-01";

const TURKISH_MONTHS: Record<string, string> = {
  Ocak: "01",
  Şubat: "02",
  Mart: "03",
  Nisan: "04",
  Mayıs: "05",
  Haziran: "06",
  Temmuz: "07",
  Ağustos: "08",
  Eylül: "09",
  Ekim: "10",
  Kasım: "11",
  Aralık: "12",
};

function blogLastModified(date: string): string {
  const [day, month, year] = date.split(" ");
  const monthNumber = TURKISH_MONTHS[month];
  if (!day || !monthNumber || !year) return STATIC_LAST_MODIFIED;
  return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `https://www.tamirtakip.com.tr/blog/${post.slug}`,
    lastModified: blogLastModified(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const staticPage = (
    path: string,
    changeFrequency: "weekly" | "monthly" | "yearly",
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: `https://www.tamirtakip.com.tr${path}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency,
    priority,
  });

  return [
    staticPage("/landing", "weekly", 1),
    staticPage("/blog", "weekly", 0.8),
    ...blogUrls,
    staticPage("/sorgula", "monthly", 0.6),
    staticPage("/iade-politikasi", "yearly", 0.3),
    staticPage("/kvkk", "yearly", 0.3),
    staticPage("/gizlilik-politikasi", "yearly", 0.3),
    staticPage("/hizmet-sartlari", "yearly", 0.3),
    staticPage("/satis-sozlesmesi", "yearly", 0.3),
    staticPage("/hizmet-teslimat", "yearly", 0.3),
  ];
}
