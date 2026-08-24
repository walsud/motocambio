import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mantiene la sesión fresca y protege las rutas privadas
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          respuesta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  // Rutas privadas: requieren sesión
  if (!user && ruta.startsWith("/garage")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión activa, login/registro redirigen al garage
  if (user && (ruta === "/login" || ruta === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/garage";
    return NextResponse.redirect(url);
  }

  return respuesta;
}
