import type { Metadata } from "next";

// La ficha pública de cada moto, contada a Google: título y descripción
// propios por moto, más datos estructurados (schema.org) para que pueda
// mostrarla como producto en los resultados.

interface MotoSEO {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precio_usd: number | null;
  provincia: string | null;
  fotos: string[];
  categoria: string | null;
  cilindrada: number;
}

async function traerMoto(id: string): Promise<MotoSEO | null> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/motos_publicas?id=eq.${encodeURIComponent(id)}&select=id,marca,modelo,anio,km,precio_usd,provincia,fotos,categoria,cilindrada`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        next: { revalidate: 600 },
      }
    );
    if (!r.ok) return null;
    const datos = (await r.json()) as MotoSEO[];
    return datos[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const m = await traerMoto(id);
  if (!m) {
    return { title: "Moto en permuta", robots: { index: false } };
  }
  const titulo = `${m.marca} ${m.modelo} ${m.anio} en permuta`;
  const descripcion = `${m.marca} ${m.modelo} ${m.anio}, ${m.km.toLocaleString("es-AR")} km, en ${m.provincia || "Argentina"}.${
    m.precio_usd ? ` Valor pretendido USD ${Number(m.precio_usd).toLocaleString("es-AR")}.` : ""
  } Proponé el cambio por tu moto en Motocambio.`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/moto/${m.id}` },
    openGraph: {
      title: `${titulo} · Motocambio`,
      description: descripcion,
      images: m.fotos?.length ? [{ url: m.fotos[0] }] : undefined,
    },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const m = await traerMoto(id);
  return (
    <>
      {m && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: `${m.marca} ${m.modelo} ${m.anio}`,
              brand: { "@type": "Brand", name: m.marca },
              category: m.categoria || "Motocicleta",
              image: m.fotos?.length ? m.fotos : undefined,
              description: `Moto en permuta: ${m.marca} ${m.modelo} ${m.anio}, ${m.km} km, ${m.cilindrada} cc.`,
              offers: m.precio_usd
                ? {
                    "@type": "Offer",
                    price: Number(m.precio_usd),
                    priceCurrency: "USD",
                    availability: "https://schema.org/InStock",
                    url: `https://motocambio.com.ar/moto/${m.id}`,
                  }
                : undefined,
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
