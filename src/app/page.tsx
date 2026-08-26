import Link from "next/link";
import { Logo, Wordmark } from "@/components/Logo";
import { RescateCodigo } from "@/components/RescateCodigo";

export default function Inicio() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-gradient-to-br from-asfalto via-[#23233B] to-[#3A1F2B] text-white">
      <RescateCodigo />
      <Logo tamano={84} />
      <div>
        <Wordmark />
      </div>
      <h1 className="font-titulos font-black text-4xl sm:text-5xl leading-tight tracking-tight max-w-xl">
        Tu moto no se vende.
        <br />
        <span className="text-[#FF7A8E]">Cambiala.</span>
      </h1>
      <p className="text-[#C9C9D9] max-w-md">
        Publicá la moto que tenés, contá cuál buscás, y te avisamos cuando hay
        match. Beta cerrada: primavera 2026.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/registro"
          className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl px-7 py-3.5"
        >
          Crear cuenta gratis
        </Link>
        <Link
          href="/login"
          className="border border-white/40 text-white font-titulos font-extrabold rounded-xl px-7 py-3.5 hover:bg-white/10"
        >
          Ingresar
        </Link>
      </div>
      <Link
        href="/explorar"
        className="text-sm font-semibold text-[#C9C9D9] underline underline-offset-4 hover:text-white"
      >
        👀 Chusmear las motos publicadas
      </Link>
      <p className="text-xs text-[#8A8A9E] uppercase tracking-widest font-bold">
        Beta en construcción · motocambio.com.ar
      </p>
    </main>
  );
}
