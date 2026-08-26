"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

interface MatchInfo {
  match_id: string;
  tipo: string;
  estado: string;
  mi_moto: string;
  otra_marca: string;
  otra_modelo: string;
  otra_anio: number;
  otra_fotos: string[];
  otro_nombre: string;
  concretado_por: string | null;
}

interface Mensaje {
  id: number;
  autor: string;
  texto: string;
  enviado_el: string;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const supabase = crearClienteNavegador();
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | undefined>();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const cantidadRef = useRef(0);

  const cargarMensajes = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("mensajes")
      .select("id, autor, texto, enviado_el")
      .eq("match_id", id)
      .order("enviado_el");
    const lista = (data as Mensaje[]) || [];
    setMensajes(lista);
    // Marcar como leídos los que me mandaron
    if (lista.some((m) => m.autor !== uid)) {
      await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("match_id", id)
        .neq("autor", uid)
        .eq("leido", false);
    }
  }, [supabase, id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [perfilR, matchesR] = await Promise.all([
        supabase.from("perfiles").select("nombre").eq("id", user.id).single(),
        supabase.rpc("mis_matches"),
      ]);
      if (perfilR.data) setNombre(perfilR.data.nombre);
      const m = ((matchesR.data as MatchInfo[]) || []).find((x) => x.match_id === id);
      setMatch(m || null);
      await cargarMensajes(user.id);
      setCargando(false);

      // El chat se refresca solo cada 4 segundos
      timer = setInterval(() => cargarMensajes(user.id), 4000);
    })();
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Bajar al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (mensajes.length !== cantidadRef.current) {
      cantidadRef.current = mensajes.length;
      finRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  async function recargarMatch() {
    const { data } = await supabase.rpc("mis_matches");
    const m = ((data as MatchInfo[]) || []).find((x) => x.match_id === id);
    setMatch(m || null);
  }

  async function marcarConcretado() {
    if (marcando) return;
    setMarcando(true);
    setConfirmando(false);
    const { error } = await supabase.rpc("marcar_concretado", { p_match: id });
    if (error) console.error("[Motocambio] Error marcando concretado:", error);
    await recargarMatch();
    setMarcando(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !userId || enviando) return;
    setEnviando(true);
    const { error } = await supabase.from("mensajes").insert({
      match_id: id,
      autor: userId,
      texto: limpio.slice(0, 2000),
    });
    if (!error) {
      setTexto("");
      await cargarMensajes(userId);
    }
    setEnviando(false);
  }

  function hora(fecha: string) {
    return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  function dia(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  return (
    <div className="min-h-screen bg-hueso flex flex-col">
      <HeaderApp nombre={nombre} />
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex flex-col flex-1">
        <Link href="/garage" className="text-sm font-semibold text-gris hover:text-rojo">
          ← Volver a mi garage
        </Link>

        {cargando ? (
          <p className="text-sm text-gris mt-6">Cargando conversación…</p>
        ) : !match ? (
          <div className="mt-6 bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🤔</p>
            <p className="font-titulos font-extrabold text-lg">No encontramos este match</p>
            <p className="text-sm text-gris mt-1">Puede haberse dado de baja alguna de las motos.</p>
          </div>
        ) : (
          <>
            {/* Encabezado del match */}
            <div className="mt-3 bg-white border border-linea rounded-2xl p-4 flex items-center gap-3">
              {match.otra_fotos?.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.otra_fotos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asfalto to-[#3A1F2B] flex items-center justify-center text-2xl">🏍️</div>
              )}
              <div className="min-w-0">
                <p className="font-titulos font-extrabold text-[15px] truncate">
                  {match.otro_nombre} · {match.otra_marca} {match.otra_modelo} {match.otra_anio}
                </p>
                <p className="text-xs text-gris truncate">
                  {match.tipo === "directo" ? "🎯 Match directo" : "👀 Interés parcial"} — por tu {match.mi_moto}
                </p>
              </div>
            </div>

            {/* Estado del cambio */}
            {match.estado === "concretado" ? (
              <div className="mt-2 bg-[#E9F7EF] border border-[#CDE4D4] rounded-2xl p-4 text-center">
                <p className="font-titulos font-extrabold text-verde-ok">
                  🤝 ¡Cambio concretado! Felicitaciones 🎉
                </p>
                <p className="text-xs text-tinta2 mt-1">
                  Las dos motos fueron dadas de baja de la plataforma. Pueden seguir
                  usando este chat para coordinar la entrega y la transferencia.
                </p>
              </div>
            ) : match.estado === "aceptado_por_uno" && match.concretado_por === userId ? (
              <div className="mt-2 bg-[#FDF1E3] border border-[#EFD9BB] rounded-2xl p-3.5 text-center">
                <p className="text-sm font-semibold text-ambar">
                  🤝 Marcaste el cambio como concretado. Esperando que {match.otro_nombre} confirme.
                </p>
              </div>
            ) : match.estado === "aceptado_por_uno" ? (
              <div className="mt-2 bg-[#E9F7EF] border-2 border-verde-ok rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-verde-ok">
                  🎉 {match.otro_nombre} marcó el cambio como concretado. ¿Lo confirmás?
                </p>
                <p className="text-xs text-tinta2 mt-1">
                  Al confirmar, las dos motos se dan de baja automáticamente.
                </p>
                <button
                  onClick={marcarConcretado}
                  disabled={marcando}
                  className="mt-2.5 bg-verde-ok text-white font-titulos font-extrabold rounded-xl px-6 py-2.5 disabled:opacity-60"
                >
                  {marcando ? "Confirmando…" : "Sí, concretamos 🤝"}
                </button>
              </div>
            ) : confirmando ? (
              <div className="mt-2 bg-white border-2 border-linea rounded-2xl p-3.5 text-center">
                <p className="text-sm font-semibold text-tinta2">
                  ¿Seguro? Le vamos a pedir a {match.otro_nombre} que confirme, y al
                  hacerlo las dos motos se dan de baja.
                </p>
                <div className="flex gap-2 justify-center mt-2.5">
                  <button onClick={marcarConcretado} disabled={marcando}
                    className="bg-verde-ok text-white font-bold text-sm rounded-xl px-5 py-2 disabled:opacity-60">
                    {marcando ? "Marcando…" : "Sí, concretamos"}
                  </button>
                  <button onClick={() => setConfirmando(false)}
                    className="border-2 border-linea font-semibold text-sm rounded-xl px-5 py-2 text-tinta2">
                    Todavía no
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="mt-2 mx-auto text-xs font-bold text-verde-ok border-2 border-[#CDE4D4] bg-[#F0F7F2] rounded-full px-4 py-1.5 hover:border-verde-ok"
              >
                🤝 ¿Concretaron el cambio? Marcalo acá
              </button>
            )}

            <p className="text-[11px] text-gris text-center mt-2 px-4">
              Consejo: coordinen ver las motos en persona, en un lugar seguro, y verifiquen
              papeles antes de cualquier seña. Nunca compartan claves ni datos bancarios por acá.
            </p>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto mt-2 mb-3 flex flex-col gap-1.5 min-h-[40vh] max-h-[55vh] px-1">
              {mensajes.length === 0 && (
                <p className="text-sm text-gris text-center my-auto">
                  Todavía no hay mensajes. ¡Rompé el hielo! 🧊
                </p>
              )}
              {mensajes.map((m, i) => {
                const mio = m.autor === userId;
                const nuevoDia = i === 0 || dia(m.enviado_el) !== dia(mensajes[i - 1].enviado_el);
                return (
                  <div key={m.id}>
                    {nuevoDia && (
                      <p className="text-[10px] text-gris text-center my-2 uppercase tracking-wide">
                        {dia(m.enviado_el)}
                      </p>
                    )}
                    <div className={`flex ${mio ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mio
                          ? "bg-rojo text-white rounded-br-md"
                          : "bg-white border border-linea rounded-bl-md"
                      }`}>
                        <span className="whitespace-pre-wrap break-words">{m.texto}</span>
                        <span className={`block text-right text-[10px] mt-0.5 ${mio ? "text-white/70" : "text-gris"}`}>
                          {hora(m.enviado_el)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={finRef} />
            </div>

            {/* Enviar */}
            <form onSubmit={enviar} className="flex gap-2 pb-4">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribí tu mensaje…"
                maxLength={2000}
                className="flex-1 border-2 border-linea rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-rojo"
              />
              <button
                disabled={enviando || !texto.trim()}
                className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl px-5 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
