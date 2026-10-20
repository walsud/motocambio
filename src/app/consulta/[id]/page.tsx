"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";
import { type Consulta } from "@/components/ConsultasOportunidades";

interface Mensaje {
  id: number;
  autor: string;
  texto: string;
  enviado_el: string;
}

// Chat de una consulta de Oportunidades (vendedor ↔ interesado)
export default function ChatConsulta() {
  const { id } = useParams<{ id: string }>();
  const supabase = crearClienteNavegador();
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | undefined>();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const cantidadRef = useRef(0);

  const cargarMensajes = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("mensajes_consulta")
      .select("id, autor, texto, enviado_el")
      .eq("consulta_id", id)
      .order("enviado_el");
    const lista = (data as Mensaje[]) || [];
    setMensajes(lista);
    if (lista.some((m) => m.autor !== uid)) {
      await supabase.rpc("leer_consulta", { p_consulta: id });
    }
  }, [supabase, id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCargando(false);
        return;
      }
      setUserId(user.id);
      const [perfilR, consR] = await Promise.all([
        supabase.from("perfiles").select("nombre").eq("id", user.id).single(),
        supabase.rpc("mis_consultas"),
      ]);
      if (perfilR.data) setNombre(perfilR.data.nombre);
      const c = ((consR.data as Consulta[]) || []).find((x) => x.consulta_id === id);
      setConsulta(c || null);
      await cargarMensajes(user.id);
      setCargando(false);
      // El chat se refresca solo cada 4 segundos
      timer = setInterval(() => cargarMensajes(user.id), 4000);
    })();
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (mensajes.length !== cantidadRef.current) {
      cantidadRef.current = mensajes.length;
      finRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !userId || enviando) return;
    setEnviando(true);
    const { error } = await supabase.from("mensajes_consulta").insert({
      consulta_id: id,
      autor: userId,
      texto: limpio.slice(0, 2000),
    });
    if (error) console.error("[Motocambio] Error enviando mensaje:", error);
    else {
      setTexto("");
      await cargarMensajes(userId);
    }
    setEnviando(false);
  }

  const hora = (f: string) => new Date(f).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const dia = (f: string) => new Date(f).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-hueso flex flex-col">
      <HeaderApp nombre={nombre} activo="garage" sinNavInferior />
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex flex-col flex-1">
        <Link href="/garage" className="text-sm font-semibold text-gris hover:text-rojo">
          ← Volver a mi garage
        </Link>

        {cargando ? (
          <p className="text-sm text-gris mt-6">Cargando conversación…</p>
        ) : !consulta ? (
          <div className="mt-6 bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🤔</p>
            <p className="font-titulos font-extrabold text-lg">No encontramos esta consulta</p>
            <p className="text-sm text-gris mt-1">Iniciá sesión con la cuenta que hizo o recibió la consulta.</p>
          </div>
        ) : consulta.estado !== "aceptada" ? (
          <div className="mt-6 bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-titulos font-extrabold text-lg">
              {consulta.estado === "pendiente" ? "La consulta todavía no fue aceptada" : "La consulta no fue aceptada"}
            </p>
            <p className="text-sm text-gris mt-1">El chat se abre cuando el vendedor acepta la consulta.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 bg-white border border-linea rounded-2xl p-4">
              <p className="font-titulos font-extrabold text-[15px]">
                {consulta.otro_nombre} · {consulta.moto_txt}
              </p>
              <p className="text-xs text-gris">
                💰 Oportunidad{consulta.precio ? ` · USD ${Number(consulta.precio).toLocaleString("es-AR")} de contado` : ""}
                {consulta.rol === "vendedor" ? " · te consultó por tu moto" : " · consultaste vos"}
              </p>
            </div>

            <p className="text-[11px] text-gris text-center mt-2 px-4">
              Tu mail y tu teléfono no se comparten: pasalos solo si vos querés. Coordinen ver
              la moto en persona, en un lugar seguro, y verifiquen papeles antes de cualquier seña.
            </p>

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
                        mio ? "bg-rojo text-white rounded-br-md" : "bg-white border border-linea rounded-bl-md"
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
