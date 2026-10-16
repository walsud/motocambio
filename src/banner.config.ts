// ============================================================
//  CONFIGURACIÓN DEL ESPACIO PUBLICITARIO (pie de la home)
// ============================================================
//  Para publicar un banner:
//   1. Subí las dos imágenes a public/banners/ con estos nombres:
//        banner-desktop.jpg  (1600 × 400 px, se muestra en pantallas grandes)
//        banner-mobile.jpg   (1080 × 540 px, se muestra en celulares)
//   2. Cambiá "activo" a true y completá el link y el nombre.
//   3. Subí los cambios a GitHub como siempre.
//  Para volver al cartel de "Tu marca, acá": activo = false.
// ============================================================

export const BANNER = {
  activo: false,
  // Link al que va la gente cuando toca el banner (con https://)
  href: "https://ejemplo.com",
  // Nombre del anunciante (para accesibilidad y para el registro)
  anunciante: "Nombre del anunciante",
};
