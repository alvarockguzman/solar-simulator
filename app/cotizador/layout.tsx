import type { Metadata } from "next";
import { CotizadorLayoutShell } from "./components/CotizadorLayoutShell";
import { CotizadorPendingProvider } from "./components/CotizadorPendingNavigation";
import { CotizadorProvider } from "./context/CotizadorContext";

export const metadata: Metadata = {
  title: "Cotizador Solar | Renovatio (interno)",
  description:
    "Herramienta interna para generar cotizaciones preliminares de sistemas solares.",
  robots: { index: false, follow: false },
};

export default function CotizadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CotizadorProvider>
      <CotizadorPendingProvider>
        <CotizadorLayoutShell>
          <div className="min-h-[100dvh] bg-slate-50">{children}</div>
        </CotizadorLayoutShell>
      </CotizadorPendingProvider>
    </CotizadorProvider>
  );
}
