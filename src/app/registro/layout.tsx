import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creá tu cuenta gratis",
  description: "Registrate gratis en Motocambio: publicá tu moto, contá cuál buscás y dejá que el matching trabaje por vos.",
  alternates: { canonical: "/registro" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
