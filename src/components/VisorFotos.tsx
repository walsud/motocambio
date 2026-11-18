"use client";
import { useEffect, useRef, useState } from "react";

// Visor de fotos a pantalla completa, estilo Mercado Libre:
// clic en la foto → se agranda; flechas / teclado / deslizar con el
// dedo para pasar de foto; Esc o tocar afuera para cerrar.
export function VisorFotos({
  fotos,
  inicial,
  alt,
  onCerrar,
}: {
  fotos: string[];
  inicial: number;
  alt?: string;
  onCerrar: () => void;
}) {
  const [idx, setIdx] = useState(Math.min(inicial, fotos.length - 1));
  const toqueX = useRef<number | null>(null);

  useEffect(() => {
    function teclas(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % fotos.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + fotos.length) % fotos.length);
    }
    window.addEventListener("keydown", teclas);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", teclas);
      document.body.style.overflow = overflowPrevio;
    };
  }, [fotos.length, onCerrar]);

  const anterior = () => setIdx((i) => (i - 1 + fotos.length) % fotos.length);
  const siguiente = () => setIdx((i) => (i + 1) % fotos.length);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={onCerrar}
      onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toqueX.current == null) return;
        const dx = e.changedTouches[0].clientX - toqueX.current;
        toqueX.current = null;
        if (Math.abs(dx) > 40) (dx < 0 ? siguiente : anterior)();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-sm font-semibold">
          {idx + 1} / {fotos.length}
        </span>
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="text-2xl leading-none px-2 py-1 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 px-2 pb-4">
        {fotos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); anterior(); }}
            aria-label="Foto anterior"
            className="hidden sm:flex shrink-0 w-11 h-11 mr-2 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl"
          >
            ‹
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[idx]}
          alt={alt || ""}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-lg select-none"
        />
        {fotos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); siguiente(); }}
            aria-label="Foto siguiente"
            className="hidden sm:flex shrink-0 w-11 h-11 ml-2 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl"
          >
            ›
          </button>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-1.5 justify-center px-3 pb-4 overflow-x-auto">
          {fotos.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={f}
              src={f}
              alt=""
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`h-12 w-16 object-cover rounded-md cursor-pointer border-2 shrink-0 ${
                i === idx ? "border-white" : "border-transparent opacity-50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
