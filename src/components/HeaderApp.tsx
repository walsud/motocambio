"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";

export function HeaderApp({
  nombre,
  activo = "garage",
  logueado = true,
  esConcesionario = false,
}: {
  nombre?: string;
  activo?: "garage" | "explorar" | "oportunidades" | "panel";
  logueado?: boolean;
  esConcesionario?: boolean;
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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-linea">
      <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 py-2.5">
        <Link href={logueado ? "/garage" : "/"} className="flex items-center gap-2.5">
          <Logo tamano={30} />
          <span className="hidden sm:block">
            <Wordmark />
          </span>
        </Link>
        <nav className="flex items-center gap-1 ml-2">
          <Link href="/explorar" className={tab(activo === "explorar")}>
            Explorar
          </Link>
          <Link href="/oportunidades" className={tab(activo === "oportunidades")}>
            💰<span className="hidden sm:inline"> Oportunidades</span>
          </Link>
          <Link href="/garage" className={tab(activo === "garage")}>
            Mi garage
          </Link>
          {esConcesionario && (
            <Link href="/panel" className={tab(activo === "panel")}>
              🏪<span className="hidden sm:inline"> Panel</span>
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
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
  );
}
