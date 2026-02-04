import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora Básica | Renovatio",
  description:
    "Calcula el beneficio económico de instalar paneles solares en tu empresa. Elige tu perfil y conoce ahorro, recupero de inversión y más.",
};

export default function BasicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
