import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador Solar | Beneficio económico de paneles solares",
  description:
    "Calcula el beneficio económico de instalar paneles solares en tu empresa. Elige tu perfil y conoce ahorro, recupero de inversión y más.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
