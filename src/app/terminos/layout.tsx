import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Los términos y condiciones de uso de Motocambio.",
  alternates: { canonical: "/terminos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
