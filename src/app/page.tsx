"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Logo, Wordmark } from "@/components/Logo";
import { HeaderApp } from "@/components/HeaderApp";
import { RescateCodigo } from "@/components/RescateCodigo";

interface MotoPublica {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precio_usd: number | null;
  fotos: string[];
  provincia: string | null;
  dueno_tipo: string;
}

interface Oportunidad {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio_contado: number;
  ref_min: number | null;
  vence_el: string;
}

const PASOS = [
  {
    n: "1",
    t: "Cargá tu moto",
    d: "Marca, modelo, año, kilómetros, fotos y el valor que pretendés. El dominio queda privado: nunca se muestra.",
  },
  {
    n: "2",
    t: "Contá qué buscás",
    d: "Uno o varios modelos del catálogo. Y la diferencia que estás dispuesto a pagar o querés recibir.",
  },
  {
    n: "3",
    t: "Recibí el match",
    d: "Cuando tu oferta y tu búsqueda cruzan con las de otro usuario, te avisamos al instante por mail y en tu garage.",
  },
  {
    n: "4",
    t: "Verificación y transferencia",
    d: "Coordinás todo por el chat interno. La verificación de papeles y las dos transferencias corren por cuenta de ambas partes: te sugerimos los pasos seguros (informe de dominio, las dos el mismo día en el mismo registro), pero la operación es entre ustedes.",
  },
];

const FAQS: [string, string][] = [
  [
    "¿Qué es un match?",
    "Cuando la moto que ofrecés coincide con la que otro usuario busca, y la que él ofrece coincide con la que vos buscás, se produce el match: les avisamos a los dos y se abre un chat para coordinar el cambio. Nadie ve tus datos de contacto hasta que vos quieras.",
  ],
  [
    "¿Cuánto cuesta usar Motocambio?",
    "Publicar tu moto, definir tu búsqueda y matchear es gratis, siempre. Más adelante vamos a cobrar por servicios opcionales (verificación mecánica, informe de dominio, gestoría de transferencia) y por las cuentas de concesionarios.",
  ],
  [
    "¿Y si las motos no valen lo mismo?",
    "Casi ningún cambio es mano a mano: la diferencia se arregla en plata. Cuando cargás tu búsqueda indicás cuánta diferencia estás dispuesto a pagar o querés recibir, y eso queda a la vista en cada match para negociar por el chat.",
  ],
  [
    "¿Cómo sé que la otra moto no tiene deudas o prendas?",
    "Pedí el informe de dominio (DNRPA) antes de encontrarte con nadie: se saca online con la patente y muestra titularidad, prendas, embargos y deudas. Por el momento, la verificación de los papeles y del estado de la moto corre por cuenta y responsabilidad de ambas partes: Motocambio te sugiere los pasos seguros, pero no es parte de la operación. Más adelante vamos a ofrecer la verificación integrada como servicio opcional.",
  ],
  [
    "¿Qué es un match en cadena?",
    "A veces el cambio no cierra entre dos, pero sí entre tres: vos querés la moto de B, B quiere la de C, y C quiere la tuya. La detección automática de estos círculos es nuestra arma secreta para multiplicar los cambios posibles — está en camino para la próxima etapa de la beta.",
  ],
  [
    "¿Cómo se hace la transferencia de las dos motos?",
    "Cada permuta son dos transferencias ante el Registro (formulario 08, verificación policial). Por el momento las gestionan las partes por su cuenta y bajo su exclusiva responsabilidad. Nuestra sugerencia: hacé las dos transferencias el mismo día y en el mismo registro seccional. Motocambio no interviene en la operación ni se hace responsable por ella. La gestoría integrada va a llegar más adelante como servicio opcional.",
  ],
  [
    "¿Puedo cambiar mi moto con un concesionario?",
    "Sí. Los concesionarios adheridos pueden tomar tu usada y entregarte una moto de su stock, con recibo y garantía. Aparecen identificados con la insignia de Concesionario, que solo se otorga con CUIT verificado.",
  ],
  [
    "¿Qué motos se pueden publicar?",
    "Se publican motos de 300 cc en adelante, de cualquier marca y en todo el país. Pero a cambio podés pedir o aceptar lo que quieras: un scooter 0 km, una moto de menor cilindrada más diferencia a tu favor, o directamente efectivo. La moto tiene que estar a tu nombre o tener el 08 firmado por el titular.",
  ],
  [
    "Tengo una moto de menos de 300 cc y quiero una más grande, ¿puedo?",
    "Sí, con la moto de entrega: cargás tu moto (de cualquier cilindrada) junto con la búsqueda de la que querés. Tu moto no aparece en los listados — la vidriera es solo +300 cc — pero el motor de matching sí la ve: si el dueño de la moto que buscás acepta la tuya como parte de pago, se produce el match igual.",
  ],
];

export default function Inicio() {
  const supabase = crearClienteNavegador();
  const [logueado, setLogueado] = useState(false);
  const [motos, setMotos] = useState<MotoPublica[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setLogueado(!!user));
    supabase
      .from("motos_publicas")
      .select("id, marca, modelo, anio, km, precio_usd, fotos, provincia, dueno_tipo")
      .order("creado_el", { ascending: false })
      .limit(6)
      .then(({ data }) => setMotos((data as MotoPublica[]) || []));
    supabase
      .from("oportunidades_publicas")
      .select("id, marca, modelo, anio, precio_contado, ref_min, vence_el")
      .order("creada_el", { ascending: false })
      .limit(3)
      .then(({ data }) => setOportunidades((data as Oportunidad[]) || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-hueso">
      <RescateCodigo />
      <HeaderApp logueado={logueado} activo="inicio" />

      {/* ---------- HÉROE ---------- */}
      <section className="bg-gradient-to-br from-asfalto via-[#23233B] to-[#3A1F2B] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center flex flex-col items-center gap-5">
          <p className="text-xs uppercase tracking-widest font-bold text-[#8A8A9E]">
            Permutas de motos +300 cc · Argentina
          </p>
          <h1 className="font-titulos font-black text-4xl sm:text-5xl leading-tight tracking-tight max-w-xl">
            Tu moto no se vende.
            <br />
            <span className="text-[#FF7A8E]">Cambiala.</span>
          </h1>
          <p className="text-[#C9C9D9] max-w-md">
            Publicá la moto que tenés, contá cuál buscás, y Motocambio cruza las
            dos puntas: cuando alguien quiere tu moto y ofrece la que vos querés,
            se produce el <b className="text-white">match</b>. Sin malvender, sin
            quedarte a pie.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {logueado ? (
              <Link href="/garage" className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl px-7 py-3.5">
                Ir a mi garage →
              </Link>
            ) : (
              <>
                <Link href="/registro" className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl px-7 py-3.5">
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className="border border-white/40 text-white font-titulos font-extrabold rounded-xl px-7 py-3.5 hover:bg-white/10">
                  Ingresar
                </Link>
              </>
            )}
          </div>
          <Link href="/explorar" className="text-sm font-semibold text-[#C9C9D9] underline underline-offset-4 hover:text-white">
            👀 Chusmear las motos publicadas
          </Link>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4">
        {/* ---------- CÓMO FUNCIONA ---------- */}
        <section className="py-12">
          <h2 className="font-titulos font-black text-3xl tracking-tight text-center">
            ¿Cómo funciona?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            {PASOS.map((p) => (
              <div key={p.n} className="bg-white border border-linea rounded-2xl p-5 shadow-sm">
                <span className="w-9 h-9 rounded-full bg-rojo text-white font-titulos font-black flex items-center justify-center">
                  {p.n}
                </span>
                <h3 className="font-titulos font-extrabold mt-3">{p.t}</h3>
                <p className="text-[13px] text-tinta2 mt-1.5 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- POR QUÉ MOTOCAMBIO ---------- */}
        <section className="pb-12">
          <h2 className="font-titulos font-black text-3xl tracking-tight text-center">
            ¿Por qué Motocambio?
          </h2>
          <p className="text-gris text-sm text-center mt-1 mb-7">
            Lo que ninguna página de avisos hace por vos.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-asfalto text-white rounded-2xl p-6">
              <p className="text-3xl">🎯</p>
              <h3 className="font-titulos font-extrabold text-lg mt-3">Matching automático</h3>
              <p className="text-sm text-[#C9C9D9] mt-2 leading-relaxed">
                No esperás a que aparezca un comprador: el sistema cruza lo que{" "}
                <b className="text-[#FF7A8E]">ofrecés</b> con lo que{" "}
                <b className="text-[#FF7A8E]">buscás</b>, al instante, con cada
                moto y cada búsqueda nueva que entra.
              </p>
            </div>
            <div className="bg-asfalto text-white rounded-2xl p-6 relative">
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wide bg-white/15 rounded-full px-2.5 py-1">
                Próximamente
              </span>
              <p className="text-3xl">🔁</p>
              <h3 className="font-titulos font-extrabold text-lg mt-3">Cambios en cadena</h3>
              <p className="text-sm text-[#C9C9D9] mt-2 leading-relaxed">
                Si el cambio no cierra entre dos, lo armamos{" "}
                <b className="text-[#FF7A8E]">entre tres</b>: vos querés la de B,
                B quiere la de C, C quiere la tuya. Todos reciben la moto que
                buscan. En camino para esta beta.
              </p>
            </div>
            <div className="bg-asfalto text-white rounded-2xl p-6">
              <p className="text-3xl">🛡️</p>
              <h3 className="font-titulos font-extrabold text-lg mt-3">Confianza cuidada</h3>
              <p className="text-sm text-[#C9C9D9] mt-2 leading-relaxed">
                Mail confirmado para operar, tus datos de contacto{" "}
                <b className="text-[#FF7A8E]">nunca expuestos</b> hasta que haya
                match, la patente siempre privada, y concesionarios con{" "}
                <b className="text-[#FF7A8E]">CUIT verificado</b> uno por uno.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- MOTOS RECIENTES ---------- */}
        {motos.length > 0 && (
          <section className="pb-12">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-titulos font-black text-2xl tracking-tight">
                🔥 Publicadas ahora mismo
              </h2>
              <Link href="/explorar" className="text-sm font-bold text-rojo hover:underline">
                Ver todas en Explorar →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {motos.map((m) => (
                <Link key={m.id} href={`/moto/${m.id}`}
                  className="bg-white border border-linea rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gris transition-all">
                  {m.fotos?.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.fotos[0]} alt={`${m.marca} ${m.modelo}`} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-asfalto to-[#3A1F2B]">🏍️</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-titulos font-extrabold text-[14px]">
                      {m.marca} {m.modelo} · {m.anio}
                    </h3>
                    <p className="text-xs text-gris mt-0.5">
                      {m.km.toLocaleString("es-AR")} km · {m.provincia}
                      {m.dueno_tipo === "concesionario" ? " · 🏪" : ""}
                    </p>
                    {m.precio_usd && (
                      <p className="font-titulos font-extrabold text-rojo mt-1">
                        USD {Number(m.precio_usd).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---------- OPORTUNIDADES ---------- */}
        <section className="pb-12">
          <div className="bg-asfalto text-white rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-lg">
                <h2 className="font-titulos font-black text-2xl tracking-tight">💰 Sector Oportunidades</h2>
                <p className="text-sm text-[#C9C9D9] mt-1.5 leading-relaxed">
                  Motos de contado, publicadas <b className="text-white">por debajo del
                  precio de referencia</b> de su modelo y año. Para el que quiere
                  vender ya — y para el que caza ofertas. Vencen a los 14 días:
                  si no está barata de verdad, no es oportunidad.
                </p>
              </div>
              <Link href="/oportunidades"
                className="bg-rojo hover:bg-rojo-oscuro font-titulos font-extrabold rounded-xl px-6 py-3">
                Ver oportunidades →
              </Link>
            </div>
            {oportunidades.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3 mt-5">
                {oportunidades.map((o) => (
                  <Link key={o.id} href="/oportunidades"
                    className="bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors">
                    <p className="font-titulos font-extrabold text-[14px]">
                      {o.marca} {o.modelo} · {o.anio}
                    </p>
                    <p className="font-titulos font-black text-xl text-[#FF7A8E] mt-1">
                      USD {Number(o.precio_contado).toLocaleString("es-AR")}
                    </p>
                    {o.ref_min && Number(o.ref_min) > Number(o.precio_contado) && (
                      <p className="text-[11px] text-[#7EE2A8] font-bold">
                        {Math.round((1 - Number(o.precio_contado) / Number(o.ref_min)) * 100)}% bajo la referencia
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------- BANNER CONCESIONARIOS (espacio publicitario propio) ---------- */}
        <section className="pb-12">
          <div className="relative bg-white border-2 border-dashed border-linea rounded-2xl p-6 sm:p-7 flex items-center justify-between gap-4 flex-wrap">
            <span className="absolute -top-2.5 left-5 bg-hueso text-[10px] font-bold text-gris uppercase tracking-wider px-2">
              Patrocinado
            </span>
            <div>
              <p className="font-titulos font-extrabold text-lg">🏪 ¿Tenés concesionaria o agencia?</p>
              <p className="text-sm text-tinta2 mt-0.5">
                Cupos de <b>concesionario fundador</b> abiertos: plan bonificado
                durante la beta, insignia verificada y panel de demanda del mercado.
              </p>
            </div>
            <Link href="/panel" className="bg-asfalto hover:opacity-90 text-white font-titulos font-extrabold rounded-xl px-6 py-3">
              Quiero ser fundador →
            </Link>
          </div>
        </section>

        {/* ---------- PREGUNTAS FRECUENTES ---------- */}
        <section className="pb-12">
          <h2 className="font-titulos font-black text-3xl tracking-tight text-center">
            Preguntas frecuentes
          </h2>
          <p className="text-gris text-sm text-center mt-1 mb-7">
            Lo que todos preguntan antes de animarse al cambio.
          </p>
          <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group bg-white border border-linea rounded-xl shadow-sm overflow-hidden">
                <summary className="flex items-center gap-3 px-5 py-4 text-sm font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="ml-auto w-6 h-6 shrink-0 rounded-full bg-hueso text-rojo font-black flex items-center justify-center transition-transform group-open:rotate-45 group-open:bg-rojo group-open:text-white">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-[13.5px] text-tinta2 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- BANNER TU MARCA ---------- */}
        <section className="pb-12">
          <div className="relative bg-white border-2 border-dashed border-linea rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <span className="absolute -top-2.5 left-5 bg-hueso text-[10px] font-bold text-gris uppercase tracking-wider px-2">
              Espacio publicitario
            </span>
            <div>
              <p className="font-titulos font-extrabold">📣 Tu marca, acá</p>
              <p className="text-sm text-tinta2 mt-0.5">
                Audiencia 100% motoquera. Cascos, indumentaria, seguros, lubricantes.
              </p>
            </div>
            <a href="mailto:contacto@motocambio.com.ar?subject=Quiero anunciar en Motocambio"
              className="border-2 border-linea hover:border-rojo font-titulos font-extrabold rounded-xl px-6 py-3 text-tinta2">
              Anunciar en Motocambio
            </a>
          </div>
        </section>
      </main>

      {/* ---------- PIE ---------- */}
      <footer className="bg-asfalto text-white mt-4">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <Logo tamano={32} />
                <Wordmark />
              </div>
              <p className="text-xs text-[#8A8A9E] mt-3 leading-relaxed">
                La primera plataforma argentina de permutas de motos +300cc.
                Beta cerrada · primavera 2026.
              </p>
            </div>
            <nav className="flex gap-10 flex-wrap text-sm">
              <div className="flex flex-col gap-2">
                <p className="font-bold text-[#8A8A9E] text-xs uppercase tracking-wide">Plataforma</p>
                <Link href="/explorar" className="text-[#C9C9D9] hover:text-white">Explorar motos</Link>
                <Link href="/oportunidades" className="text-[#C9C9D9] hover:text-white">Oportunidades</Link>
                <Link href="/panel" className="text-[#C9C9D9] hover:text-white">Concesionarios</Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-bold text-[#8A8A9E] text-xs uppercase tracking-wide">Ayuda</p>
                <Link href="/terminos" className="text-[#C9C9D9] hover:text-white">Términos y Condiciones</Link>
                <a href="mailto:contacto@motocambio.com.ar" className="text-[#C9C9D9] hover:text-white">
                  contacto@motocambio.com.ar
                </a>
              </div>
            </nav>
          </div>
          <p className="text-[11px] text-[#8A8A9E] leading-relaxed border-t border-white/10 mt-8 pt-5">
            ⚖️ Motocambio conecta las dos puntas del cambio. La verificación de
            papeles, el estado de las motos y las transferencias corren por cuenta
            y responsabilidad exclusiva de las partes. Sugerimos los pasos seguros
            en cada match, pero no somos parte de la operación.
          </p>
          <p className="text-[11px] text-[#8A8A9E] mt-2">
            © 2026 Motocambio · motocambio.com.ar · Hecho en Argentina 🇦🇷
          </p>
        </div>
      </footer>
    </div>
  );
}
