"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export interface Consulta {
  consulta_id: string;
  rol: "vendedor" | "interesado";
  otro_nombre: string;
  moto_txt: string;
  precio: number | null;
  estado: "pendiente" | "aceptada" | "ignorada";
  creada_el: string;
  no_leidos: number;
}

// Consultas de Oportunidades: las que te hicieron (como vendedor) y las
// que hiciste vos (como interesado). Aceptar abre un chat interno.
export function ConsultasOportunidades() {
  const supabase = crearClienteNavegador();
  const [lista, setLista] = useState<Consulta[]>([]);
  const [cargada, setCargada] = useState(false);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.rpc("mis_consultas");
    if (error) console.error("[Motocambio] Error cargando consultas:", error);
    setLista((data as Consulta[]) || []);
    setCargada(true);
  }, [supabase]);

  useEffect(() => {
    supabase.rpc("mis_consultas").then(({ data, error }) => {
      if (error) console.error("[Motocambio] Error cargando consultas:", error);
      setLista((data as Consulta[]) || []);
      setCargada(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function responder(c: Consulta, aceptar: boolean) {
    if (respondiendo) return;
    setRespondiendo(c.consulta_id);
    try {
      await fetch("/api/responder-consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulta_id: c.consulta_id, aceptar }),
      });
    } catch (e) {
      console.error("[Motocambio] Error respondiendo consulta:", e);
    }
    await cargar();
    setRespondiendo(null);
  }

  // Si nunca hubo consultas, la sección no aparece
  if (!cargada || lista.length === 0) return null;

  const recibidas = lista.filter((c) => c.rol === "vendedor" && c.estado !== "ignorada");
  const enviadas = lista.filter((c) => c.rol === "interesado");
  const pendientes = recibidas.filter((c) => c.estado === "pendiente").length;

  return (
    <section className="mb-10">
      <h2 className="font-titulos font-extrabold text-xl mb-1">
        💰 Consultas de Oportunidades
        {pendientes > 0 && (
          <span className="ml-2 bg-rojo text-white text-xs rounded-full px-2 py-0.5 align-middle">
            {pendientes} nueva{pendientes > 1 ? "s" : ""}
          </span>
        )}
      </h2>
      <p className="text-xs text-gris mb-3">
        Las consultas se responden por el chat de Motocambio. Nadie ve tu mail ni tu
        teléfono: vos elegís si se lo pasás a alguien.
      </p>

      <div className="flex flex-col gap-2.5">
        {recibidas.map((c) => (
          <div key={c.consulta_id} className="bg-white border-2 border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-titulos font-extrabold text-[15px]">
                {c.otro_nombre} quiere tu {c.moto_txt}
              </p>
              <p className="text-xs text-gris mt-0.5">
                Te consultó por tu Oportunidad
                {c.precio ? ` de USD ${Number(c.precio).toLocaleString("es-AR")}` : ""}
              </p>
            </div>
            {c.estado === "pendiente" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => responder(c, true)}
                  disabled={respondiendo === c.consulta_id}
                  className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold text-sm rounded-xl px-4 py-2 disabled:opacity-60"
                >
                  {respondiendo === c.consulta_id ? "…" : "💬 Aceptar y chatear"}
                </button>
                <button
                  onClick={() => responder(c, false)}
                  disabled={respondiendo === c.consulta_id}
                  className="border-2 border-linea bg-white text-tinta2 font-semibold text-sm rounded-xl px-4 py-2 disabled:opacity-60"
                >
                  Ignorar
                </button>
              </div>
            ) : (
              <BotonChat c={c} />
            )}
          </div>
        ))}

        {enviadas.map((c) => (
          <div key={c.consulta_id} className="bg-white border border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-titulos font-extrabold text-[15px]">
                Consultaste por la {c.moto_txt}
              </p>
              <p className="text-xs text-gris mt-0.5">De {c.otro_nombre}</p>
            </div>
            {c.estado === "aceptada" ? (
              <BotonChat c={c} />
            ) : c.estado === "pendiente" ? (
              <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-[#FDF1E3] text-ambar">
                ⏳ Esperando respuesta
              </span>
            ) : (
              <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-hueso text-gris">
                No aceptó la consulta
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function BotonChat({ c }: { c: Consulta }) {
  const nuevos = Number(c.no_leidos);
  return (
    <Link
      href={`/consulta/${c.consulta_id}`}
      className="flex items-center gap-2 bg-asfalto hover:opacity-90 text-white text-sm font-titulos font-extrabold rounded-xl px-4 py-2"
    >
      💬 {nuevos > 0 ? "Responder" : "Abrir chat"}
      {nuevos > 0 && (
        <span className="bg-rojo text-white text-[11px] font-bold rounded-full px-2 py-0.5">
          {nuevos} nuevo{nuevos > 1 ? "s" : ""}
        </span>
      )}
    </Link>
  );
}
