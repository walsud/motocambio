"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

// La pantalla de una cadena de cambio: tres personas, tres motos,
// un círculo. Cada uno entrega la suya y recibe la que buscaba.
// Con chat de a tres y confirmación triple para concretar.

interface CadenaInfo {
  cadena_id: string;
  estado: string;
  creado_el: string;
  confirme: boolean;
  confirmaciones: number;
  mi_moto_id: string;
  mi_moto: string;
  mi_precio: number | null;
  recibo_moto_id: string;
  recibo_marca: string;
  recibo_modelo: string;
  recibo_anio: number;
  recibo_km: number;
  recibo_precio: number | null;
  recibo_provincia: string | null;
  recibo_fotos: string[];
  recibo_de_id: string;
  recibo_de: string;
  entrego_a_id: string;
  entrego_a: string;
  tercera_moto: string;
  no_leidos: number;
}

interface Mensaje {
  id: number;
  autor: string;
  texto: string;
  enviado_el: string;
}

export default function Cadena() {
  const { id } = useParams<{ id: string }>();
  const supabase = crearClienteNavegador();
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | undefined>();
  const [cadena, setCadena] = useState<CadenaInfo | null>(null);
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
      .from("mensajes_cadena")
      .select("id, autor, texto, enviado_el")
      .eq("cadena_id", id)
      .order("enviado_el");
    const lista = (data as Mensaje[]) || [];
    setMensajes(lista);
    // Marcar hasta dónde leí (para el contador de nuevos del garage)
    if (lista.some((m) => m.autor !== uid)) {
      await supabase
        .from("lecturas_cadena")
        .upsert(
          { cadena_id: id, usuario: uid, leido_hasta: new Date().toISOString() },
          { onConflict: "cadena_id,usuario" }
        );
    }
  }, [supabase, id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [perfilR, cadenasR] = await Promise.all([
        supabase.from("perfiles").select("nombre").eq("id", user.id).single(),
        supabase.rpc("mis_cadenas"),
      ]);
      if (perfilR.data) setNombre(perfilR.data.nombre);
      const c = ((cadenasR.data as CadenaInfo[]) || []).find((x) => x.cadena_id === id);
      setCadena(c || null);
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

  async function recargarCadena() {
    const { data } = await supabase.rpc("mis_cadenas");
    const c = ((data as CadenaInfo[]) || []).find((x) => x.cadena_id === id);
    setCadena(c || null);
  }

  async function marcarConcretado() {
    if (marcando) return;
    setMarcando(true);
    setConfirmando(false);
    const { error } = await supabase.rpc("marcar_concretado_cadena", { p_cadena: id });
    if (error) console.error("[Motocambio] Error confirmando cadena:", error);
    await recargarCadena();
    setMarcando(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !userId || enviando) return;
    setEnviando(true);
    const { error } = await supabase.from("mensajes_cadena").insert({
      cadena_id: id,
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

  // Nombre del autor de cada mensaje (somos tres en el chat)
  function nombreDe(autor: string) {
    if (!cadena) return "";
    if (autor === cadena.recibo_de_id) return cadena.recibo_de;
    if (autor === cadena.entrego_a_id) return cadena.entrego_a;
    return "";
  }

  const dif = cadena && cadena.mi_precio != null && cadena.recibo_precio != null
    ? Number(cadena.recibo_precio) - Number(cadena.mi_precio)
    : null;

  return (
    <div className="min-h-screen bg-hueso flex flex-col">
      <HeaderApp nombre={nombre} activo="garage" sinNavInferior />
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex flex-col flex-1">
        <Link href="/garage" className="text-sm font-semibold text-gris hover:text-rojo">
          ← Volver a mi garage
        </Link>

        {cargando ? (
          <p className="text-sm text-gris mt-6">Cargando cadena…</p>
        ) : !cadena ? (
          <div className="mt-6 bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🤔</p>
            <p className="font-titulos font-extrabold text-lg">No encontramos esta cadena</p>
            <p className="text-sm text-gris mt-1">
              Puede haberse dado de baja alguna de las motos o alguna búsqueda del círculo.
            </p>
          </div>
        ) : (
          <>
            {/* El triángulo: quién entrega a quién */}
            <div className="mt-3 bg-asfalto text-white rounded-2xl p-4">
              <p className="font-titulos font-extrabold text-[15px]">
                🔁 Cadena de cambio entre 3
              </p>
              <p className="text-xs text-[#C9C9D9] mt-0.5 mb-3">
                Cada uno entrega su moto y recibe la que buscaba. El círculo cierra solo si están los tres.
              </p>
              <div className="bg-white/10 rounded-xl p-3 space-y-2 text-sm">
                <p className="leading-snug">
                  <span className="text-[#FF7A8E] font-bold">Recibís</span>{" "}
                  la <b>{cadena.recibo_marca} {cadena.recibo_modelo} {cadena.recibo_anio}</b> de{" "}
                  <b>{cadena.recibo_de}</b>
                </p>
                <p className="leading-snug">
                  <span className="text-[#FF7A8E] font-bold">Entregás</span>{" "}
                  tu <b>{cadena.mi_moto}</b> a <b>{cadena.entrego_a}</b>
                </p>
                <p className="leading-snug text-[#C9C9D9]">
                  Y <b className="text-white">{cadena.entrego_a}</b> le entrega su{" "}
                  <b className="text-white">{cadena.tercera_moto}</b> a{" "}
                  <b className="text-white">{cadena.recibo_de}</b>. Círculo cerrado ✓
                </p>
              </div>
            </div>

            {/* La moto que recibo */}
            <div className="mt-2 bg-white border border-linea rounded-2xl p-4 flex items-center gap-3">
              {cadena.recibo_fotos?.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cadena.recibo_fotos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asfalto to-[#3A1F2B] flex items-center justify-center text-2xl">🏍️</div>
              )}
              <div className="min-w-0">
                <p className="font-titulos font-extrabold text-[15px] truncate">
                  {cadena.recibo_marca} {cadena.recibo_modelo} {cadena.recibo_anio}
                </p>
                <p className="text-xs text-gris">
                  {Number(cadena.recibo_km).toLocaleString("es-AR")} km
                  {cadena.recibo_provincia ? ` · ${cadena.recibo_provincia}` : ""}
                  {dif != null && dif !== 0
                    ? ` · dif. estimada: ${dif > 0 ? "pagás" : "recibís"} USD ${Math.abs(dif).toLocaleString("es-AR")}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Estado del cambio */}
            {cadena.estado === "concretada" ? (
              <div className="mt-2 bg-[#E9F7EF] border border-[#CDE4D4] rounded-2xl p-4 text-center">
                <p className="font-titulos font-extrabold text-verde-ok">
                  🤝 ¡Cadena concretada! Felicitaciones a los tres 🎉
                </p>
                <p className="text-xs text-tinta2 mt-1">
                  Las tres motos fueron dadas de baja de la plataforma. Pueden seguir
                  usando este chat para coordinar las entregas y las transferencias.
                </p>
              </div>
            ) : cadena.confirme ? (
              <div className="mt-2 bg-[#FDF1E3] border border-[#EFD9BB] rounded-2xl p-3.5 text-center">
                <p className="text-sm font-semibold text-ambar">
                  🤝 Confirmaste el cambio ({cadena.confirmaciones} de 3). Falta que
                  confirme{3 - cadena.confirmaciones === 1 ? "" : "n"} {3 - cadena.confirmaciones} más.
                </p>
              </div>
            ) : cadena.confirmaciones > 0 ? (
              <div className="mt-2 bg-[#E9F7EF] border-2 border-verde-ok rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-verde-ok">
                  🎉 Ya confirmaron {cadena.confirmaciones} de 3. ¿Lo confirmás vos también?
                </p>
                <p className="text-xs text-tinta2 mt-1">
                  Cuando confirmen los tres, las tres motos se dan de baja automáticamente.
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
                  ¿Seguro? Les vamos a pedir a {cadena.recibo_de} y a {cadena.entrego_a} que
                  confirmen también, y cuando estén los tres, las tres motos se dan de baja.
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
                🤝 ¿Concretaron el cambio los tres? Marcalo acá
              </button>
            )}

            <p className="text-[11px] text-gris text-center mt-2 px-4">
              Consejo: las tres entregas conviene hacerlas el mismo día y coordinadas, con
              papeles verificados antes de cualquier seña. Nunca compartan claves ni datos
              bancarios por acá.
            </p>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto mt-2 mb-3 flex flex-col gap-1.5 min-h-[40vh] max-h-[55vh] px-1">
              {mensajes.length === 0 && (
                <p className="text-sm text-gris text-center my-auto">
                  Todavía no hay mensajes. Son tres en este chat — ¡rompé el hielo! 🧊
                </p>
              )}
              {mensajes.map((m, i) => {
                const mio = m.autor === userId;
                const nuevoDia = i === 0 || dia(m.enviado_el) !== dia(mensajes[i - 1].enviado_el);
                const mostrarNombre = !mio && (i === 0 || mensajes[i - 1].autor !== m.autor);
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
                        {mostrarNombre && (
                          <span className="block text-[11px] font-bold text-rojo">
                            {nombreDe(m.autor)}
                          </span>
                        )}
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
                placeholder="Escribí a los otros dos…"
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
