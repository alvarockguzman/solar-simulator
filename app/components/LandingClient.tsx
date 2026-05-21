"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { HomeFlipCard } from "./HomeFlipCard";
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
        <Header />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <section
            className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2"
            aria-label="Aplicaciones disponibles"
          >
            <HomeFlipCard
              title="Calculadora Solar"
              subtitle="Simulación rápida con análisis económico"
              body="Calcula rápidamente el ahorro en tu factura eléctrica, la capacidad de generación y el retorno de la inversión de tu sistema solar."
              ctaLabel="Iniciar Simulación"
              href="/calculadora"
              onNavigate={handleNavigate}
              icon={
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <HomeFlipCard
              title="Presupuesto Indicativo"
              subtitle="Solicitud de presupuesto inicial y factibilidad técnica"
              body="Solicita un análisis de viabilidad y un presupuesto formal en base a información detallada de la instalación."
              ctaLabel="Solicitar presupuesto"
              href="/presupuesto"
              onNavigate={handleNavigate}
              icon={
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
            />
          </section>
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
