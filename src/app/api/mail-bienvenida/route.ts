import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// El mail de bienvenida: a quien se registró hace más de 48 hs y
// todavía no cargó ni moto ni búsqueda, le llega UN único empujoncito.
// Lo dispara Vercel una vez por día (ver vercel.json). La lista de
// candidatos la arma la base (bienvenidas_a_enviar) y acá solo se
// manda el mail y se anota a quién se le mandó.
//
// Claves (viven SOLO en Vercel): SUPABASE_SERVICE_ROLE_KEY y
// RESEND_API_KEY. CRON_SECRET es opcional: si está, solo el cron
// de Vercel puede disparar esta ruta.

export const dynamic = "force-dynamic";

interface Candidato {
  usuario: string;
  email: string;
  nombre: string;
}

function armarMailBienvenida(nombre: string) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#14141f">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e2dc">
      <div style="background:#C8102E;padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">MOTO<span style="opacity:.85">CAMBIO</span></span>
      </div>
      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;font-size:24px">¿Cargamos tu moto? 🏍️</h1>
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">Hola ${nombre},</p>
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">
          Hace unos días te registraste en Motocambio y queríamos contarte
          cómo sacarle el jugo: <b>cargá tu moto y contanos cuál buscás</b>.
          Con eso el matching trabaja solo — cruza tu moto con las búsquedas
          de los demás y te avisa cuando aparece un cambio posible, incluso
          en cadenas de a tres.
        </p>
        <p style="margin:0 0 22px;color:#44445a;font-size:15px;line-height:1.55">
          Son 2 minutos: modelo, año, kilómetros y un par de fotos con el
          celular. ¿Todavía no tenés moto para ofrecer? Armá igual tu
          búsqueda y mirá las <b>Oportunidades</b>, motos con precio de
          contado revisado.
        </p>
        <a href="https://motocambio.com.ar/garage"
           style="display:inline-block;background:#C8102E;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:12px">
          Cargar mi moto →
        </a>
        <p style="margin:26px 0 0;color:#6b6b7b;font-size:12px;line-height:1.5">
          Este es un único recordatorio: no te volvemos a escribir por esto.
        </p>
      </div>
    </div>
    <p style="text-align:center;color:#6b6b7b;font-size:11px;margin:14px 0 0">
      Recibís este mail porque creaste una cuenta en motocambio.com.ar.
    </p>
  </div>
</body></html>`;
}

export async function GET(req: Request) {
  // Si hay CRON_SECRET configurado, solo Vercel puede disparar esto
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const claveResend = process.env.RESEND_API_KEY;

  if (!url || !claveServicio || !claveResend) {
    return NextResponse.json({ ok: false, motivo: "falta configuración" });
  }

  const supabase = createClient(url, claveServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Si el SQL 10.4 todavía no corrió, esto falla sin romper nada
  const { data, error } = await supabase.rpc("bienvenidas_a_enviar");
  if (error) {
    console.error("[Motocambio] Error buscando bienvenidas:", error.message);
    return NextResponse.json({ ok: false });
  }
  const candidatos = (data as Candidato[]) || [];
  if (candidatos.length === 0) return NextResponse.json({ ok: true, enviados: 0 });

  const resend = new Resend(claveResend);
  let enviados = 0;

  for (const c of candidatos) {
    try {
      const { error: errMail } = await resend.emails.send({
        from: "Motocambio <contacto@motocambio.com.ar>",
        to: c.email,
        subject: "¿Cargamos tu moto? Son 2 minutos 🏍️",
        html: armarMailBienvenida(c.nombre),
      });
      if (!errMail) {
        await supabase.from("bienvenidas").insert({ usuario: c.usuario });
        enviados++;
      } else {
        console.error("[Motocambio] Resend (bienvenida):", errMail);
      }
    } catch (e) {
      console.error("[Motocambio] Error mandando bienvenida:", e);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
