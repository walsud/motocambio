"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";

// "Explorá por estilo": accesos por categoría, armados con lo que hay
// publicado de verdad (nada de estantes vacíos). Si no hay motos, no sale.
export function ExplorarPorEstilo() {
  const supabase = crearClienteNavegador();
  const [cats, setCats] = useState<[string, number][]>([]);

  useEffect(() => {
    supabase
      .from("motos_publicas")
      .select("categoria")
      .then(({ data }) => {
        const conteo = new Map<string, number>();
        (data || []).forEach((m: { categoria: string | null }) => {
          if (m.categoria) conteo.set(m.categoria, (conteo.get(m.categoria) || 0) + 1);
        });
        setCats([...conteo.entries()].sort((a, b) => b[1] - a[1]));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cats.length === 0) return null;

  return (
    <section className="pb-12">
      <h2 className="font-titulos font-black text-2xl tracking-tight mb-1">
        Explorá por estilo
      </h2>
      <p className="text-sm text-gris mb-4">Elegí la categoría de tu próxima aventura.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cats.map(([c, n]) => (
          <Link key={c} href={`/explorar?categoria=${encodeURIComponent(c)}`}
            className="group bg-white border border-linea rounded-2xl p-5 shadow-sm hover:border-rojo hover:shadow-md transition-all">
            <p className="font-titulos font-black text-xl tracking-tight group-hover:text-rojo transition-colors">
              {c}
            </p>
            <p className="text-xs text-gris mt-1 font-semibold">
              {n} {n === 1 ? "publicada" : "publicadas"} <span className="text-rojo">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
