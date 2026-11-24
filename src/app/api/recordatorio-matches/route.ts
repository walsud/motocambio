import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Recordatorio de matches quietos: a cada parte de un match que lleva
// 7+ días sin cerrarse y sin charla en los últimos 5 días le llega UN
// mail (por match). Si el otro ya marcó "concretado", le pedimos que
// confirme; si nadie marcó nada, lo invitamos a escribir o a marcarlo.
// Lo dispara Vercel una vez por día (ver vercel.json). La lista la arma
// la base (recordatorios_match_a_enviar) y acá solo se manda y se anota.
//
// Claves (viven SOLO en Vercel): SUPABASE_SERVICE_ROLE_KEY y
// RESEND_API_KEY. CRON_SECRET es opcional, igual que en la bienvenida.

export const dynamic = "force-dynamic";

interface Candidato {
  match_id: string;
  usuario: string;
  email: string;
  nombre: string;
  mi_moto: string;
  otra_moto: string;
  otro_nombre: string;
  caso: "confirmar" | "charlar";
}

function escapar(t: string) {
  return t.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function armarMail(c: Candidato) {
  const nombre = escapar(c.nombre);
  const mia = escapar(c.mi_moto);
  const ajena = escapar(c.otra_moto);
  const otro = escapar(c.otro_nombre);
  const link = `https://motocambio.com.ar/match/${c.match_id}`;

  const titulo =
    c.caso === "confirmar" ? "🤝 ¿Confirmás el cambio?" : "🏍️ ¿Cómo va tu match?";
  const cuerpo =
    c.caso === "confirmar"
      ? `<b>${otro}</b> marcó como concretado el cambio de tu <b>${mia}</b> por su <b>${ajena}</b>. Falta solo tu confirmación para cerrarlo.`
      : `Hace unos días tu <b>${mia}</b> hizo match con la <b>${ajena}</b> de <b>${otro}</b>. ¿Pudieron hablar?`;
  const extra =
    c.caso === "confirmar"
      ? `Si el cambio se hizo, entrá al chat y tocá <b>Confirmar</b>: las dos motos se dan de baja solas. Si todavía no se concretó, avisale por el chat.`
      : `Si ya hicieron el cambio, entrá al chat y marcalo como <b>concretado</b> así se dan de baja las motos. Si todavía no hablaron, mandale un mensaje: a veces el primer paso es todo lo que falta.`;
  const boton = c.caso === "confirmar" ? "Confirmar el cambio →" : "Ir al chat del match →";

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
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">${cuerpo}</p>
        <p style="margin:0 0 22px;color:#44445a;font-size:15px;line-height:1.55">${extra}</p>
        <a href="${link}"
           style="display:inline-block;background:#C8102E;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:12px">
          ${boton}
        </a>
        <p style="margin:26px 0 0;color:#6b6b7b;font-size:12px;line-height:1.5">
          Es un único recordatorio por este match: no te volvemos a escribir por esto.
          La verificación de las motos y la transferencia corren por cuenta de ambas partes.
        </p>
      </div>
    </div>
    <p style="text-align:center;color:#6b6b7b;font-size:11px;margin:14px 0 0">
      Recibís este mail porque tenés un match abierto en motocambio.com.ar.
    </p>
  </div>
</body></html>`;
}

export async function GET(req: Request) {
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

  // Si el SQL 11.1 todavía no corrió, esto falla sin romper nada
  const { data, error } = await supabase.rpc("recordatorios_match_a_enviar");
  if (error) {
    console.error("[Motocambio] Error buscando recordatorios de match:", error.message);
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
        subject:
          c.caso === "confirmar"
            ? `${c.otro_nombre} marcó el cambio como concretado 🤝`
            : `¿Cómo va el match de tu ${c.mi_moto}? 🏍️`,
        html: armarMail(c),
      });
      if (!errMail) {
        await supabase
          .from("recordatorios_match")
          .insert({ match_id: c.match_id, usuario: c.usuario });
        enviados++;
      } else {
        console.error("[Motocambio] Resend (recordatorio match):", errMail);
      }
    } catch (e) {
      console.error("[Motocambio] Error mandando recordatorio de match:", e);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
