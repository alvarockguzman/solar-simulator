import { WizardProvider } from "./context/WizardContext";

/**
 * Compartido por /calculadora y /calculadora/nexo.
 * El header y los estilos de marca viven en el layout de cada versión.
 */
export default function CalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WizardProvider>{children}</WizardProvider>;
}
