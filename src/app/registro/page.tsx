"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";
import { CampoPassword } from "@/components/CampoPassword";

const PROVINCIAS = [
  "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
  "Entre Ríos", "Salta", "Neuquén", "Río Negro", "Corrientes", "Misiones",
  "Chaco", "San Juan", "San Luis", "Jujuy", "La Pampa", "Otra",
];

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [provincia, setProvincia] = useState("CABA");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [error, setError] = useState("");
  const [yaExiste, setYaExiste] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setYaExiste(false);
    if (!aceptaTyc) {
      setError("Tenés que aceptar los Términos y Condiciones para registrarte.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, provincia },
        emailRedirectTo: `${location.origin}/login?confirmado=1`,
      },
    });
    setCargando(false);
    if (err) {
      if (err.message.includes("already registered")) {
        setYaExiste(true);
      } else {
        setError("No pudimos crear la cuenta: " + err.message);
      }
      return;
    }
    // Cuando el mail ya tiene cuenta confirmada, Supabase no devuelve error
    // (para no regalar información), pero sí un usuario sin identidades.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setYaExiste(true);
      return;
    }
    router.push("/verificar?email=" + encodeURIComponent(email));
  }

  return (
    <main className="min-h-screen bg-hueso flex flex-col items-center px-5 py-10">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Logo tamano={40} />
        <Wordmark />
      </Link>
      <div className="w-full max-w-md bg-white border border-linea rounded-2xl shadow-sm p-7">
        <h1 className="font-titulos font-black text-2xl tracking-tight">
          Creá tu cuenta
        </h1>
        <p className="text-gris text-sm mt-1 mb-6">
          Gratis. Tu moto entra al motor de matching apenas la cargues.
        </p>
        <form onSubmit={registrar} className="flex flex-col gap-4">
          <label className="text-sm font-semibold">
            Tu nombre
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Walter"
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal outline-none focus:border-rojo"
            />
          </label>
          <label className="text-sm font-semibold">
            Provincia
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="mt-1 w-full border-2 border-linea rounded-xl px-3.5 py-2.5 font-normal bg-white outline-none focus:border-rojo"
            >
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
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
            <CampoPassword value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </label>
          <label className="flex items-start gap-3 bg-hueso border-2 border-linea rounded-xl p-3.5 cursor-pointer has-[:checked]:border-verde-ok has-[:checked]:bg-[#F0F7F2]">
            <input
              type="checkbox"
              checked={aceptaTyc}
              onChange={(e) => setAceptaTyc(e.target.checked)}
              className="mt-0.5 w-5 h-5 shrink-0 accent-[#C8102E] cursor-pointer"
            />
            <span className="text-[13px] text-tinta2 leading-relaxed">
              Leí y acepto los{" "}
              <Link href="/terminos" target="_blank" className="text-rojo font-semibold underline">
                Términos y Condiciones
              </Link>
              , incluyendo que la verificación de papeles y las transferencias
              corren por cuenta de las partes.
            </span>
          </label>
          {yaExiste && (
            <div className="text-sm bg-[#FDF1E3] border border-[#EFD9BB] rounded-lg px-4 py-3 text-tinta2">
              ⚠️ <b>Ya existe una cuenta con ese e-mail.</b>
              <div className="flex gap-2 mt-2.5">
                <Link
                  href="/login"
                  className="flex-1 text-center bg-rojo text-white font-semibold rounded-lg px-3 py-2"
                >
                  Ingresar
                </Link>
                <Link
                  href="/recuperar"
                  className="flex-1 text-center border-2 border-linea bg-white font-semibold rounded-lg px-3 py-2 hover:border-rojo"
                >
                  Recuperar contraseña
                </Link>
              </div>
            </div>
          )}
          {error && (
            <p className="text-sm text-rojo bg-[#FBF0F1] border border-[#EED2D6] rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            disabled={cargando}
            className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60"
          >
            {cargando ? "Creando cuenta…" : "Crear cuenta →"}
          </button>
        </form>
        <p className="text-sm text-gris mt-5 text-center">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-rojo font-semibold">
            Ingresá
          </Link>
        </p>
      </div>
    </main>
  );
}
