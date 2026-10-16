import { BANNER } from "@/banner.config";

// Espacio publicitario del pie de la home.
//  · Con BANNER.activo = true muestra la imagen del anunciante
//    (desktop y mobile por separado) con su link.
//  · Sin anunciante, muestra el cartel "Tu marca, acá" de siempre.
export function BannerPublicitario() {
  if (!BANNER.activo) {
    return (
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
        <a
          href="mailto:contacto@motocambio.com.ar?subject=Quiero anunciar en Motocambio"
          className="border-2 border-linea hover:border-rojo font-titulos font-extrabold rounded-xl px-6 py-3 text-tinta2"
        >
          Anunciar en Motocambio
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="absolute -top-2.5 left-5 z-10 bg-hueso text-[10px] font-bold text-gris uppercase tracking-wider px-2">
        Publicidad
      </span>
      <a
        href={BANNER.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-2xl overflow-hidden border border-linea shadow-sm hover:shadow-md transition-shadow"
      >
        <picture>
          {/* Pantallas grandes: apaisado 4:1 */}
          <source media="(min-width: 640px)" srcSet="/banners/banner-desktop.jpg" />
          {/* Celulares: 2:1 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banners/banner-mobile.jpg"
            alt={`Publicidad: ${BANNER.anunciante}`}
            className="w-full h-auto block"
            loading="lazy"
          />
        </picture>
      </a>
    </div>
  );
}
