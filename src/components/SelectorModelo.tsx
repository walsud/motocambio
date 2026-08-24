"use client";
import { useMemo, useState } from "react";
import type { ModeloCatalogo } from "@/components/Autocompletar";

// Selector en dos pasos: primero la Marca, después el Modelo (filtrado).
// El clásico que todos conocen — imposible perderse.
export function SelectorModelo({
  catalogo,
  onElegir,
  reiniciarAlElegir,
}: {
  catalogo: ModeloCatalogo[];
  onElegir: (m: ModeloCatalogo) => void;
  reiniciarAlElegir?: boolean;
}) {
  const [marca, setMarca] = useState("");
  const marcas = useMemo(
    () => Array.from(new Set(catalogo.map((m) => m.marca))).sort(),
    [catalogo]
  );
  const modelos = useMemo(
    () =>
      catalogo
        .filter((m) => m.marca === marca)
        .sort((a, b) => a.modelo.localeCompare(b.modelo)),
    [catalogo, marca]
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <span className="text-xs font-semibold text-gris">Marca</span>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          disabled={catalogo.length === 0}
          className="mt-1 w-full border-2 border-linea rounded-xl px-3 py-2.5 bg-white outline-none focus:border-rojo disabled:opacity-50"
        >
          <option value="">
            {catalogo.length === 0 ? "Cargando…" : "— Elegir marca —"}
          </option>
          {marcas.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="text-xs font-semibold text-gris">Modelo</span>
        <select
          value=""
          onChange={(e) => {
            const elegido = modelos.find(
              (m) => String(m.id) === e.target.value
            );
            if (elegido) {
              onElegir(elegido);
              if (reiniciarAlElegir) setMarca("");
            }
          }}
          disabled={!marca}
          className="mt-1 w-full border-2 border-linea rounded-xl px-3 py-2.5 bg-white outline-none focus:border-rojo disabled:opacity-50"
        >
          <option value="">
            {marca ? "— Elegir modelo —" : "Primero la marca"}
          </option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.modelo} · {m.cilindrada} cc
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
