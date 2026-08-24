"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo, Wordmark } from "@/components/Logo";

function Contenido() {
  const params = useSearchParams();
  const email = params.get("email") || "tu casilla";
  return (
    <div className="w-full max-w-md bg-white border border-linea rounded-2xl shadow-sm p-8 text-center">
      <div className="text-5xl mb-4">📬</div>
      <h1 className="font-titulos font-black text-2xl tracking-tight">
        Revisá tu correo
      </h1>
      <p className="text-tinta2 mt-3">
        Te mandamos un mail a <b>{email}</b> con el link para confirmar tu
        cuenta. Tocalo y ya podés ingresar.
      </p>
      <p className="text-sm text-gris mt-4">
        ¿No llegó? Mirá en spam o promociones. El remitente es Supabase Auth
        (nuestro sistema de cuentas).
      </p>
      <Link
        href="/login"
        className="inline-block mt-6 bg-asfalto text-white font-titulos font-extrabold rounded-xl px-6 py-3"
      >
        Ir a ingresar
      </Link>
    </div>
  );
}

export default function Verificar() {
  return (
    <main className="min-h-screen bg-hueso flex flex-col items-center px-5 py-10">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Logo tamano={40} />
        <Wordmark />
      </Link>
      <Suspense>
        <Contenido />
      </Suspense>
    </main>
  );
}
