"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";
import { CampoPassword } from "@/components/CampoPassword";

// Una página, dos caras:
//  · "pedir": escribís tu mail y te mandamos el enlace de recuperación.
//  · "cambiar": llegaste desde ese enlace (o ya estás logueado) y
//    elegís tu contraseña nueva.
export default function Recuperar() {
  const router = useRouter();
  const supabase = crearClienteNavegador();
  const [modo, setModo] = useState<"pedir" | "cambiar">("pedir");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // ¿Venimos del enlace del mail, o ya hay sesión? → cara "cambiar"
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setModo("cambiar");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "PASSWORD_RECOVERY" || sesion) setModo("cambiar");
    });
    // Enlace vencido o ya usado: Supabase vuelve con un error en la URL
    const crudo = window.location.search + window.location.hash;
    if (crudo.includes("error")) {
      setError("Ese enlace venció o ya fue usado. Pedí uno nuevo acá abajo.");
    }
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pedirEnlace(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/recuperar`,
    });
    setCargando(false);
    if (err) {
      setError("No pudimos mandar el mail: " + err.message);
      return;
    }
    setEnviado(true);
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setCargando(false);
    if (err) {
      setError(
        err.message.includes("different from the old")
          ? "La contraseña nueva tiene que ser distinta de la anterior."
          : "No pudimos cambiarla: " + err.message
      );
      return;
    }
    router.push("/garage");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-hueso flex flex-col items-center px-5 py-10">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Logo tamano={40} />
        <Wordmark />
      </Link>
      <div className="w-full max-w-md bg-white border border-linea rounded-2xl shadow-sm p-7">
        {modo === "pedir" ? (
          <>
            <h1 className="font-titulos font-black text-2xl tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-gris text-sm mt-1 mb-6">
              Te mandamos un enlace a tu mail para que elijas una nueva.
            </p>
            {enviado ? (
              <div className="text-sm text-verde-ok bg-[#F0F7F2] border border-[#CDE4D4] rounded-lg px-4 py-3">
                ✓ Listo. Si existe una cuenta con <b>{email}</b>, en un rato te
                llega el mail con el enlace. Revisá también el spam.
              </div>
            ) : (
              <form onSubmit={pedirEnlace} className="flex flex-col gap-4">
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
                {error && (
                  <p className="text-sm text-rojo bg-[#FBF0F1] border border-[#EED2D6] rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  disabled={cargando}
                  className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl py-3 disabled:opacity-60"
                >
                  {cargando ? "Mandando…" : "Mandarme el enlace →"}
                </button>
              </form>
            )}
            <p className="text-sm text-gris mt-5 text-center">
              ¿La recordaste?{" "}
              <Link href="/login" className="text-rojo font-semibold">
                Ingresá
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-titulos font-black text-2xl tracking-tight">
              Elegí tu contraseña nueva
            </h1>
            <p className="text-gris text-sm mt-1 mb-6">
              Mínimo 8 caracteres. Después entrás directo a tu garage.
            </p>
            <form onSubmit={cambiarPassword} className="flex flex-col gap-4">
              <label className="text-sm font-semibold">
                Contraseña nueva
                <CampoPassword value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </label>
              <label className="text-sm font-semibold">
                Repetila
                <CampoPassword value={password2} onChange={(e) => setPassword2(e.target.value)} />
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
                {cargando ? "Guardando…" : "Guardar y entrar →"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
