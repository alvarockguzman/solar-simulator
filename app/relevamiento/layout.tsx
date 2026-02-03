import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import { RelevamientoProvider } from "./context/RelevamientoContext";

export const metadata: Metadata = {
  title: "SolarCheck | Renovatio",
  description:
    "Relevamiento técnico para tu instalación solar. Capturá los datos con tu móvil y nuestros ingenieros diseñarán el sistema para tu techo.",
};

export default function RelevamientoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RelevamientoProvider>
      <div className="relevamiento-app min-h-screen flex flex-col bg-stone-50 text-stone-900">
        {children}
      </div>
    </RelevamientoProvider>
  );
}
