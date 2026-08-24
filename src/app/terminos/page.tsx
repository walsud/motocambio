import Link from "next/link";
import { Logo, Wordmark } from "@/components/Logo";

export const metadata = {
  title: "Términos y Condiciones — Motocambio",
};

export default function Terminos() {
  return (
    <main className="min-h-screen bg-hueso px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <Logo tamano={36} />
          <Wordmark />
        </Link>
        <div className="bg-white border border-linea rounded-2xl shadow-sm p-8 space-y-5 text-[15px] leading-relaxed text-tinta2">
          <h1 className="font-titulos font-black text-2xl text-asfalto tracking-tight">
            Términos y Condiciones — versión 1 (beta)
          </h1>
          <p className="text-sm text-gris italic">
            Borrador operativo para la beta cerrada, sujeto a revisión legal
            antes del lanzamiento abierto.
          </p>
          <section>
            <h2 className="font-titulos font-extrabold text-asfalto mb-1">1. Qué es Motocambio</h2>
            <p>
              Motocambio es una plataforma que conecta a personas y
              concesionarios interesados en permutar o comprar motos. Nuestro
              servicio es el <b>matching</b>: cruzar lo que cada usuario ofrece
              con lo que cada usuario busca, y facilitar el contacto a través
              del chat interno.
            </p>
          </section>
          <section>
            <h2 className="font-titulos font-extrabold text-asfalto mb-1">2. Motocambio no es parte de la operación</h2>
            <p>
              La compraventa o permuta se celebra exclusivamente entre los
              usuarios. <b>La verificación de la documentación, el estado de los
              vehículos, la existencia de prendas o deudas, y las transferencias
              ante el Registro corren por cuenta y responsabilidad exclusiva de
              las partes.</b> Motocambio sugiere pasos seguros (informe de
              dominio, transferencias el mismo día en el mismo registro), pero
              no interviene en la operación ni garantiza su resultado.
            </p>
          </section>
          <section>
            <h2 className="font-titulos font-extrabold text-asfalto mb-1">3. Reglas de publicación</h2>
            <p>
              Se publican motos de 300 cc en adelante, a nombre del usuario o
              con el formulario 08 firmado por el titular. Las motos de menor
              cilindrada pueden registrarse como &quot;moto de entrega&quot;: no
              aparecen en los listados, pero participan del matching. Las
              publicaciones del sector Oportunidades exigen precio de contado
              por debajo de la referencia y vencen a los 14 días. Está
              prohibido publicar vehículos con impedimentos legales, datos
              falsos o de terceros sin autorización.
            </p>
          </section>
          <section>
            <h2 className="font-titulos font-extrabold text-asfalto mb-1">4. Datos personales</h2>
            <p>
              Recolectamos el mínimo necesario para operar la plataforma
              (Ley 25.326). Tu contacto personal nunca se muestra a otros
              usuarios: la comunicación inicial ocurre por el chat interno. El
              dominio (patente) de tu moto es privado y no se publica. Podés
              pedir la baja de tu cuenta y tus datos escribiendo a
              contacto@motocambio.com.ar.
            </p>
          </section>
          <section>
            <h2 className="font-titulos font-extrabold text-asfalto mb-1">5. Conducta y moderación</h2>
            <p>
              Podemos suspender cuentas o publicaciones que incumplan estas
              reglas, ante denuncias de otros usuarios o indicios de fraude.
              Durante la beta, el servicio se presta &quot;tal cual está&quot;,
              de forma gratuita y sin garantía de disponibilidad.
            </p>
          </section>
          <p className="text-sm text-gris border-t border-linea pt-4">
            Última actualización: beta cerrada 2026 · Contacto:
            contacto@motocambio.com.ar
          </p>
        </div>
      </div>
    </main>
  );
}
