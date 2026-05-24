"use client";

import { WizardStepLayout } from "./WizardStepLayout";
import { wizardBtnPrimary } from "./wizardButtons";

interface StepIntroProps {
  onStart: () => void;
}

export function StepIntro({ onStart }: StepIntroProps) {
  return (
    <WizardStepLayout
      banner={
        <header className="flex h-full min-h-0 flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-8">
          <h1 className="text-lg font-bold text-white lg:text-2xl">Calculadora Solar Avanzada</h1>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-amber-100 lg:mt-4">
            Simulación técnica y análisis económico para empresas industriales. Resultado en menos
            de 2 minutos: potencia recomendada, energía generada, ahorro anual y repago. Sin
            compromiso.
          </p>
        </header>
      }
    >
      <h2 className="mb-4 text-xl font-semibold leading-snug text-stone-900">
        Completá unos datos rápidos y obtené tu resultado en minutos.
      </h2>
      <ol className="mb-6 list-inside list-decimal space-y-2 text-sm text-stone-600">
        <li>Ubicación de tu empresa</li>
        <li>Superficie disponible</li>
        <li>Tarifa contratada</li>
        <li>Consumo anual estimado</li>
      </ol>
      <p className="mb-2 text-sm text-stone-600">
        Los datos son orientativos; no se requiere exactitud.
      </p>
      <p className="mb-8 text-sm text-stone-600">
        Completando el simulador vas a obtener un resultado inicial y una estimación del ahorro que
        podés generar con una instalación de paneles solares.
      </p>
      <button
        type="button"
        onClick={onStart}
        className={`inline-flex w-fit items-center gap-2 ${wizardBtnPrimary} px-8 py-4`}
      >
        Comenzar simulación
        <span aria-hidden>→</span>
      </button>
      <p className="mt-3 text-sm text-brand-muted">
        Sin registro · Resultado inmediato · Un asesor te contacta solo si lo pedís
      </p>
    </WizardStepLayout>
  );
}
