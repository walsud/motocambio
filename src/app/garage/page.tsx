"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";
import { type ModeloCatalogo } from "@/components/Autocompletar";
import { SelectorModelo } from "@/components/SelectorModelo";

const PROVINCIAS = [
  "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
  "Entre Ríos", "Salta", "Neuquén", "Río Negro", "Corrientes", "Misiones",
  "Chaco", "San Juan", "San Luis", "Jujuy", "La Pampa", "Otra",
];

const ACCESORIOS_COMUNES = [
  "Baúl trasero", "Maletas laterales", "Parabrisas alto", "Escape deportivo",
  "Luces auxiliares", "Defensas", "Cubre manos", "Puños calefaccionados",
  "Soporte GPS/celular", "Toma USB/12V", "Alarma", "Asiento confort",
  "Portaequipaje", "Cubiertas nuevas",
];

interface Moto {
  id: string;
  modelo_id: number;
  anio: number;
  km: number;
  precio_usd: number | null;
  provincia: string | null;
  dominio: string | null;
  visibilidad: string;
  estado: string;
  fotos: string[];
  accesorios: string[];
}

interface BusquedaModelo {
  modelo_id: number;
}

interface MatchInfo {
  match_id: string;
  tipo: string;
  estado: string;
  creado_el: string;
  diferencia: number | null;
  mi_moto_id: string;
  mi_moto: string;
  otra_moto_id: string;
  otra_marca: string;
  otra_modelo: string;
  otra_anio: number;
  otra_km: number;
  otra_precio: number | null;
  otra_provincia: string | null;
  otra_fotos: string[];
  otra_accesorios: string[];
  otro_nombre: string;
}

// Comprime una foto en el navegador antes de subirla (máx 1280px, JPEG)
async function comprimirFoto(archivo: File): Promise<Blob> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(archivo);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const escala = Math.min(1, 1280 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.8)
  );
}

export default function Garage() {
  const supabase = crearClienteNavegador();
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [catalogo, setCatalogo] = useState<ModeloCatalogo[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [motos, setMotos] = useState<Moto[]>([]);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [aviso, setAviso] = useState("");

  // --- formulario de alta de moto ---
  const [modeloSel, setModeloSel] = useState<ModeloCatalogo | null>(null);
  const [anio, setAnio] = useState("");
  const [km, setKm] = useState("");
  const [precio, setPrecio] = useState("");
  const [provincia, setProvincia] = useState("CABA");
  const [dominio, setDominio] = useState("");
  const [visibilidad, setVisibilidad] = useState<"publicada" | "entrega">("publicada");
  const [accesoriosSel, setAccesoriosSel] = useState<string[]>([]);
  const [otroAccesorio, setOtroAccesorio] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardandoMoto, setGuardandoMoto] = useState(false);
  // --- edición de una moto ya cargada ---
  const [motoEditando, setMotoEditando] = useState<Moto | null>(null);
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const formRef = useRef<HTMLElement>(null);

  // --- búsqueda ---
  const [buscados, setBuscados] = useState<ModeloCatalogo[]>([]);
  const [aceptos, setAceptos] = useState<string[]>([]);
  const [nuevoAcepto, setNuevoAcepto] = useState("");
  const [difMax, setDifMax] = useState("0");
  const [difMin, setDifMin] = useState("0");
  const [alcance, setAlcance] = useState<"pais" | "provincia">("pais");
  const [motoOfrecida, setMotoOfrecida] = useState<string>("");
  const [guardandoBusqueda, setGuardandoBusqueda] = useState(false);

  // El catálogo se carga SOLO e independiente del resto: es la pieza
  // crítica del matching y no puede fallar en silencio.
  const cargarCatalogo = useCallback(async (): Promise<ModeloCatalogo[]> => {
    setErrorCatalogo("");
    const { data, error } = await supabase
      .from("catalogo_modelos")
      .select("id, marca, modelo, categoria, cilindrada")
      .eq("activo", true)
      .order("marca")
      .order("modelo");
    if (error) {
      console.error("[Motocambio] Error cargando catálogo:", error);
      setErrorCatalogo(error.message);
      return [];
    }
    if (!data || data.length === 0) {
      console.warn("[Motocambio] Catálogo vacío");
      setErrorCatalogo("El catálogo llegó vacío.");
      return [];
    }
    setCatalogo(data as ModeloCatalogo[]);
    return data as ModeloCatalogo[];
  }, [supabase]);

  const cargarTodo = useCallback(async () => {
    // 1) Catálogo primero, con un reintento automático si falla
    let cat = await cargarCatalogo();
    if (cat.length === 0) {
      await new Promise((r) => setTimeout(r, 1500));
      cat = await cargarCatalogo();
    }

    // 2) Datos del usuario
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [perfilR, motosR, busR, matchesR] = await Promise.all([
      supabase.from("perfiles").select("nombre").eq("id", user.id).single(),
      supabase.from("motos").select("*").eq("dueno", user.id).neq("estado", "cambiada").order("creado_el"),
      supabase.from("busquedas").select("*, busqueda_modelos(modelo_id), busqueda_acepta(descripcion)").eq("usuario", user.id).eq("activa", true).limit(1),
      supabase.rpc("mis_matches"),
    ]);

    if (perfilR.data) setNombre(perfilR.data.nombre);
    if (motosR.error) console.error("[Motocambio] Error cargando motos:", motosR.error);
    setMotos((motosR.data as Moto[]) || []);
    if (matchesR.error) console.error("[Motocambio] Error cargando matches:", matchesR.error);
    setMatches((matchesR.data as MatchInfo[]) || []);

    const b = busR.data?.[0];
    if (b) {
      setDifMax(String(b.dif_max_pagar ?? 0));
      setDifMin(String(b.dif_min_recibir ?? 0));
      setAlcance(b.alcance);
      setMotoOfrecida(b.moto_ofrecida || "");
      const ids = (b.busqueda_modelos as BusquedaModelo[]).map((x) => x.modelo_id);
      setBuscados(cat.filter((m) => ids.includes(m.id)));
      setAceptos((b.busqueda_acepta as { descripcion: string }[]).map((x) => x.descripcion));
    }
  }, [supabase, cargarCatalogo]);

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function avisar(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 4000);
  }

  const nombreModelo = useCallback(
    (id: number) => {
      const m = catalogo.find((c) => c.id === id);
      return m ? `${m.marca} ${m.modelo}` : "Moto";
    },
    [catalogo]
  );

  function limpiarFormulario() {
    setModeloSel(null); setAnio(""); setKm(""); setPrecio(""); setDominio("");
    setVisibilidad("publicada"); setArchivos([]);
    setAccesoriosSel([]); setOtroAccesorio("");
    setMotoEditando(null); setFotosExistentes([]);
  }

  // ---------- EDICIÓN ----------
  function editarMoto(m: Moto) {
    setMotoEditando(m);
    setModeloSel(catalogo.find((c) => c.id === m.modelo_id) || null);
    setAnio(String(m.anio));
    setKm(String(m.km));
    setPrecio(m.precio_usd ? String(m.precio_usd) : "");
    setProvincia(m.provincia || "CABA");
    setDominio(m.dominio || "");
    setVisibilidad(m.visibilidad === "entrega" ? "entrega" : "publicada");
    setAccesoriosSel(m.accesorios || []);
    setFotosExistentes(m.fotos || []);
    setArchivos([]);
    setOtroAccesorio("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Convierte una URL pública del bucket en su ruta interna, para poder borrarla
  function rutaDeFoto(url: string): string | null {
    const parte = url.split("/object/public/fotos/")[1];
    return parte ? decodeURIComponent(parte) : null;
  }

  // ---------- ALTA / EDICIÓN DE MOTO ----------
  async function guardarMoto(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !modeloSel) {
      avisar("Elegí el modelo del catálogo (escribí y seleccioná de la lista).");
      return;
    }
    setGuardandoMoto(true);

    // ----- Modo edición: actualizo la publicación existente -----
    if (motoEditando) {
      const { error } = await supabase
        .from("motos")
        .update({
          modelo_id: modeloSel.id,
          anio: parseInt(anio),
          km: parseInt(km) || 0,
          precio_usd: precio ? parseInt(precio) : null,
          provincia,
          dominio: dominio.trim().toUpperCase() || null,
          visibilidad,
          accesorios: accesoriosSel,
        })
        .eq("id", motoEditando.id);

      if (error) {
        setGuardandoMoto(false);
        avisar(
          error.message.includes("300")
            ? "Ese modelo es de menos de 300cc: solo puede quedar como moto de entrega."
            : "No se pudo guardar: " + error.message
        );
        return;
      }

      // Fotos que el usuario sacó: las borro del almacenamiento
      const borradas = (motoEditando.fotos || []).filter((u) => !fotosExistentes.includes(u));
      if (borradas.length) {
        const rutas = borradas.map(rutaDeFoto).filter((r): r is string => !!r);
        if (rutas.length) await supabase.storage.from("fotos").remove(rutas);
      }

      // Fotos nuevas: comprimo y subo hasta completar 6
      const nuevasUrls: string[] = [];
      const cupo = Math.max(0, 6 - fotosExistentes.length);
      for (let i = 0; i < Math.min(archivos.length, cupo); i++) {
        try {
          const blob = await comprimirFoto(archivos[i]);
          const ruta = `${userId}/${motoEditando.id}/e${Date.now()}-${i}.jpg`;
          const { error: errSubida } = await supabase.storage
            .from("fotos")
            .upload(ruta, blob, { contentType: "image/jpeg", upsert: true });
          if (!errSubida) {
            const { data: pub } = supabase.storage.from("fotos").getPublicUrl(ruta);
            nuevasUrls.push(pub.publicUrl);
          }
        } catch {
          // una foto que falla no frena la edición
        }
      }
      await supabase
        .from("motos")
        .update({ fotos: [...fotosExistentes, ...nuevasUrls] })
        .eq("id", motoEditando.id);

      setGuardandoMoto(false);
      limpiarFormulario();
      avisar("✓ Publicación actualizada.");
      fetch("/api/notificar-matches", { method: "POST" }).catch(() => {});
      cargarTodo();
      return;
    }

    // ----- Modo alta: creo una publicación nueva -----
    const { data: nueva, error } = await supabase
      .from("motos")
      .insert({
        dueno: userId,
        modelo_id: modeloSel.id,
        anio: parseInt(anio),
        km: parseInt(km) || 0,
        precio_usd: precio ? parseInt(precio) : null,
        provincia,
        dominio: dominio.trim().toUpperCase() || null,
        visibilidad,
        accesorios: accesoriosSel,
      })
      .select()
      .single();

    if (error || !nueva) {
      setGuardandoMoto(false);
      avisar(
        error?.message.includes("300")
          ? "Ese modelo es de menos de 300cc: cargalo como moto de entrega."
          : "No se pudo guardar: " + (error?.message || "error")
      );
      return;
    }

    // Fotos: comprimir y subir (máx 6)
    const urls: string[] = [];
    for (let i = 0; i < Math.min(archivos.length, 6); i++) {
      try {
        const blob = await comprimirFoto(archivos[i]);
        const ruta = `${userId}/${nueva.id}/${i}.jpg`;
        const { error: errSubida } = await supabase.storage
          .from("fotos")
          .upload(ruta, blob, { contentType: "image/jpeg", upsert: true });
        if (!errSubida) {
          const { data: pub } = supabase.storage.from("fotos").getPublicUrl(ruta);
          urls.push(pub.publicUrl);
        }
      } catch {
        // una foto que falla no frena el alta
      }
    }
    if (urls.length) {
      await supabase.from("motos").update({ fotos: urls }).eq("id", nueva.id);
    }

    setGuardandoMoto(false);
    limpiarFormulario();
    avisar("🎉 ¡Moto cargada! Ya está en el motor de matching.");
    fetch("/api/notificar-matches", { method: "POST" }).catch(() => {});
    cargarTodo();
  }

  async function pausarMoto(m: Moto) {
    const nuevo = m.estado === "activa" ? "pausada" : "activa";
    await supabase.from("motos").update({ estado: nuevo }).eq("id", m.id);
    avisar(nuevo === "pausada" ? "Moto pausada." : "Moto activada de nuevo.");
    cargarTodo();
  }

  // ---------- BÚSQUEDA ----------
  async function guardarBusqueda() {
    if (!userId) return;
    setGuardandoBusqueda(true);
    // Reemplazo simple: borro la búsqueda anterior y creo la nueva
    await supabase.from("busquedas").delete().eq("usuario", userId);
    const { data: nueva, error } = await supabase
      .from("busquedas")
      .insert({
        usuario: userId,
        moto_ofrecida: motoOfrecida || null,
        dif_max_pagar: parseInt(difMax) || 0,
        dif_min_recibir: parseInt(difMin) || 0,
        alcance,
      })
      .select()
      .single();
    if (!error && nueva) {
      if (buscados.length)
        await supabase.from("busqueda_modelos").insert(
          buscados.map((m) => ({ busqueda_id: nueva.id, modelo_id: m.id }))
        );
      if (aceptos.length)
        await supabase.from("busqueda_acepta").insert(
          aceptos.map((d) => ({ busqueda_id: nueva.id, descripcion: d }))
        );
      avisar("✓ Búsqueda guardada. El matching ya está cruzando tus datos.");
      fetch("/api/notificar-matches", { method: "POST" }).catch(() => {});
      cargarTodo();
    } else {
      avisar("No se pudo guardar la búsqueda: " + (error?.message || "error"));
    }
    setGuardandoBusqueda(false);
  }

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp nombre={nombre} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <h1 className="font-titulos font-black text-3xl tracking-tight">Mi garage</h1>
        <p className="text-gris mt-1 mb-7">
          Tu moto publicada y lo que estás buscando: con esas dos puntas se arma el match.
        </p>

        {aviso && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-asfalto text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl z-50">
            {aviso}
          </div>
        )}

        {errorCatalogo && (
          <div className="mb-6 bg-[#FBF0F1] border border-[#EED2D6] rounded-xl p-4 text-sm text-rojo flex items-center gap-3 flex-wrap">
            <span>
              ⚠️ No pudimos cargar el catálogo de modelos ({errorCatalogo}).
              Sin catálogo no se puede cargar una moto.
            </span>
            <button
              onClick={() => cargarCatalogo()}
              className="ml-auto bg-rojo text-white font-semibold rounded-lg px-4 py-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ---------- TUS MATCHES ---------- */}
        <section className="mb-10">
          <h2 className="font-titulos font-extrabold text-xl mb-3">💘 Tus matches</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-gris bg-white border border-linea rounded-xl p-5">
              Todavía no hay matches. Apenas aparezca una moto que buscás cuyo dueño
              se interese por la tuya, la vas a ver acá — y te avisamos por mail.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((mt) => (
                <div key={mt.match_id} className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm ${
                  mt.tipo === "directo" ? "border-verde-ok" : "border-linea"
                }`}>
                  {mt.otra_fotos?.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mt.otra_fotos[0]} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
                  )}
                  <div className="p-4">
                    <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${
                      mt.tipo === "directo" ? "bg-[#E9F7EF] text-verde-ok" : "bg-[#FDF1E3] text-ambar"
                    }`}>
                      {mt.tipo === "directo" ? "🎯 Match directo" : "👀 Interés parcial"}
                    </span>
                    <h3 className="font-titulos font-extrabold text-[15px] mt-2">
                      {mt.otra_marca} {mt.otra_modelo} · {mt.otra_anio}
                    </h3>
                    <p className="text-xs text-gris mt-0.5">
                      {mt.otra_km.toLocaleString("es-AR")} km · {mt.otra_provincia}
                      {mt.otra_precio ? ` · USD ${Number(mt.otra_precio).toLocaleString("es-AR")}` : ""}
                    </p>
                    <p className="text-xs text-tinta2 mt-1.5">
                      De <b>{mt.otro_nombre}</b> — por tu <b>{mt.mi_moto}</b>
                      {mt.diferencia != null && Number(mt.diferencia) > 0
                        ? ` · dif. estimada USD ${Number(mt.diferencia).toLocaleString("es-AR")}`
                        : ""}
                    </p>
                    {mt.otra_accesorios?.length > 0 && (
                      <p className="text-[11px] text-tinta2 mt-1.5 bg-hueso rounded-lg px-2 py-1">
                        🧰 {mt.otra_accesorios.slice(0, 3).join(" · ")}
                        {mt.otra_accesorios.length > 3 ? ` · +${mt.otra_accesorios.length - 3} más` : ""}
                      </p>
                    )}
                    <p className="text-[11px] text-gris mt-2">
                      El chat entre ustedes llega en la próxima etapa 💬
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- MIS MOTOS ---------- */}
        <section className="mb-10">
          <h2 className="font-titulos font-extrabold text-xl mb-3">🏍️ Mis motos</h2>
          {motos.length === 0 ? (
            <p className="text-sm text-gris bg-white border border-linea rounded-xl p-5">
              Todavía no cargaste ninguna moto. Completá el formulario de abajo
              y tu moto entra al motor de matching al instante.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {motos.map((m) => (
                <div key={m.id} className="bg-white border border-linea rounded-2xl overflow-hidden shadow-sm">
                  {m.fotos?.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.fotos[0]} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-titulos font-extrabold text-[15px]">
                      {nombreModelo(m.modelo_id)} · {m.anio}
                    </h3>
                    <p className="text-xs text-gris mt-0.5">
                      {m.km.toLocaleString("es-AR")} km · {m.provincia}
                      {m.precio_usd ? ` · USD ${m.precio_usd.toLocaleString("es-AR")}` : ""}
                    </p>
                    {m.accesorios?.length > 0 && (
                      <p className="text-[11px] text-tinta2 mt-1.5 bg-hueso rounded-lg px-2 py-1">
                        🧰 {m.accesorios.slice(0, 3).join(" · ")}
                        {m.accesorios.length > 3 ? ` · +${m.accesorios.length - 3} más` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${
                        m.visibilidad === "publicada" ? "bg-[#E9F7EF] text-verde-ok" : "bg-[#EDF0FA] text-[#3D5AA9]"
                      }`}>
                        {m.visibilidad === "publicada" ? "Publicada" : "Moto de entrega"}
                      </span>
                      {m.estado === "pausada" && (
                        <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-[#FDF1E3] text-ambar">Pausada</span>
                      )}
                      <button
                        onClick={() => editarMoto(m)}
                        className="ml-auto text-xs font-bold text-rojo hover:underline"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => pausarMoto(m)}
                        className="text-xs font-semibold text-gris hover:text-rojo"
                      >
                        {m.estado === "activa" ? "Pausar" : "Reactivar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* ---------- CARGAR MOTO ---------- */}
          <section ref={formRef} className={`min-w-0 bg-white border rounded-2xl shadow-sm p-6 ${motoEditando ? "border-rojo border-2" : "border-linea"}`}>
            <h2 className="font-titulos font-extrabold text-xl mb-1">
              {motoEditando ? "✏️ Editar publicación" : "➕ Cargar una moto"}
            </h2>
            <p className="text-sm text-gris mb-5">
              {motoEditando
                ? `Estás editando tu ${nombreModelo(motoEditando.modelo_id)}. Cambiá lo que quieras y guardá.`
                : "Elegí el modelo del catálogo — así el matching nunca falla."}
            </p>
            <form onSubmit={guardarMoto} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold">Modelo</label>
                {modeloSel ? (
                  <div className="mt-1 flex items-center gap-2 bg-hueso border-2 border-linea rounded-xl px-3.5 py-2.5">
                    <b className="text-sm">
                      {modeloSel.marca} {modeloSel.modelo}
                    </b>
                    <span className="text-xs text-gris">· {modeloSel.cilindrada} cc</span>
                    <button type="button" onClick={() => setModeloSel(null)} className="ml-auto text-rojo font-bold">✕</button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <SelectorModelo catalogo={catalogo} onElegir={setModeloSel} />
                    {catalogo.length > 0 && (
                      <p className="text-xs text-gris mt-1.5">
                        {catalogo.length} modelos en el catálogo. ¿Falta el tuyo? Escribinos a contacto@motocambio.com.ar
                      </p>
                    )}
                  </div>
                )}
                {modeloSel && modeloSel.cilindrada < 280 && (
                  <p className="text-xs text-ambar mt-1.5">
                    Este modelo es de menos de 300cc: solo puede cargarse como <b>moto de entrega</b>.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Año
                  <input required type="number" min={1980} max={2027} value={anio} onChange={(e) => setAnio(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" placeholder="2021" />
                </label>
                <label className="text-sm font-semibold">
                  Kilómetros
                  <input required type="number" min={0} value={km} onChange={(e) => setKm(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" placeholder="15000" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Valor pretendido (USD)
                  <input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" placeholder="9000" />
                </label>
                <label className="text-sm font-semibold">
                  Provincia
                  <select value={provincia} onChange={(e) => setProvincia(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal bg-white outline-none focus:border-rojo">
                    {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label className="text-sm font-semibold">
                Dominio (patente) — privado, nunca se muestra
                <input value={dominio} onChange={(e) => setDominio(e.target.value)}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal uppercase outline-none focus:border-rojo" placeholder="A123BCD" />
              </label>
              <div className="text-sm font-semibold">
                Visibilidad
                <div className="mt-1.5 flex gap-2">
                  <button type="button" onClick={() => setVisibilidad("publicada")}
                    disabled={!!modeloSel && modeloSel.cilindrada < 280}
                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold disabled:opacity-40 ${
                      visibilidad === "publicada" ? "border-rojo bg-[#FBF0F1] text-rojo" : "border-linea text-tinta2"
                    }`}>
                    Publicada (+300cc)
                  </button>
                  <button type="button" onClick={() => setVisibilidad("entrega")}
                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold ${
                      visibilidad === "entrega" ? "border-rojo bg-[#FBF0F1] text-rojo" : "border-linea text-tinta2"
                    }`}>
                    Moto de entrega
                  </button>
                </div>
                <p className="text-xs text-gris font-normal mt-1.5">
                  La moto de entrega no aparece en listados, pero el matching sí la ve (cualquier cilindrada).
                </p>
              </div>
              <div className="text-sm font-semibold">
                Accesorios agregados
                <p className="text-xs text-gris font-normal mt-0.5 mb-2">
                  Tocá los que tenga tu moto — suman valor y atraen matches.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACCESORIOS_COMUNES.map((a) => {
                    const activo = accesoriosSel.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setAccesoriosSel(
                            activo
                              ? accesoriosSel.filter((x) => x !== a)
                              : [...accesoriosSel, a]
                          )
                        }
                        className={`rounded-full border-2 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                          activo
                            ? "border-rojo bg-[#FBF0F1] text-rojo"
                            : "border-linea text-tinta2 hover:border-gris"
                        }`}
                      >
                        {activo ? "✓ " : "+ "}{a}
                      </button>
                    );
                  })}
                  {accesoriosSel
                    .filter((a) => !ACCESORIOS_COMUNES.includes(a))
                    .map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAccesoriosSel(accesoriosSel.filter((x) => x !== a))}
                        className="rounded-full border-2 border-rojo bg-[#FBF0F1] text-rojo px-3 py-1.5 text-[13px] font-semibold"
                      >
                        ✓ {a} ✕
                      </button>
                    ))}
                </div>
                <div className="flex gap-2 mt-2.5">
                  <input
                    value={otroAccesorio}
                    onChange={(e) => setOtroAccesorio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = otroAccesorio.trim();
                        if (v && !accesoriosSel.includes(v)) {
                          setAccesoriosSel([...accesoriosSel, v]);
                          setOtroAccesorio("");
                        }
                      }
                    }}
                    placeholder="Otro accesorio… (ej.: slider, pata más ancha)"
                    className="flex-1 border-2 border-linea rounded-xl px-3.5 py-2 text-sm font-normal outline-none focus:border-rojo"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = otroAccesorio.trim();
                      if (v && !accesoriosSel.includes(v)) {
                        setAccesoriosSel([...accesoriosSel, v]);
                        setOtroAccesorio("");
                      }
                    }}
                    className="border-2 border-linea rounded-xl px-4 text-sm font-semibold hover:border-rojo"
                  >
                    +
                  </button>
                </div>
              </div>
              {motoEditando && fotosExistentes.length > 0 && (
                <div className="text-sm font-semibold">
                  Fotos actuales — tocá la ✕ para sacar una
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {fotosExistentes.map((u) => (
                      <div key={u} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="h-16 w-16 object-cover rounded-lg border border-linea" />
                        <button
                          type="button"
                          onClick={() => setFotosExistentes(fotosExistentes.filter((x) => x !== u))}
                          className="absolute -top-1.5 -right-1.5 bg-rojo text-white rounded-full w-5 h-5 text-[11px] font-bold leading-none shadow"
                          aria-label="Sacar esta foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gris font-normal mt-1.5">
                    La foto se borra recién cuando tocás «Guardar cambios».
                  </p>
                </div>
              )}
              <label className="text-sm font-semibold">
                {motoEditando
                  ? `Agregar fotos nuevas (quedan ${Math.max(0, 6 - fotosExistentes.length)} lugares)`
                  : "Fotos (hasta 6 — se comprimen solas)"}
                <input type="file" accept="image/*" multiple
                  onChange={(e) => setArchivos(Array.from(e.target.files || []))}
                  className="mt-1 w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-asfalto file:text-white file:px-4 file:py-2 file:font-semibold" />
                {archivos.length > 0 && (
                  <span className="text-xs text-verde-ok font-normal">{archivos.length} foto(s) lista(s) para subir</span>
                )}
              </label>
              <div className="flex gap-3">
                {motoEditando && (
                  <button type="button" onClick={limpiarFormulario}
                    className="flex-1 border-2 border-linea rounded-xl py-3 text-sm font-semibold text-tinta2 hover:border-gris">
                    Cancelar
                  </button>
                )}
                <button disabled={guardandoMoto}
                  className="flex-[2] bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60">
                  {guardandoMoto ? "Guardando…" : motoEditando ? "Guardar cambios" : "Cargar mi moto →"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------- QUÉ BUSCO ---------- */}
          <section className="min-w-0 bg-white border border-linea rounded-2xl shadow-sm p-6">
            <h2 className="font-titulos font-extrabold text-xl mb-1">🎯 Qué busco</h2>
            <p className="text-sm text-gris mb-5">
              Podés buscar cualquier cilindrada: publicás +300, pedís lo que quieras.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold">Modelos que me interesan</label>
                {buscados.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {buscados.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1.5 bg-hueso border border-linea rounded-full px-3 py-1 text-[13px] font-semibold">
                        {m.marca} {m.modelo}
                        <button onClick={() => setBuscados(buscados.filter((x) => x.id !== m.id))} className="text-rojo font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1">
                  <SelectorModelo catalogo={catalogo} reiniciarAlElegir
                    onElegir={(m) => { if (!buscados.find((x) => x.id === m.id)) setBuscados([...buscados, m]); }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">También acepto (texto libre, opcional)</label>
                {aceptos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {aceptos.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 bg-hueso border border-linea rounded-full px-3 py-1 text-[13px] font-semibold">
                        🛵 {a}
                        <button onClick={() => setAceptos(aceptos.filter((_, j) => j !== i))} className="text-rojo font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <input value={nuevoAcepto} onChange={(e) => setNuevoAcepto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault();
                      if (nuevoAcepto.trim()) { setAceptos([...aceptos, nuevoAcepto.trim()]); setNuevoAcepto(""); } } }}
                    placeholder="Ej.: NMAX 155 0km, efectivo…"
                    className="flex-1 border-2 border-linea rounded-xl px-3.5 py-2.5 outline-none focus:border-rojo text-sm" />
                  <button type="button"
                    onClick={() => { if (nuevoAcepto.trim()) { setAceptos([...aceptos, nuevoAcepto.trim()]); setNuevoAcepto(""); } }}
                    className="border-2 border-linea rounded-xl px-4 text-sm font-semibold hover:border-rojo">
                    +
                  </button>
                </div>
              </div>
              <label className="text-sm font-semibold">
                Moto que ofrezco a cambio
                <select value={motoOfrecida} onChange={(e) => setMotoOfrecida(e.target.value)}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal bg-white outline-none focus:border-rojo">
                  <option value="">— Elegir una de mis motos —</option>
                  {motos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {nombreModelo(m.modelo_id)} · {m.anio}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">
                  Dif. máx. a pagar (USD)
                  <input type="number" min={0} value={difMax} onChange={(e) => setDifMax(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" />
                </label>
                <label className="text-sm font-semibold">
                  Dif. mín. a recibir (USD)
                  <input type="number" min={0} value={difMin} onChange={(e) => setDifMin(e.target.value)}
                    className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo" />
                </label>
              </div>
              <label className="text-sm font-semibold">
                Alcance
                <select value={alcance} onChange={(e) => setAlcance(e.target.value as "pais" | "provincia")}
                  className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal bg-white outline-none focus:border-rojo">
                  <option value="pais">Todo el país</option>
                  <option value="provincia">Solo mi provincia</option>
                </select>
              </label>
              <button onClick={guardarBusqueda} disabled={guardandoBusqueda}
                className="bg-asfalto text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60 hover:opacity-90">
                {guardandoBusqueda ? "Guardando…" : "Guardar mi búsqueda"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
