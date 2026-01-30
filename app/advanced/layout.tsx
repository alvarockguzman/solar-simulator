import type { Metadata } from "next";
import { WizardProvider } from "./context/WizardContext";

export const metadata: Metadata = {
  title: "Calculadora Solar Avanzada | Renovatio",
  description:
    "En 4 simples pasos, obtené una simulación avanzada para instalar paneles solares en tu empresa.",
};

export default function AdvancedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <div className="min-h-screen h-screen overflow-hidden flex flex-col bg-stone-50">
        {children}
      </div>
    </WizardProvider>
  );
}
