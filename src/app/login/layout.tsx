import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresá",
  description: "Entrá a tu garage de Motocambio: tus motos, tus búsquedas y tus matches.",
  alternates: { canonical: "/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
