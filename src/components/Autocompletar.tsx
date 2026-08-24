"use client";
import { useMemo, useState } from "react";

export interface ModeloCatalogo {
  id: number;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
}

// Autocompletar del catálogo canónico: los modelos NUNCA se escriben libres.
export function Autocompletar({
  catalogo,
  soloPublicables,
  onElegir,
  placeholder,
}: {
  catalogo: ModeloCatalogo[];
  soloPublicables?: boolean;
  onElegir: (m: ModeloCatalogo) => void;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);

  const opciones = useMemo(() => {
    const base = soloPublicables
      ? catalogo.filter((m) => m.cilindrada >= 280)
      : catalogo;
    const q = texto.trim().toLowerCase().replace(/\s+/g, " ");
    if (!q) return base.slice(0, 8);
    return base
      .filter((m) =>
        `${m.marca} ${m.modelo}`.toLowerCase().replace(/\s+/g, " ").includes(q)
      )
      .slice(0, 8);
  }, [catalogo, texto, soloPublicables]);

  return (
    <div className="relative">
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={placeholder || "Buscá marca y modelo…"}
        className="w-full border-2 border-linea rounded-xl px-3.5 py-2.5 outline-none focus:border-rojo"
      />
      {abierto && opciones.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-white border border-linea rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {opciones.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onElegir(m);
                  setTexto("");
                  setAbierto(false);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-hueso text-sm"
              >
                <b>
                  {m.marca} {m.modelo}
                </b>{" "}
                <span className="text-gris">
                  · {m.cilindrada} cc{m.categoria ? ` · ${m.categoria}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
