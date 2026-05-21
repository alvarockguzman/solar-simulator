import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import { Header } from "../components/Header";
import { RelevamientoProvider } from "./context/RelevamientoContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Presupuesto Indicativo | Renovatio",
  description:
    "Solicitá un presupuesto indicativo y análisis de factibilidad para tu instalación solar.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function PresupuestoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RelevamientoProvider>
      <div className="relevamiento-app flex min-h-screen flex-col bg-stone-50 text-stone-900">
        <Header />
        {children}
      </div>
    </RelevamientoProvider>
  );
}
