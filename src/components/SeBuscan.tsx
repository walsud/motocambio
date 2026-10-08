"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";

interface Demanda {
  modelo_id: number;
  marca: string;
  modelo: string;
  busquedas: number;
  publicadas: number;
}

// Número de WhatsApp para la carga asistida (se define en Vercel como
// NEXT_PUBLIC_WHATSAPP, solo dígitos con código de país, ej: 549XXXXXXXXXX).
// Si no está configurado, el botón no se muestra.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP;
const LINK_WA = WHATSAPP
  ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      "¡Hola! Tengo una moto para publicar en Motocambio y me gustaría que me ayuden a cargarla."
    )}`
  : null;

// La vidriera inversa: qué motos están buscando los usuarios AHORA.
// Si el visitante tiene una de estas en el garage, publicar deja de ser
// "a ver si algún día..." y pasa a ser "hay alguien esperándola".
export function SeBuscan({ logueado, compacto }: { logueado: boolean; compacto?: boolean }) {
  const supabase = crearClienteNavegador();
  const [demanda, setDemanda] = useState<Demanda[]>([]);

  useEffect(() => {
    supabase
      .from("demanda_publica")
      .select("modelo_id, marca, modelo, busquedas, publicadas")
      .gt("busquedas", 0)
      .order("busquedas", { ascending: false })
      .limit(compacto ? 6 : 8)
      .then(({ data }) => setDemanda((data as Demanda[]) || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (demanda.length === 0) return null;

  if (compacto) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        <span className="shrink-0 text-[13px] font-bold text-gris self-center">🔍 Se buscan:</span>
        {demanda.map((d) => (
          <span key={d.modelo_id}
            className="shrink-0 bg-white border border-linea rounded-full px-3 py-1.5 text-[13px] font-semibold">
            {d.marca} {d.modelo}
            <span className="text-rojo font-bold"> ·{d.busquedas}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <section className="pb-12">
      <div className="bg-white border-2 border-linea rounded-2xl p-6 sm:p-8">
        <h2 className="font-titulos font-black text-2xl tracking-tight">
          🔍 Se buscan ahora mismo
        </h2>
        <p className="text-sm text-gris mt-1">
          Búsquedas activas de usuarios registrados. ¿Tenés una de estas en tu
          garage? <b className="text-tinta2">Hay alguien esperándola.</b>
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 mt-5">
          {demanda.map((d) => (
            <div key={d.modelo_id}
              className="flex items-center justify-between gap-3 bg-hueso border border-linea rounded-xl px-4 py-3">
              <span className="font-titulos font-extrabold text-[14px] truncate">
                {d.marca} {d.modelo}
              </span>
              <span className="shrink-0 text-[12px] font-semibold text-gris">
                <b className="text-rojo">{d.busquedas}</b>{" "}
                {Number(d.busquedas) === 1 ? "persona la busca" : "personas la buscan"}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <Link href={logueado ? "/garage" : "/registro"}
            className="bg-rojo hover:bg-rojo-oscuro text-white font-titulos font-extrabold rounded-xl px-6 py-3">
            Publicá la tuya gratis →
          </Link>
          {LINK_WA && (
            <a href={LINK_WA} target="_blank" rel="noopener noreferrer"
              className="border-2 border-linea hover:border-verde-ok bg-white font-titulos font-extrabold rounded-xl px-5 py-3 text-tinta2">
              💬 ¿Te ayudamos a cargarla? Escribinos
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
