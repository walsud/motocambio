"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { HeaderApp } from "@/components/HeaderApp";

const PROVINCIAS = [
  "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
  "Entre Ríos", "Salta", "Neuquén", "Río Negro", "Corrientes", "Misiones",
  "Chaco", "San Juan", "San Luis", "Jujuy", "La Pampa", "Otra",
];

interface MotoPublica {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  cilindrada: number;
  anio: number;
  km: number;
  precio_usd: number | null;
  fotos: string[];
  provincia: string | null;
  accesorios: string[];
  creado_el: string;
  dueno_nombre: string;
  dueno_tipo: string;
}

export default function Explorar() {
  const supabase = crearClienteNavegador();
  const [motos, setMotos] = useState<MotoPublica[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [logueado, setLogueado] = useState(false);
  const [nombre, setNombre] = useState<string | undefined>();

  // filtros
  const [marca, setMarca] = useState("");
  const [provincia, setProvincia] = useState("");
  const [orden, setOrden] = useState<"recientes" | "precio_asc" | "precio_desc">("recientes");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    let consulta = supabase.from("motos_publicas").select("*");
    if (marca) consulta = consulta.eq("marca", marca);
    if (provincia) consulta = consulta.eq("provincia", provincia);
    if (orden === "recientes") {
      consulta = consulta.order("creado_el", { ascending: false });
    } else {
      consulta = consulta.order("precio_usd", {
        ascending: orden === "precio_asc",
        nullsFirst: false,
      });
    }
    const { data, error: err } = await consulta.limit(60);
    if (err) {
      console.error("[Motocambio] Error cargando motos públicas:", err);
      setError(err.message);
    }
    setMotos((data as MotoPublica[]) || []);
    setCargando(false);
  }, [supabase, marca, provincia, orden]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setLogueado(true);
        const { data } = await supabase.from("perfiles").select("nombre").eq("id", user.id).single();
        if (data) setNombre(data.nombre);
      }
    });
    supabase
      .from("catalogo_modelos")
      .select("marca")
      .eq("activo", true)
      .then(({ data }) => {
        if (data) setMarcas([...new Set(data.map((m) => m.marca))].sort());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-hueso">
      <HeaderApp activo="explorar" logueado={logueado} nombre={nombre} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <h1 className="font-titulos font-black text-3xl tracking-tight">Explorar motos</h1>
        <p className="text-gris mt-1 mb-6">
          Todas +300cc, todas para cambiar. ¿Viste una que te gusta? Sumala a tu búsqueda y que el matching trabaje.
        </p>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <select value={marca} onChange={(e) => setMarca(e.target.value)}
            className="border-2 border-linea rounded-xl px-3 py-2 text-sm font-semibold bg-white outline-none focus:border-rojo">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select value={provincia} onChange={(e) => setProvincia(e.target.value)}
            className="border-2 border-linea rounded-xl px-3 py-2 text-sm font-semibold bg-white outline-none focus:border-rojo">
            <option value="">Todo el país</option>
            {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)}
            className="border-2 border-linea rounded-xl px-3 py-2 text-sm font-semibold bg-white outline-none focus:border-rojo">
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
          {(marca || provincia) && (
            <button onClick={() => { setMarca(""); setProvincia(""); }}
              className="text-sm font-semibold text-rojo px-2">
              ✕ Limpiar
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-[#FBF0F1] border border-[#EED2D6] rounded-xl p-4 text-sm text-rojo flex items-center gap-3 flex-wrap">
            <span>⚠️ No pudimos cargar las motos ({error}).</span>
            <button onClick={cargar} className="ml-auto bg-rojo text-white font-semibold rounded-lg px-4 py-2">
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-gris">Cargando motos…</p>
        ) : motos.length === 0 && !error ? (
          <div className="text-sm text-gris bg-white border border-linea rounded-xl p-6">
            {marca || provincia
              ? "No hay motos publicadas con esos filtros (por ahora 😉). Probá ampliar la búsqueda."
              : "Todavía no hay motos publicadas. ¡Sé el primero: cargá la tuya desde Mi garage!"}
          </div>
        ) : (
          <>
            <p className="text-xs text-gris mb-3">{motos.length} moto{motos.length !== 1 ? "s" : ""} publicada{motos.length !== 1 ? "s" : ""}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {motos.map((m) => (
                <Link key={m.id} href={`/moto/${m.id}`}
                  className="bg-white border border-linea rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gris transition-all">
                  {m.fotos?.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.fotos[0]} alt={`${m.marca} ${m.modelo}`} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 flex items-center justify-center text-5xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-titulos font-extrabold text-[15px]">
                        {m.marca} {m.modelo} · {m.anio}
                      </h3>
                      {m.dueno_tipo === "concesionario" && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-[#EDF0FA] text-[#3D5AA9] whitespace-nowrap">
                          Concesionario
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gris mt-0.5">
                      {m.km.toLocaleString("es-AR")} km · {m.provincia}
                      {m.categoria ? ` · ${m.categoria} ${m.cilindrada}cc` : ""}
                    </p>
                    {m.precio_usd && (
                      <p className="font-titulos font-extrabold text-lg text-rojo mt-1.5">
                        USD {Number(m.precio_usd).toLocaleString("es-AR")}
                      </p>
                    )}
                    {m.accesorios?.length > 0 && (
                      <p className="text-[11px] text-tinta2 mt-1.5 bg-hueso rounded-lg px-2 py-1">
                        🧰 {m.accesorios.slice(0, 3).join(" · ")}
                        {m.accesorios.length > 3 ? ` · +${m.accesorios.length - 3} más` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
