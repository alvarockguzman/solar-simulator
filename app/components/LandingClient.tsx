"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
        className={`renovatio-landing-content min-h-screen bg-stone-50 ${isExiting ? "renovatio-page-exit" : ""}`}
        aria-busy={!!transitionTo}
      >
        <main className="mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:py-28">
          <header className="mb-14 text-center sm:mb-16">
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "#343A40", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
            >
              Renovatio
            </h1>
            <p
              className="mt-3 text-xl font-medium sm:text-2xl"
              style={{ color: "#E67E22", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
            >
              Cuidamos tu energía
            </p>
          </header>

          <section
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
            aria-label="Aplicaciones disponibles"
          >
            <HomeFlipCard
              title="Calculadora Avanzada"
              description="Analiza el ahorro económico de tu empresa con una instalación solar a medida."
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
              description="Comparte los datos del sitio y recibe un presupuesto elaborado por ingeniería."
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
            <HomeFlipCard
              title="Calculadora Básica"
              description="Explora rápidamente distintos escenarios de rendimiento y ahorro solar."
              href="/basica"
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
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
