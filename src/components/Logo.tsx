// Isotipo Motocambio: dos flechas que se persiguen — la permuta.
export function Logo({ tamano = 36 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" aria-label="Motocambio">
      <defs>
        <marker
          id="flecha-logo"
          markerWidth="11"
          markerHeight="11"
          refX="4.5"
          refY="5.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L10,5.5 L0,11 Z" fill="#fff" />
        </marker>
      </defs>
      <rect width="64" height="64" rx="15" fill="#C8102E" />
      <path
        d="M18.1,22.3 A17,17 0 0 1 45.9,22.3"
        fill="none"
        stroke="#fff"
        strokeWidth="5.2"
        strokeLinecap="round"
        markerEnd="url(#flecha-logo)"
      />
      <path
        d="M45.9,41.7 A17,17 0 0 1 18.1,41.7"
        fill="none"
        stroke="#fff"
        strokeWidth="5.2"
        strokeLinecap="round"
        markerEnd="url(#flecha-logo)"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-titulos font-black text-xl tracking-tight">
      MOTO<span className="text-rojo">CAMBIO</span>
    </span>
  );
}
