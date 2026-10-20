import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { crearClienteServidor } from "@/lib/supabase/server";

// El vendedor acepta o ignora una consulta de Oportunidades.
// Si la acepta, le avisamos por mail al interesado que ya puede chatear.
// El mail del interesado lo lee solo el servidor; nunca se muestra.

export const dynamic = "force-dynamic";

const BASE = "https://motocambio.com.ar";

export async function POST(req: NextRequest) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, motivo: "sin sesión" }, { status: 401 });
  }
  const { consulta_id, aceptar } = await req.json().catch(() => ({}));
  if (!consulta_id || typeof aceptar !== "boolean") {
    return NextResponse.json({ ok: false, motivo: "faltan datos" }, { status: 400 });
  }

  // La función de la base verifica que seas el vendedor y que esté pendiente
  const { data, error } = await supabase.rpc("responder_consulta", {
    p_consulta: consulta_id,
    p_aceptar: aceptar,
  });
  const c = Array.isArray(data) ? data[0] : data;
  if (error || !c) {
    return NextResponse.json({ ok: false, motivo: "no se pudo responder" }, { status: 400 });
  }
  if (!aceptar) return NextResponse.json({ ok: true, estado: c.estado });

  // Aviso al interesado (si faltan claves, el chat igual queda abierto)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const claveResend = process.env.RESEND_API_KEY;
  if (url && claveServicio && claveResend) {
    const admin = createClient(url, claveServicio, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: u } = await admin.auth.admin.getUserById(c.interesado);
    const para = u?.user?.email;
    if (para) {
      const resend = new Resend(claveResend);
      const { error: errMail } = await resend.emails.send({
        from: "Motocambio <contacto@motocambio.com.ar>",
        to: para,
        subject: `💬 ${c.vendedor_nombre} aceptó tu consulta por la ${c.moto_txt}`,
        html: `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#14141f">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e2dc">
      <div style="background:#C8102E;padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">MOTO<span style="opacity:.85">CAMBIO</span></span>
      </div>
      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;font-size:22px">💬 ¡Ya pueden hablar!</h1>
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">Hola ${c.interesado_nombre},</p>
        <p style="margin:0 0 22px;color:#44445a;font-size:15px;line-height:1.55">
          <b>${c.vendedor_nombre}</b> aceptó tu consulta por la <b>${c.moto_txt}</b>.
          Ya tienen un chat abierto dentro de Motocambio.
        </p>
        <a href="${BASE}/consulta/${c.id}" style="display:inline-block;background:#C8102E;color:#fff;text-decoration:none;font-weight:800;border-radius:12px;padding:12px 22px">Abrir el chat</a>
        <p style="margin:22px 0 0;color:#6b6b7b;font-size:12px;line-height:1.5">
          Consejo: coordiná ver la moto en persona y verificá los papeles antes de
          cualquier seña. La operación corre por cuenta de ambas partes.
        </p>
      </div>
    </div>
  </div>
</body></html>`,
      });
      if (errMail) console.error("[Motocambio] Resend aceptación:", errMail);
    }
  }
  return NextResponse.json({ ok: true, estado: c.estado });
}
