import type { Metadata } from "next";
import { Header } from "../components/Header";
import { WizardProvider } from "./context/WizardContext";

export const metadata: Metadata = {
  title: "Calculadora Solar | Renovatio",
  description:
    "Simulación técnica y análisis económico para empresas industriales. Resultado en menos de 2 minutos.",
};

export default function CalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-stone-50">
        <Header />
        {children}
      </div>
    </WizardProvider>
  );
}
