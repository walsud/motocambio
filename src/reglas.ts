// ============================================================
//  REGLAS DE NEGOCIO DE MOTOCAMBIO
// ============================================================
//  Piso de cilindrada para PUBLICAR en la vidriera.
//  Desde el 1/11/2026: 240cc reales = "desde 250cc" nominales
//  (la Tornado, FZ25, XTZ, Dominar, etc. tienen 244-249cc reales).
//  Las de motor más chico pueden cargarse igual como moto de
//  entrega: no salen en listados pero el matching las ve.
//  OJO: la base valida lo mismo del lado del servidor — si se
//  cambia este número hay que cambiar también la validación SQL.
export const CC_MINIMO_PUBLICACION = 240;
