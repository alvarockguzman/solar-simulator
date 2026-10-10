import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { BrandProvider } from "@/app/lib/BrandContext";
import { NexoHeader } from "./components/NexoHeader";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nexo",
  display: "swap",
});

const description =
  "Calculá cuánto ahorra tu empresa con energía solar. Ingeniería, financiamiento y ejecución llave en mano.";

export const metadata: Metadata = {
  title: "Calculadora Solar | Nexo Energía",
  description,
  openGraph: {
    title: "Calculadora Solar | Nexo Energía",
    description,
    images: [
      {
        url: "/brand/nexo/portada.webp",
        alt: "Instalación solar de Nexo Energía",
      },
    ],
  },
  icons: {
    icon: "/brand/nexo/nexo-isotipo.png",
  },
};

export default function NexoCalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider id="nexo">
      <div
        data-brand="nexo"
        className={`${montserrat.variable} flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white`}
      >
        <NexoHeader />
        {children}
      </div>
    </BrandProvider>
  );
}
