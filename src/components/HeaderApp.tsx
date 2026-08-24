"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";

export function HeaderApp({ nombre }: { nombre?: string }) {
  const router = useRouter();

  async function salir() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-linea">
      <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 py-2.5">
        <Link href="/garage" className="flex items-center gap-2.5">
          <Logo tamano={30} />
          <span className="hidden sm:block">
            <Wordmark />
          </span>
        </Link>
        <nav className="flex items-center gap-1 ml-2">
          <Link
            href="/garage"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-asfalto text-white"
          >
            Mi garage
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}
