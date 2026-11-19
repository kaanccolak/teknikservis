import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/landing", "/login"],
      disallow: ["/api/", "/admin"],
    },
    sitemap: "https://www.tamirtakip.com.tr/sitemap.xml",
  };
}
