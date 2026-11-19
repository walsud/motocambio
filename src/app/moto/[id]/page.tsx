"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";
import { VisorFotos } from "@/components/VisorFotos";

interface FichaMoto {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
  anio: number;
  km: number;
  precio_usd: number | null;
  fotos: string[];
  descripcion: string | null;
  provincia: string | null;
  accesorios: string[];
  creado_el: string;
  dueno_nombre: string;
  dueno_tipo: string;
}

export default function Ficha() {
  const { id } = useParams<{ id: string }>();
  const supabase = crearClienteNavegador();
  const [moto, setMoto] = useState<FichaMoto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [viaMatch, setViaMatch] = useState(false);
  const [logueado, setLogueado] = useState(false);
  const [nombre, setNombre] = useState<string | undefined>();
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Compartir la ficha: menú nativo en el celular, copia el link en la compu
  async function compartir() {
    if (!moto) return;
    const url = window.location.href;
    const titulo = `${moto.marca} ${moto.modelo} ${moto.anio} en Motocambio`;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        /* canceló el menú: no hacemos nada */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 3000);
    } catch {
      /* sin permiso de portapapeles */
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLogueado(true);
        const { data } = await supabase.from("perfiles").select("nombre").eq("id", user.id).single();
        if (data) setNombre(data.nombre);
      }

      const { data: pub } = await supabase
        .from("motos_publicas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (pub) {
        setMoto(pub as FichaMoto);
      } else if (user) {
        // No está en la vidriera: puede ser una moto oculta (de
        // entrega) con la que tengo un match — la base decide.
        const { data: fm, error } = await supabase.rpc("ficha_para_match", { p_moto: id });
        if (error) console.error("[Motocambio] Error cargando ficha:", error.message);
        const fila = Array.isArray(fm) ? fm[0] : fm;
        if (fila) {
          setMoto(fila as FichaMoto);
          setViaMatch(true);
        }
      }
      setCargando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp activo="explorar" logueado={logueado} nombre={nombre} />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <Link href="/explorar" className="text-sm font-semibold text-gris hover:text-rojo">
          ← Volver a Explorar
        </Link>

        {cargando ? (
          <p className="text-sm text-gris mt-6">Cargando…</p>
        ) : !moto ? (
          <div className="mt-6 bg-white border border-linea rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🏍️💨</p>
            <p className="font-titulos font-extrabold text-lg">Esta moto ya no está publicada</p>
            <p className="text-sm text-gris mt-1">
              Puede haberse pausado o concretado su cambio.
            </p>
            <Link href="/explorar" className="inline-block mt-5 bg-rojo text-white font-titulos font-extrabold rounded-xl px-6 py-3">
              Ver otras motos →
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
            {viaMatch && (
              <div className="lg:col-span-2 bg-[#FDF1E3] border border-[#EFD9BB] rounded-xl px-4 py-3 text-sm text-tinta2">
                🔄 Esta moto no está en la vidriera pública (es una moto de
                entrega): la podés ver porque tienen un match.
              </div>
            )}
            {/* Galería */}
            <section className="bg-white border border-linea rounded-2xl overflow-hidden shadow-sm">
              {moto.fotos?.length ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={moto.fotos[fotoActiva]}
                    alt={`${moto.marca} ${moto.modelo}`}
                    onClick={() => setVisorAbierto(true)}
                    className="w-full aspect-[4/3] object-cover cursor-zoom-in"
                    title="Tocá para agrandar"
                  />
                  {visorAbierto && (
                    <VisorFotos
                      fotos={moto.fotos}
                      inicial={fotoActiva}
                      alt={`${moto.marca} ${moto.modelo}`}
                      onCerrar={() => setVisorAbierto(false)}
                    />
                  )}
                  {moto.fotos.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {moto.fotos.map((f, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={f}
                          src={f}
                          alt=""
                          onClick={() => setFotoActiva(i)}
                          className={`h-16 w-16 object-cover rounded-lg cursor-pointer border-2 ${
                            i === fotoActiva ? "border-rojo" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-7xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
              )}
            </section>

            {/* Datos */}
            <section className="flex flex-col gap-4">
              <div className="bg-white border border-linea rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="font-titulos font-black text-2xl tracking-tight leading-tight">
                    {moto.marca} {moto.modelo}
                  </h1>
                  {moto.dueno_tipo === "concesionario" && (
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-[#EDF0FA] text-[#3D5AA9] whitespace-nowrap mt-1.5">
                      Concesionario
                    </span>
                  )}
                </div>
                <p className="text-sm text-gris mt-1">
                  {moto.anio} · {moto.km.toLocaleString("es-AR")} km · {moto.provincia}
                </p>
                {moto.categoria && (
                  <p className="text-xs text-tinta2 mt-1.5">
                    {moto.categoria} · {moto.cilindrada} cc
                  </p>
                )}
                {moto.precio_usd && (
                  <p className="font-titulos font-black text-3xl text-rojo mt-3">
                    USD {Number(moto.precio_usd).toLocaleString("es-AR")}
                  </p>
                )}
                <p className="text-xs text-gris mt-1">Valor pretendido para el cambio</p>
                {moto.descripcion && (
                  <p className="text-sm text-tinta2 mt-3 leading-relaxed">{moto.descripcion}</p>
                )}
                {moto.accesorios?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {moto.accesorios.map((a) => (
                      <span key={a} className="text-[12px] font-semibold bg-hueso border border-linea rounded-full px-2.5 py-1">
                        🧰 {a}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gris mt-4 pt-3 border-t border-linea">
                  Publicada por <b>{moto.dueno_nombre}</b>
                </p>
                <button
                  onClick={compartir}
                  className="mt-3 w-full border-2 border-linea hover:border-rojo text-sm font-semibold rounded-xl py-2.5 text-tinta2"
                >
                  {linkCopiado ? "✓ Link copiado, listo para pegar" : "📤 Compartir esta moto"}
                </button>
              </div>

              <div className="bg-asfalto text-white rounded-2xl p-5">
                <h2 className="font-titulos font-extrabold text-lg">¿Te interesa esta moto?</h2>
                {logueado ? (
                  <>
                    <p className="text-sm text-[#C9C9D9] mt-1.5 leading-relaxed">
                      Sumá el modelo <b className="text-white">{moto.marca} {moto.modelo}</b> a
                      tu búsqueda en Mi garage. Si a su dueño le interesa la tuya, el matching
                      los conecta y les avisamos a los dos.
                    </p>
                    <Link href="/garage" className="inline-block mt-4 bg-rojo hover:bg-rojo-oscuro font-titulos font-extrabold rounded-xl px-5 py-3">
                      Sumarla a mi búsqueda →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#C9C9D9] mt-1.5 leading-relaxed">
                      Creá tu cuenta gratis, publicá tu moto y contá que buscás una como esta.
                      Si hay interés mutuo, el matching los conecta.
                    </p>
                    <Link href="/registro" className="inline-block mt-4 bg-rojo hover:bg-rojo-oscuro font-titulos font-extrabold rounded-xl px-5 py-3">
                      Crear cuenta gratis →
                    </Link>
                  </>
                )}
              </div>

              <p className="text-[11px] text-gris leading-relaxed px-1">
                La verificación de papeles y estado de las motos, y la transferencia,
                corren por cuenta y responsabilidad de ambas partes. Motocambio recomienda
                verificación policial y escribano o gestor de confianza.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
