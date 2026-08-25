import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// El "cartero" de Motocambio: busca los matches todavía no avisados
// y les manda un mail a las dos partes. Se dispara desde la web cada
// vez que alguien guarda una moto o una búsqueda.
//
// Necesita dos claves que viven SOLO en Vercel (nunca en el código):
//   SUPABASE_SERVICE_ROLE_KEY  → para leer los mails de los usuarios
//   RESEND_API_KEY             → para mandar los correos

export const dynamic = "force-dynamic";

interface MatchPendiente {
  match_id: string;
  tipo: string;
  email_a: string; nombre_a: string; moto_de_a: string;
  email_b: string; nombre_b: string; moto_de_b: string;
  diferencia: number | null;
}

function armarMail(opts: {
  nombre: string;
  motoPropia: string;
  motoAjena: string;
  otroNombre: string;
  tipo: string;
}) {
  const { nombre, motoPropia, motoAjena, otroNombre, tipo } = opts;
  const titulo = tipo === "directo" ? "🎉 ¡Tenés un match!" : "👀 Hay interés en tu moto";
  const cuerpo =
    tipo === "directo"
      ? `<b>${otroNombre}</b> tiene una <b>${motoAjena}</b> y busca una moto como tu <b>${motoPropia}</b>. Ustedes dos se están buscando mutuamente — eso es un match directo.`
      : `Tu <b>${motoPropia}</b> y la <b>${motoAjena}</b> de <b>${otroNombre}</b> podrían cambiarse. Entrá a tu garage para ver los detalles.`;
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#14141f">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e2dc">
      <div style="background:#C8102E;padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">MOTO<span style="opacity:.85">CAMBIO</span></span>
      </div>
      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;font-size:24px">${titulo}</h1>
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">Hola ${nombre},</p>
        <p style="margin:0 0 22px;color:#44445a;font-size:15px;line-height:1.55">${cuerpo}</p>
        <a href="https://motocambio.com.ar/garage"
           style="display:inline-block;background:#C8102E;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:12px">
          Ver mi match →
        </a>
        <p style="margin:26px 0 0;color:#6b6b7b;font-size:12px;line-height:1.5">
          La verificación de las motos y la transferencia corren por cuenta de ambas partes.
          Consejos para un cambio seguro en motocambio.com.ar.
        </p>
      </div>
    </div>
    <p style="text-align:center;color:#6b6b7b;font-size:11px;margin:14px 0 0">
      Recibís este mail porque tenés una publicación o búsqueda activa en Motocambio.
    </p>
  </div>
</body></html>`;
}

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const claveResend = process.env.RESEND_API_KEY;

  if (!url || !claveServicio) {
    return NextResponse.json({ ok: false, motivo: "falta configuración de Supabase" });
  }

  const supabase = createClient(url, claveServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("matches_a_notificar");
  if (error) {
    console.error("[Motocambio] Error buscando matches a notificar:", error.message);
    return NextResponse.json({ ok: false });
  }
  const pendientes = (data as MatchPendiente[]) || [];
  if (pendientes.length === 0) return NextResponse.json({ ok: true, enviados: 0 });

  if (!claveResend) {
    // Sin Resend configurado no se pierde nada: quedan pendientes
    // y los matches igual se ven en el garage.
    return NextResponse.json({ ok: true, enviados: 0, pendientes: pendientes.length });
  }

  const resend = new Resend(claveResend);
  let avisados = 0;

  for (const m of pendientes) {
    const destinos = [
      { para: m.email_a, nombre: m.nombre_a, propia: m.moto_de_a, ajena: m.moto_de_b, otro: m.nombre_b },
      { para: m.email_b, nombre: m.nombre_b, propia: m.moto_de_b, ajena: m.moto_de_a, otro: m.nombre_a },
    ];
    let algunoSalio = false;
    for (const d of destinos) {
      try {
        const { error: errMail } = await resend.emails.send({
          from: "Motocambio <contacto@motocambio.com.ar>",
          to: d.para,
          subject:
            m.tipo === "directo"
              ? `🎉 ¡Match! Tu ${d.propia} tiene candidata`
              : `👀 Hay interés en tu ${d.propia}`,
          html: armarMail({
            nombre: d.nombre,
            motoPropia: d.propia,
            motoAjena: d.ajena,
            otroNombre: d.otro,
            tipo: m.tipo,
          }),
        });
        if (!errMail) algunoSalio = true;
        else console.error("[Motocambio] Resend:", errMail);
      } catch (e) {
        console.error("[Motocambio] Error mandando mail:", e);
      }
    }
    if (algunoSalio) {
      await supabase.from("matches").update({ notificado: true }).eq("id", m.match_id);
      avisados++;
    }
  }

  return NextResponse.json({ ok: true, enviados: avisados });
}
