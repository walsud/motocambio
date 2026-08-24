"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const confirmado = params.get("confirmado") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setCargando(false);
    if (err) {
      setError(
        err.message.includes("Invalid login")
          ? "E-mail o contraseña incorrectos."
          : err.message.includes("not confirmed")
          ? "Todavía no confirmaste tu e-mail. Revisá tu casilla (y el spam)."
          : "No pudimos ingresar: " + err.message
      );
      return;
    }
    router.push("/garage");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md bg-white border border-linea rounded-2xl shadow-sm p-7">
      <h1 className="font-titulos font-black text-2xl tracking-tight">Ingresá</h1>
      <p className="text-gris text-sm mt-1 mb-6">
        Tu garage y tus matches te esperan.
      </p>
      {confirmado && (
        <p className="text-sm text-verde-ok bg-[#F0F7F2] border border-[#CDE4D4] rounded-lg px-3 py-2 mb-4">
          ✓ E-mail confirmado. Ya podés ingresar.
        </p>
      )}
      <form onSubmit={ingresar} className="flex flex-col gap-4">
        <label className="text-sm font-semibold">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@mail.com"
            className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo"
          />
        </label>
        <label className="text-sm font-semibold">
          Contraseña
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo"
          />
        </label>
        {error && (
          <p className="text-sm text-rojo bg-[#FBF0F1] border border-[#EED2D6] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          disabled={cargando}
          className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60"
        >
          {cargando ? "Ingresando…" : "Ingresar →"}
        </button>
      </form>
      <p className="text-sm text-gris mt-5 text-center">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-rojo font-semibold">
          Registrate gratis
        </Link>
      </p>
    </div>
  );
}

export default function Login() {
  return (
    <main className="min-h-screen bg-hueso flex flex-col items-center px-5 py-10">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Logo tamano={40} />
        <Wordmark />
      </Link>
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
