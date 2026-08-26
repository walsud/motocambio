"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

interface Oportunidad {
  id: string;
  moto_id: string;
  precio_contado: number;
  motivo: string | null;
  vence_el: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
  anio: number;
  km: number;
  fotos: string[];
  provincia: string | null;
  dueno_nombre: string;
  dueno_tipo: string;
  ref_min: number | null;
  ref_max: number | null;
}

export default function Oportunidades() {
  const supabase = crearClienteNavegador();
  const [lista, setLista] = useState<Oportunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [logueado, setLogueado] = useState(false);
  const [nombre, setNombre] = useState<string | undefined>();
  const [avisando, setAvisando] = useState<string | null>(null);
  const [avisadas, setAvisadas] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const { data, error: err } = await supabase
      .from("oportunidades_publicas")
      .select("*")
      .order("creada_el", { ascending: false })
      .limit(60);
    if (err) {
      console.error("[Motocambio] Error cargando oportunidades:", err);
      setError(err.message);
    }
    setLista((data as Oportunidad[]) || []);
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setLogueado(true);
        const { data } = await supabase.from("perfiles").select("nombre").eq("id", user.id).single();
        if (data) setNombre(data.nombre);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function diasRestantes(vence: string) {
    const dias = Math.ceil((new Date(vence + "T23:59:59").getTime() - Date.now()) / 86400000);
    return Math.max(0, dias);
  }

  function ahorro(o: Oportunidad) {
    if (!o.ref_min) return null;
    const pct = Math.round((1 - o.precio_contado / Number(o.ref_min)) * 100);
    return pct > 0 ? pct : null;
  }

  async function meInteresa(o: Oportunidad) {
    if (avisando || avisadas.includes(o.id)) return;
    setAvisando(o.id);
    try {
      const r = await fetch("/api/interes-oportunidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oportunidad_id: o.id }),
      });
      const j = await r.json();
      if (j.ok) {
        setAvisadas([...avisadas, o.id]);
        setAviso(`✓ Le avisamos a ${o.dueno_nombre}. Te va a escribir a tu mail.`);
      } else {
        setAviso(
          j.motivo === "es tu propia moto"
            ? "Esa oportunidad es tuya 😄"
            : "No pudimos mandar el aviso. Probá de nuevo en un rato."
        );
      }
    } catch {
      setAviso("No pudimos mandar el aviso. Probá de nuevo en un rato.");
    }
    setAvisando(null);
    setTimeout(() => setAviso(""), 5000);
  }

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp activo="oportunidades" logueado={logueado} nombre={nombre} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <h1 className="font-titulos font-black text-3xl tracking-tight">💰 Oportunidades</h1>
        <p className="text-gris mt-1 mb-6 max-w-2xl">
          Motos en venta de contado, <b>siempre por debajo de su precio de referencia</b> —
          por eso son oportunidades. Duran 14 días y después desaparecen.
        </p>

        {aviso && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-asfalto text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl z-50">
            {aviso}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-[#FBF0F1] border border-[#EED2D6] rounded-xl p-4 text-sm text-rojo flex items-center gap-3 flex-wrap">
            <span>⚠️ No pudimos cargar las oportunidades ({error}).</span>
            <button onClick={cargar} className="ml-auto bg-rojo text-white font-semibold rounded-lg px-4 py-2">
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-gris">Cargando oportunidades…</p>
        ) : lista.length === 0 && !error ? (
          <div className="text-sm text-gris bg-white border border-linea rounded-xl p-6">
            No hay oportunidades activas en este momento. Si querés vender tu moto de
            contado a precio de ocasión, publicala desde{" "}
            <Link href="/garage" className="text-rojo font-semibold">Mi garage</Link>.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((o) => {
              const pct = ahorro(o);
              const dias = diasRestantes(o.vence_el);
              return (
                <div key={o.id} className="bg-white border border-linea rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="relative">
                    {o.fotos?.length ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.fotos[0]} alt={`${o.marca} ${o.modelo}`} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-5xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
                    )}
                    {pct && (
                      <span className="absolute top-2.5 left-2.5 bg-verde-ok text-white text-[11px] font-bold rounded-full px-2.5 py-1 shadow">
                        {pct}% bajo la referencia
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 bg-asfalto/85 text-white text-[11px] font-bold rounded-full px-2.5 py-1">
                      ⏳ {dias} día{dias !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-titulos font-extrabold text-[15px]">
                      {o.marca} {o.modelo} · {o.anio}
                    </h3>
                    <p className="text-xs text-gris mt-0.5">
                      {o.km.toLocaleString("es-AR")} km · {o.provincia}
                      {o.categoria ? ` · ${o.categoria} ${o.cilindrada}cc` : ""}
                    </p>
                    <p className="font-titulos font-black text-2xl text-rojo mt-2">
                      USD {Number(o.precio_contado).toLocaleString("es-AR")}
                      <span className="text-xs font-bold text-gris"> de contado</span>
                    </p>
                    {o.ref_min && (
                      <p className="text-[11px] text-gris mt-0.5">
                        Referencia: USD {Number(o.ref_min).toLocaleString("es-AR")} – {Number(o.ref_max).toLocaleString("es-AR")}
                      </p>
                    )}
                    {o.motivo && (
                      <p className="text-xs text-tinta2 mt-2 bg-hueso rounded-lg px-2.5 py-1.5 italic">
                        &ldquo;{o.motivo}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-gris mt-2">Vende: <b>{o.dueno_nombre}</b></p>
                    <div className="mt-auto pt-3">
                      {logueado ? (
                        <button
                          onClick={() => meInteresa(o)}
                          disabled={avisando === o.id || avisadas.includes(o.id)}
                          className={`w-full font-titulos font-extrabold rounded-xl py-2.5 text-sm ${
                            avisadas.includes(o.id)
                              ? "bg-[#E9F7EF] text-verde-ok"
                              : "bg-rojo hover:bg-rojo-oscuro text-white"
                          } disabled:opacity-70`}
                        >
                          {avisadas.includes(o.id)
                            ? "✓ Aviso enviado"
                            : avisando === o.id
                            ? "Avisando…"
                            : "💬 Me interesa"}
                        </button>
                      ) : (
                        <Link
                          href="/registro"
                          className="block text-center w-full bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-2.5 text-sm"
                        >
                          Registrate para contactar →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-gris mt-8 max-w-2xl">
          La verificación de papeles y estado de las motos, y la operación de compraventa,
          corren por cuenta y responsabilidad de las partes. Motocambio recomienda
          verificación policial y escribano o gestor de confianza.
        </p>
      </main>
    </div>
  );
}
