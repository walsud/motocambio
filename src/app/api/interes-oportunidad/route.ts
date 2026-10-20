import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { crearClienteServidor } from "@/lib/supabase/server";

// "Me interesa" en una oportunidad: crea una CONSULTA y le avisa por mail
// al vendedor, SIN el mail del interesado. Si el vendedor la acepta desde
// su garage, se abre un chat dentro de Motocambio. Nadie ve el mail ni el
// teléfono del otro.

export const dynamic = "force-dynamic";

const BASE = "https://motocambio.com.ar";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const claveResend = process.env.RESEND_API_KEY;
  if (!url || !claveServicio || !claveResend) {
    return NextResponse.json({ ok: false, motivo: "falta configuración" });
  }

  // 1) Quién es el interesado (por su sesión)
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, motivo: "sin sesión" }, { status: 401 });
  }
  const { data: perfil } = await supabase
    .from("perfiles").select("nombre").eq("id", user.id).single();
  const nombreInteresado = perfil?.nombre || "Un usuario de Motocambio";

  // 2) La oportunidad
  const { oportunidad_id } = await req.json().catch(() => ({}));
  if (!oportunidad_id) {
    return NextResponse.json({ ok: false, motivo: "falta oportunidad" }, { status: 400 });
  }
  const admin = createClient(url, claveServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc("datos_oportunidad", { p_op: oportunidad_id });
  const op = Array.isArray(data) ? data[0] : data;
  if (error || !op) {
    return NextResponse.json({ ok: false, motivo: "oportunidad no vigente" }, { status: 404 });
  }
  if (op.vendedor_id === user.id) {
    return NextResponse.json({ ok: false, motivo: "es tu propia moto" }, { status: 400 });
  }

  // 3) ¿Ya había consultado por esta oportunidad? No duplicamos ni re-avisamos.
  const ref = String(oportunidad_id);
  const { data: previa } = await admin
    .from("consultas")
    .select("id, estado")
    .eq("oportunidad_ref", ref)
    .eq("interesado", user.id)
    .maybeSingle();
  if (previa) {
    return NextResponse.json({ ok: true, ya: true, estado: previa.estado, consulta_id: previa.id });
  }

  // 4) Crear la consulta (con una foto de los datos, por si la oportunidad vence)
  const { data: nueva, error: errIns } = await admin
    .from("consultas")
    .insert({
      oportunidad_ref: ref,
      interesado: user.id,
      vendedor: op.vendedor_id,
      interesado_nombre: nombreInteresado,
      vendedor_nombre: op.vendedor_nombre || "El vendedor",
      moto_txt: op.moto_txt,
      precio: op.precio ?? null,
    })
    .select("id")
    .single();
  if (errIns || !nueva) {
    console.error("[Motocambio] Error creando consulta:", errIns);
    return NextResponse.json({ ok: false, motivo: "no se pudo crear la consulta" });
  }

  // 5) Aviso al vendedor: sin datos de contacto del interesado
  const resend = new Resend(claveResend);
  const { error: errMail } = await resend.emails.send({
    from: "Motocambio <contacto@motocambio.com.ar>",
    to: op.vendedor_email,
    subject: `💰 Hay un interesado en tu ${op.moto_txt}`,
    html: `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#14141f">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e2dc">
      <div style="background:#C8102E;padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">MOTO<span style="opacity:.85">CAMBIO</span></span>
      </div>
      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;font-size:22px">💰 ¡Hay un interesado!</h1>
        <p style="margin:0 0 16px;color:#44445a;font-size:15px;line-height:1.55">Hola ${op.vendedor_nombre},</p>
        <p style="margin:0 0 18px;color:#44445a;font-size:15px;line-height:1.55">
          <b>${nombreInteresado}</b> vio tu <b>${op.moto_txt}</b> en Oportunidades
          (USD ${Number(op.precio).toLocaleString("es-AR")} de contado) y quiere hablar con vos.
        </p>
        <p style="margin:0 0 22px;color:#44445a;font-size:15px;line-height:1.55">
          Entrá a tu garage y elegí si aceptás la consulta. Si la aceptás, se abre un chat
          dentro de Motocambio. Ninguno de los dos ve el mail ni el teléfono del otro.
        </p>
        <a href="${BASE}/garage" style="display:inline-block;background:#C8102E;color:#fff;text-decoration:none;font-weight:800;border-radius:12px;padding:12px 22px">Ver la consulta</a>
        <p style="margin:22px 0 0;color:#6b6b7b;font-size:12px;line-height:1.5">
          Consejo: coordiná ver la moto en persona y verificá los papeles antes de
          cualquier seña. La operación corre por cuenta de ambas partes.
        </p>
      </div>
    </div>
  </div>
</body></html>`,
  });
  if (errMail) {
    // La consulta ya quedó creada: el vendedor la ve igual en su garage.
    console.error("[Motocambio] Resend interés:", errMail);
  }
  return NextResponse.json({ ok: true, consulta_id: nueva.id });
}
