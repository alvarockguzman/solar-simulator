import type { Metadata } from "next";
import { Header } from "../../components/Header";
import { BrandProvider } from "@/app/lib/BrandContext";

export const metadata: Metadata = {
  title: "Calculadora Solar | Renovatio",
  description:
    "Simulación técnica y análisis económico para empresas industriales. Resultado en menos de 2 minutos.",
};

export default function RenovatioCalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider id="renovatio">
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-brand-surface">
        <Header />
        {children}
      </div>
    </BrandProvider>
  );
}
