"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { LandingFeatureCard } from "./LandingFeatureCard";
import { LoadingOverlay } from "./LoadingOverlay";

const TRANSITION_DURATION_MS = 380;

export function LandingClient() {
  const router = useRouter();
  const [transitionTo, setTransitionTo] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = useCallback(
    (href: string) => {
      if (transitionTo) return;
      setTransitionTo(href);
      setIsExiting(true);
      setTimeout(() => {
        router.push(href);
      }, TRANSITION_DURATION_MS);
    },
    [router, transitionTo]
  );

  return (
    <>
      <div
        className={`renovatio-landing-content flex min-h-screen flex-col bg-stone-50 ${isExiting ? "renovatio-page-exit" : ""}`}
        aria-busy={!!transitionTo}
      >
        <div className="sticky top-0 z-50 shrink-0 bg-white">
          <Header />
        </div>

        <main
          className="flex w-full flex-1 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8 lg:py-10"
          aria-label="Aplicaciones disponibles"
        >
          <LandingFeatureCard
            title="Calculadora Solar"
            body="Estimá el tamaño de tu sistema solar y el ahorro potencial en tu factura eléctrica en pocos minutos."
            ctaLabel="Iniciar simulación"
            href="/calculadora"
            imageSrc="/landing/calculadora.jpg"
            imageAlt="Paneles solares instalados en un techo"
            align="left"
            onNavigate={handleNavigate}
          />
          <LandingFeatureCard
            title="Presupuesto Indicativo"
            body="Compartí información de tu propiedad y recibí una propuesta preliminar con evaluación técnica e ingeniería."
            ctaLabel="Solicitar presupuesto"
            href="/presupuesto"
            imageSrc="/landing/presupuesto.jpg"
            imageAlt="Planos técnicos y relevamiento de instalación solar"
            align="right"
            onNavigate={handleNavigate}
          />
        </main>
      </div>

      <LoadingOverlay
        visible={!!transitionTo}
        message="Abriendo…"
        aria-label="Abriendo la aplicación"
      />
    </>
  );
}
