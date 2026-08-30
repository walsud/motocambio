import type { MetadataRoute } from "next";

// Qué puede indexar Google (y qué no: las zonas privadas)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/garage", "/match/", "/panel", "/admin", "/api/", "/recuperar", "/verificar"],
    },
    sitemap: "https://motocambio.com.ar/sitemap.xml",
  };
}
