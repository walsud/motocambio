import type { Metadata, Viewport } from "next";
// Tipografías autoalojadas (sin depender de Google Fonts)
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/800.css";
import "@fontsource/archivo/900.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Motocambio — Tu moto vale otra moto",
  description:
    "La primera plataforma argentina de permutas de motos +300cc. Publicá la que tenés, contá cuál buscás, y te avisamos cuando hay match.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
