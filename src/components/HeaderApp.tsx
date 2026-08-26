"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";

type Seccion = "inicio" | "garage" | "explorar" | "oportunidades" | "panel";

export function HeaderApp({
  nombre,
  activo,
  logueado = true,
  esConcesionario = false,
  esAdmin = false,
  sinNavInferior = false,
}: {
  nombre?: string;
  activo?: Seccion;
  logueado?: boolean;
  esConcesionario?: boolean;
  esAdmin?: boolean;
  sinNavInferior?: boolean;
}) {
  const router = useRouter();

  async function salir() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const tab = (esActivo: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold ${
      esActivo ? "bg-asfalto text-white" : "text-tinta2 hover:bg-hueso"
    }`;

  // Ítems de la barra inferior (celular)
  const items: { ruta: string; icono: string; texto: string; clave: Seccion }[] = [
    { ruta: "/", icono: "🏠", texto: "Inicio", clave: "inicio" },
    { ruta: "/explorar", icono: "🔍", texto: "Explorar", clave: "explorar" },
    { ruta: "/oportunidades", icono: "💰", texto: "Ofertas", clave: "oportunidades" },
    { ruta: "/garage", icono: "🏍️", texto: "Garage", clave: "garage" },
  ];
  if (esConcesionario) {
    items.push({ ruta: "/panel", icono: "🏪", texto: "Panel", clave: "panel" });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-linea">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 py-2.5">
          <Link href={logueado ? "/garage" : "/"} className="flex items-center gap-2.5">
            <Logo tamano={30} />
            <Wordmark />
          </Link>
          {/* Pestañas: solo en pantallas grandes (en el celular está la barra de abajo) */}
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            <Link href="/explorar" className={tab(activo === "explorar")}>
              Explorar
            </Link>
            <Link href="/oportunidades" className={tab(activo === "oportunidades")}>
              💰 Oportunidades
            </Link>
            <Link href="/garage" className={tab(activo === "garage")}>
              Mi garage
            </Link>
            {esConcesionario && (
              <Link href="/panel" className={tab(activo === "panel")}>
                🏪 Panel
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {esAdmin && (
              <Link href="/admin" title="Administración"
                className="text-lg opacity-60 hover:opacity-100" aria-label="Administración">
                ⚙️
              </Link>
            )}
            {logueado ? (
              <>
                {nombre && (
                  <span className="hidden sm:flex items-center gap-2 text-sm font-semibold text-tinta2">
                    <span className="w-7 h-7 rounded-full bg-rojo text-white flex items-center justify-center text-xs font-bold">
                      {nombre.charAt(0).toUpperCase()}
                    </span>
                    {nombre}
                  </span>
                )}
                <button
                  onClick={salir}
                  className="text-sm font-semibold text-gris hover:text-rojo"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gris hover:text-rojo">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="bg-rojo hover:bg-rojo-oscuro text-white text-sm font-bold rounded-lg px-3.5 py-2"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Barra inferior tipo app: solo celular */}
      {!sinNavInferior && (
        <nav
          className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-linea"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex">
            {items.map((it) => {
              const esActivo = activo === it.clave;
              return (
                <Link
                  key={it.ruta}
                  href={it.ruta}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
                    esActivo ? "text-rojo" : "text-gris"
                  }`}
                >
                  <span className={`text-xl leading-none ${esActivo ? "" : "grayscale opacity-70"}`}>
                    {it.icono}
                  </span>
                  {it.texto}
                  {esActivo && <span className="w-5 h-0.5 rounded-full bg-rojo" />}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
