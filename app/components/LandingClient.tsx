"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HomeFlipCard } from "./HomeFlipCard";
import { LoadingOverlay } from "./LoadingOverlay";
import { RenovatioLogo, RenovatioTagline } from "./brand/RenovatioLogo";

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
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-20 lg:py-28">
          <header className="mb-14 text-center sm:mb-16">
            <h1>
              <RenovatioLogo variant="hero" />
            </h1>
            <p className="mt-3">
              <RenovatioTagline variant="hero" />
            </p>
          </header>

          <section
            className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2"
            aria-label="Aplicaciones disponibles"
          >
            <HomeFlipCard
              title="Calculadora Avanzada"
              subtitle="Simulación técnica detallada con análisis económico"
              body="Calcula rápidamente el ahorro en tu factura eléctrica, la capacidad de generación y el retorno de la inversión de tu sistema solar."
              ctaLabel="Iniciar Simulación"
              href="/advanced"
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
              title="Relevamiento"
              subtitle="Solicitud de presupuesto inicial y factibilidad técnica"
              body="Solicita un análisis de viabilidad y un presupuesto formal en base a información detallada de la instalación."
              ctaLabel="Solicitar presupuesto"
              href="/relevamiento"
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
