"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

interface Perfil {
  nombre: string;
  tipo: string;
  cuit: string | null;
  telefono: string | null;
  concesionario_aprobado: boolean;
}

interface Moto {
  id: string;
  modelo_id: number;
  anio: number;
  km: number;
  precio_usd: number | null;
  visibilidad: string;
  estado: string;
  fotos: string[];
}

interface MatchInfo {
  match_id: string;
  tipo: string;
  estado: string;
  mi_moto_id: string;
  no_leidos: number;
}

interface Oportunidad {
  id: string;
  moto_id: string;
  aprobada: boolean;
  vence_el: string;
}

interface ModeloMini {
  id: number;
  marca: string;
  modelo: string;
}

export default function Panel() {
  const supabase = crearClienteNavegador();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [modelos, setModelos] = useState<ModeloMini[]>([]);
  const [cargando, setCargando] = useState(true);

  // formulario de solicitud
  const [nombreComercial, setNombreComercial] = useState("");
  const [cuit, setCuit] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [perfilR, motosR, matchesR, opsR] = await Promise.all([
      supabase.from("perfiles")
        .select("nombre, tipo, cuit, telefono, concesionario_aprobado")
        .eq("id", user.id).single(),
      supabase.from("motos").select("id, modelo_id, anio, km, precio_usd, visibilidad, estado, fotos")
        .eq("dueno", user.id).neq("estado", "cambiada").order("creado_el"),
      supabase.rpc("mis_matches"),
      supabase.from("oportunidades").select("id, moto_id, aprobada, vence_el"),
    ]);

    const p = perfilR.data as Perfil | null;
    setPerfil(p);
    if (p) setNombreComercial(p.nombre);
    const misMotos = (motosR.data as Moto[]) || [];
    setMotos(misMotos);
    setMatches((matchesR.data as MatchInfo[]) || []);
    const ids = misMotos.map((m) => m.id);
    setOportunidades(((opsR.data as Oportunidad[]) || []).filter((o) => ids.includes(o.moto_id)));

    const modeloIds = [...new Set(misMotos.map((m) => m.modelo_id))];
    if (modeloIds.length) {
      const { data: cat } = await supabase
        .from("catalogo_modelos").select("id, marca, modelo").in("id", modeloIds);
      setModelos((cat as ModeloMini[]) || []);
    }
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function nombreModelo(id: number) {
    const m = modelos.find((x) => x.id === id);
    return m ? `${m.marca} ${m.modelo}` : "Moto";
  }

  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cuit.trim()) {
      setError("El CUIT es obligatorio para las cuentas de concesionario.");
      return;
    }
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase
      .from("perfiles")
      .update({
        tipo: "concesionario",
        nombre: nombreComercial.trim() || perfil?.nombre,
        cuit: cuit.trim(),
        telefono: telefono.trim() || null,
      })
      .eq("id", user.id);
    setEnviando(false);
    if (err) {
      setError("No se pudo enviar la solicitud: " + err.message);
      return;
    }
    cargar();
  }

  const esConces = perfil?.tipo === "concesionario";
  const stats = {
    activas: motos.filter((m) => m.estado === "activa").length,
    matches: matches.length,
    directos: matches.filter((m) => m.tipo === "directo").length,
    sinLeer: matches.reduce((a, m) => a + Number(m.no_leidos || 0), 0),
    concretados: matches.filter((m) => m.estado === "concretado").length,
    ops: oportunidades.filter((o) => o.aprobada).length,
  };

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp nombre={perfil?.nombre} activo="panel" esConcesionario={esConces} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {cargando ? (
          <p className="text-sm text-gris">Cargando…</p>
        ) : !esConces ? (
          /* ---------- PITCH + SOLICITUD ---------- */
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div>
              <h1 className="font-titulos font-black text-3xl tracking-tight">
                🏪 Panel de concesionarios
              </h1>
              <p className="text-gris mt-2 leading-relaxed">
                Si tenés un local de motos, Motocambio te trae lo que más cuesta
                conseguir: <b>gente decidida a cambiar su moto</b>, con la suya ya
                tasada y publicada.
              </p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-tinta2">
                <li className="bg-white border border-linea rounded-xl p-3.5">
                  🏷️ <b>Insignia de Concesionario</b> en todas tus publicaciones:
                  más confianza, más contactos.
                </li>
                <li className="bg-white border border-linea rounded-xl p-3.5">
                  🏍️ <b>Todo tu stock publicado</b>: cargá todas las motos que
                  quieras, cada una entra al matching.
                </li>
                <li className="bg-white border border-linea rounded-xl p-3.5">
                  📊 <b>Panel de estadísticas</b>: matches, conversaciones y
                  cambios concretados por cada moto.
                </li>
                <li className="bg-white border border-linea rounded-xl p-3.5">
                  💰 <b>Oportunidades</b>: liquidá unidades de contado en la
                  vitrina de ofertas.
                </li>
              </ul>
              <p className="text-xs text-verde-ok font-bold mt-4 bg-[#E9F7EF] border border-[#CDE4D4] rounded-lg px-3 py-2 inline-block">
                🎁 Plan Concesionario bonificado durante la beta cerrada
              </p>
            </div>
            <form onSubmit={solicitar} className="bg-white border border-linea rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-titulos font-extrabold text-xl">Solicitá tu cuenta</h2>
              <label className="text-sm font-semibold">
                Nombre comercial
                <input value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Ej.: Motos del Sur"
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" />
              </label>
              <label className="text-sm font-semibold">
                CUIT
                <input required value={cuit} onChange={(e) => setCuit(e.target.value)}
                  placeholder="30-12345678-9"
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" />
              </label>
              <label className="text-sm font-semibold">
                Teléfono / WhatsApp
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="11 1234-5678"
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" />
              </label>
              {error && (
                <p className="text-sm text-rojo bg-[#FBF0F1] border border-[#EED2D6] rounded-lg px-3 py-2">{error}</p>
              )}
              <button disabled={enviando}
                className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60">
                {enviando ? "Enviando…" : "Solicitar cuenta de concesionario →"}
              </button>
              <p className="text-[11px] text-gris">
                Revisamos cada solicitud a mano y te avisamos por mail. Mientras
                tanto seguís operando normalmente.
              </p>
            </form>
          </div>
        ) : (
          /* ---------- PANEL ---------- */
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-titulos font-black text-3xl tracking-tight">
                  🏪 {perfil?.nombre}
                </h1>
                <p className="text-gris text-sm mt-1">
                  Panel de concesionario · CUIT {perfil?.cuit || "—"}
                </p>
              </div>
              <Link href="/garage"
                className="bg-rojo hover:bg-rojo-oscuro text-white text-sm font-titulos font-extrabold rounded-xl px-5 py-2.5">
                + Cargar moto
              </Link>
            </div>

            {!perfil?.concesionario_aprobado && (
              <div className="mt-4 bg-[#FDF1E3] border border-[#EFD9BB] rounded-xl p-4 text-sm text-tinta2">
                🕐 <b>Tu cuenta está en revisión.</b> Cuando la aprobemos, tus
                publicaciones van a mostrar la insignia de Concesionario. Te
                avisamos por mail — mientras tanto todo funciona normalmente.
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {[
                { n: stats.activas, t: "Motos activas", e: "🏍️" },
                { n: stats.matches, t: "Matches", e: "💘" },
                { n: stats.directos, t: "Directos", e: "🎯" },
                { n: stats.sinLeer, t: "Sin responder", e: "💬" },
                { n: stats.concretados, t: "Concretados", e: "🤝" },
                { n: stats.ops, t: "Oportunidades", e: "💰" },
              ].map((s) => (
                <div key={s.t} className="bg-white border border-linea rounded-2xl p-4 text-center">
                  <p className="text-2xl">{s.e}</p>
                  <p className="font-titulos font-black text-2xl mt-1">{s.n}</p>
                  <p className="text-[11px] text-gris font-semibold">{s.t}</p>
                </div>
              ))}
            </div>

            {/* Detalle por moto */}
            <h2 className="font-titulos font-extrabold text-xl mt-8 mb-3">Tu stock</h2>
            {motos.length === 0 ? (
              <p className="text-sm text-gris bg-white border border-linea rounded-xl p-5">
                Todavía no cargaste motos. Arrancá desde{" "}
                <Link href="/garage" className="text-rojo font-semibold">Mi garage</Link>.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {motos.map((m) => {
                  const mm = matches.filter((x) => x.mi_moto_id === m.id);
                  const sinLeer = mm.reduce((a, x) => a + Number(x.no_leidos || 0), 0);
                  const conc = mm.filter((x) => x.estado === "concretado").length;
                  const op = oportunidades.find((o) => o.moto_id === m.id);
                  return (
                    <div key={m.id} className="bg-white border border-linea rounded-2xl p-3.5 flex items-center gap-3.5 flex-wrap">
                      {m.fotos?.length ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.fotos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asfalto to-[#3A1F2B] flex items-center justify-center text-xl">🏍️</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-titulos font-extrabold text-[14px] truncate">
                          {nombreModelo(m.modelo_id)} · {m.anio}
                        </p>
                        <p className="text-[11px] text-gris">
                          {m.km.toLocaleString("es-AR")} km
                          {m.precio_usd ? ` · USD ${Number(m.precio_usd).toLocaleString("es-AR")}` : ""}
                          {m.estado === "pausada" ? " · ⏸️ Pausada" : ""}
                          {m.visibilidad === "entrega" ? " · Moto de entrega" : ""}
                          {op ? (op.aprobada ? " · 💰 En Oportunidades" : " · 💰 Pendiente") : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-center text-[11px] font-semibold text-gris">
                        <span>💘<br />{mm.length}</span>
                        <span className={sinLeer > 0 ? "text-rojo font-bold" : ""}>💬<br />{sinLeer}</span>
                        <span>🤝<br />{conc}</span>
                      </div>
                      <Link href="/garage" className="text-xs font-bold text-rojo hover:underline">
                        Gestionar →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 bg-[#E9F7EF] border border-[#CDE4D4] rounded-2xl p-4 text-sm text-tinta2">
              🎁 <b>Plan Concesionario bonificado durante la beta cerrada.</b>{" "}
              Cuando arranque el plan pago te vamos a avisar con tiempo — los
              primeros concesionarios tienen precio de fundador.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
