import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oportunidades: motos de contado bajo la referencia",
  description: "Motos en venta de contado por debajo de su precio de referencia. Duran 14 días. Si no está barata de verdad, no es oportunidad.",
  alternates: { canonical: "/oportunidades" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
