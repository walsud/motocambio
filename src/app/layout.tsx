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
  metadataBase: new URL("https://motocambio.com.ar"),
  title: {
    default: "Motocambio — Tu moto vale otra moto",
    template: "%s · Motocambio",
  },
  description:
    "La primera plataforma argentina de permutas de motos +300cc. Publicá la que tenés, contá cuál buscás, y te avisamos cuando hay match.",
  keywords: [
    "permuta de motos", "cambio de motos", "permuto moto", "motos usadas argentina",
    "cambiar moto", "permuta motos 300cc", "trueque de motos",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://motocambio.com.ar",
    siteName: "Motocambio",
    title: "Motocambio — Tu moto no se vende. Cambiala.",
    description:
      "Publicá la moto que tenés, contá cuál buscás, y te avisamos cuando hay match. Permutas de motos +300cc en Argentina.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Motocambio — Tu moto no se vende. Cambiala.",
    description:
      "La primera plataforma argentina de permutas de motos +300cc. Gratis durante la beta.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="antialiased">
        <div className="recorte-horizontal">{children}</div>
      </body>
    </html>
  );
}
