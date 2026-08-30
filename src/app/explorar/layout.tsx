import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar motos en permuta",
  description: "Todas las motos +300cc publicadas para cambiar en Argentina. Filtrá por marca y provincia, mirá fotos y precios, y sumá la que te gusta a tu búsqueda.",
  alternates: { canonical: "/explorar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
