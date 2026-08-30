import type { MetadataRoute } from "next";

const BASE = "https://motocambio.com.ar";

// El mapa del sitio para Google: las páginas fijas + cada ficha de moto
// publicada. Se regenera solo (como mucho cada hora).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explorar`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/oportunidades`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/registro`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Las fichas de motos publicadas
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/motos_publicas?select=id,creado_el&order=creado_el.desc&limit=500`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        next: { revalidate: 3600 },
      }
    );
    if (r.ok) {
      const motos: { id: string; creado_el: string }[] = await r.json();
      return [
        ...fijas,
        ...motos.map((m) => ({
          url: `${BASE}/moto/${m.id}`,
          lastModified: new Date(m.creado_el),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ];
    }
  } catch {
    // sin fichas no se cae el sitemap
  }
  return fijas;
}
