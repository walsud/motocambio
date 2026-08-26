"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

interface Resumen {
  usuarios: number;
  concesionarios_aprobados: number;
  concesionarios_pendientes: number;
  motos_activas: number;
  motos_publicadas: number;
  busquedas_activas: number;
  matches_total: number;
  matches_directos: number;
  matches_con_charla: number;
  matches_concretados: number;
  mensajes: number;
  oportunidades_activas: number;
  oportunidades_pendientes: number;
  denuncias_pendientes: number;
}

interface ConcesPendiente {
  id: string;
  nombre: string;
  cuit: string | null;
  telefono: string | null;
  provincia: string | null;
  email: string;
  solicitado: string;
}

interface OpPendiente {
  id: string;
  moto_txt: string;
  precio: number;
  motivo: string | null;
  vendedor: string;
  creada: string;
}

interface ConcesActivo {
  id: string;
  nombre: string;
  cuit: string | null;
  telefono: string | null;
  provincia: string | null;
  email: string;
  motos_activas: number;
}

interface Denuncia {
  id: number;
  motivo: string;
  autor: string;
  denunciado: string;
  moto_txt: string;
  creada: string;
}

export default function Admin() {
  const supabase = crearClienteNavegador();
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [nombre, setNombre] = useState<string | undefined>();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [conces, setConces] = useState<ConcesPendiente[]>([]);
  const [concesActivos, setConcesActivos] = useState<ConcesActivo[]>([]);
  const [ops, setOps] = useState<OpPendiente[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [revocando, setRevocando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const [r, c, ca, o, d] = await Promise.all([
      supabase.rpc("admin_resumen"),
      supabase.rpc("admin_concesionarios_pendientes"),
      supabase.rpc("admin_concesionarios_activos"),
      supabase.rpc("admin_oportunidades_pendientes"),
      supabase.rpc("admin_denuncias_pendientes"),
    ]);
    setResumen((r.data as Resumen) || null);
    setConces((c.data as ConcesPendiente[]) || []);
    setConcesActivos((ca.data as ConcesActivo[]) || []);
    setOps((o.data as OpPendiente[]) || []);
    setDenuncias((d.data as Denuncia[]) || []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: soy }, { data: perfil }] = await Promise.all([
        supabase.rpc("soy_admin"),
        supabase.from("perfiles").select("nombre").eq("id", user.id).single(),
      ]);
      if (perfil) setNombre(perfil.nombre);
      setEsAdmin(!!soy);
      if (soy) cargar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function avisar(t: string) {
    setAviso(t);
    setTimeout(() => setAviso(""), 4000);
  }

  async function aprobarConces(c: ConcesPendiente) {
    await supabase.rpc("admin_aprobar_concesionario", { p_id: c.id });
    avisar(`✓ ${c.nombre} aprobado como concesionario.`);
    cargar();
  }

  async function revocarConces(c: ConcesActivo) {
    await supabase.rpc("admin_revocar_concesionario", { p_id: c.id });
    setRevocando(null);
    avisar(`${c.nombre} dado de baja como concesionario (su cuenta sigue como particular).`);
    cargar();
  }

  async function aprobarOp(o: OpPendiente) {
    await supabase.rpc("admin_aprobar_oportunidad", { p_id: o.id });
    avisar(`✓ Oportunidad publicada: ${o.moto_txt}.`);
    cargar();
  }

  async function rechazarOp(o: OpPendiente) {
    await supabase.rpc("admin_rechazar_oportunidad", { p_id: o.id });
    avisar(`Oportunidad rechazada: ${o.moto_txt}.`);
    cargar();
  }

  async function resolverDenuncia(d: Denuncia, estado: "resuelta" | "descartada") {
    await supabase.rpc("admin_resolver_denuncia", { p_id: d.id, p_estado: estado });
    avisar(`Denuncia #${d.id} ${estado}.`);
    cargar();
  }

  const tiles = resumen
    ? [
        { n: resumen.usuarios, t: "Usuarios", e: "👤" },
        { n: resumen.motos_publicadas, t: "Motos publicadas", e: "🏍️" },
        { n: resumen.busquedas_activas, t: "Búsquedas", e: "🎯" },
        { n: resumen.matches_total, t: "Matches", e: "💘" },
        { n: resumen.matches_con_charla, t: "Con charla", e: "💬" },
        { n: resumen.matches_concretados, t: "Concretados", e: "🤝" },
        { n: resumen.mensajes, t: "Mensajes", e: "✉️" },
        { n: resumen.oportunidades_activas, t: "Oportunidades", e: "💰" },
        { n: resumen.concesionarios_aprobados, t: "Concesionarios", e: "🏪" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp nombre={nombre} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {aviso && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-asfalto text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl z-50">
            {aviso}
          </div>
        )}

        {esAdmin === null ? (
          <p className="text-sm text-gris">Verificando acceso…</p>
        ) : !esAdmin ? (
          <div className="bg-white border border-linea rounded-2xl p-10 text-center max-w-md mx-auto mt-10">
            <p className="text-4xl mb-3">🔐</p>
            <p className="font-titulos font-extrabold text-lg">Solo para el equipo de Motocambio</p>
            <Link href="/garage" className="inline-block mt-5 bg-rojo text-white font-titulos font-extrabold rounded-xl px-6 py-3">
              Volver a mi garage →
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-titulos font-black text-3xl tracking-tight">⚙️ Administración</h1>
            <p className="text-gris mt-1 mb-6">El pulso de Motocambio, en vivo.</p>

            {/* Métricas */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
              {tiles.map((s) => (
                <div key={s.t} className="bg-white border border-linea rounded-xl p-3 text-center">
                  <p className="text-lg">{s.e}</p>
                  <p className="font-titulos font-black text-xl">{s.n}</p>
                  <p className="text-[10px] text-gris font-semibold leading-tight">{s.t}</p>
                </div>
              ))}
            </div>

            {/* Concesionarios pendientes */}
            <h2 className="font-titulos font-extrabold text-xl mt-8 mb-3">
              🏪 Concesionarios por aprobar {conces.length > 0 && (
                <span className="bg-rojo text-white text-xs rounded-full px-2 py-0.5 align-middle">{conces.length}</span>
              )}
            </h2>
            {conces.length === 0 ? (
              <p className="text-sm text-gris bg-white border border-linea rounded-xl p-4">Nada pendiente. ✓</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {conces.map((c) => (
                  <div key={c.id} className="bg-white border border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-titulos font-extrabold text-[14px]">{c.nombre}</p>
                      <p className="text-xs text-gris">
                        CUIT {c.cuit || "—"} · {c.telefono || "sin teléfono"} · {c.provincia || "—"} · {c.email}
                      </p>
                    </div>
                    <button onClick={() => aprobarConces(c)}
                      className="bg-verde-ok text-white text-sm font-bold rounded-xl px-5 py-2.5">
                      ✓ Aprobar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Concesionarios activos */}
            {concesActivos.length > 0 && (
              <>
                <h2 className="font-titulos font-extrabold text-xl mt-8 mb-3">
                  🏪 Concesionarios activos <span className="text-sm font-semibold text-gris">({concesActivos.length})</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {concesActivos.map((c) => (
                    <div key={c.id} className="bg-white border border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-titulos font-extrabold text-[14px]">{c.nombre}</p>
                        <p className="text-xs text-gris">
                          CUIT {c.cuit || "—"} · {c.email} · {c.motos_activas} moto{Number(c.motos_activas) !== 1 ? "s" : ""} activa{Number(c.motos_activas) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {revocando === c.id ? (
                        <>
                          <span className="text-xs font-semibold text-tinta2">¿Seguro? Pierde insignia y leads.</span>
                          <button onClick={() => revocarConces(c)}
                            className="bg-rojo text-white text-xs font-bold rounded-xl px-4 py-2.5">
                            Sí, dar de baja
                          </button>
                          <button onClick={() => setRevocando(null)}
                            className="border-2 border-linea text-xs font-semibold rounded-xl px-4 py-2.5 text-tinta2">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setRevocando(c.id)}
                          className="border-2 border-linea text-xs font-semibold rounded-xl px-4 py-2.5 text-rojo hover:border-rojo">
                          Dar de baja
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Oportunidades pendientes */}
            <h2 className="font-titulos font-extrabold text-xl mt-8 mb-3">
              💰 Oportunidades por revisar {ops.length > 0 && (
                <span className="bg-rojo text-white text-xs rounded-full px-2 py-0.5 align-middle">{ops.length}</span>
              )}
            </h2>
            {ops.length === 0 ? (
              <p className="text-sm text-gris bg-white border border-linea rounded-xl p-4">Nada pendiente. ✓</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {ops.map((o) => (
                  <div key={o.id} className="bg-white border border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-titulos font-extrabold text-[14px]">
                        {o.moto_txt} · USD {Number(o.precio).toLocaleString("es-AR")}
                      </p>
                      <p className="text-xs text-gris">
                        Vende {o.vendedor}{o.motivo ? ` · "${o.motivo}"` : ""} · sin referencia de precio cargada
                      </p>
                    </div>
                    <button onClick={() => aprobarOp(o)}
                      className="bg-verde-ok text-white text-sm font-bold rounded-xl px-4 py-2.5">
                      ✓ Publicar
                    </button>
                    <button onClick={() => rechazarOp(o)}
                      className="border-2 border-linea text-sm font-semibold rounded-xl px-4 py-2.5 text-rojo">
                      ✕ Rechazar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Denuncias */}
            <h2 className="font-titulos font-extrabold text-xl mt-8 mb-3">
              🚩 Denuncias {denuncias.length > 0 && (
                <span className="bg-rojo text-white text-xs rounded-full px-2 py-0.5 align-middle">{denuncias.length}</span>
              )}
            </h2>
            {denuncias.length === 0 ? (
              <p className="text-sm text-gris bg-white border border-linea rounded-xl p-4">Nada pendiente. ✓</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {denuncias.map((d) => (
                  <div key={d.id} className="bg-white border border-linea rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">&ldquo;{d.motivo}&rdquo;</p>
                      <p className="text-xs text-gris">
                        De {d.autor} · sobre {d.denunciado} · {d.moto_txt}
                      </p>
                    </div>
                    <button onClick={() => resolverDenuncia(d, "resuelta")}
                      className="bg-asfalto text-white text-xs font-bold rounded-xl px-4 py-2.5">
                      Resuelta
                    </button>
                    <button onClick={() => resolverDenuncia(d, "descartada")}
                      className="border-2 border-linea text-xs font-semibold rounded-xl px-4 py-2.5 text-tinta2">
                      Descartar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
