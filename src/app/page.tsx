import { Logo, Wordmark } from "@/components/Logo";

export default function Inicio() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-gradient-to-br from-asfalto via-[#23233B] to-[#3A1F2B] text-white">
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
        Estamos construyendo la plataforma. Beta cerrada: primavera 2026 — los
        primeros de la lista de espera entran antes.
      </p>
      <p className="text-xs text-[#8A8A9E] uppercase tracking-widest font-bold">
        Semana 1 de desarrollo · motocambio.com.ar
      </p>
    </main>
  );
}
