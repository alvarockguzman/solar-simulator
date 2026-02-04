import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renovatio - Cuidando tu energía",
  description:
    "Renovatio. Calculadoras solares, relevamiento técnico y soluciones para tu energía.",
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
