"use client";

import { useState, useCallback } from "react";
import { useRelevamiento } from "../context/RelevamientoContext";
import { WizardProgress } from "../components/WizardProgress";
import { Step1Direccion } from "../components/Step1Direccion";
import { Step2Mapa } from "../components/Step2Mapa";
import { Step3Factura } from "../components/Step3Factura";
import { Step4Techo } from "../components/Step4Techo";
import { Step5Tablero } from "../components/Step5Tablero";
import { Step6Contacto } from "../components/Step6Contacto";
import { RelevamientoSuccess } from "../components/RelevamientoSuccess";

const TOTAL_STEPS = 6;

export default function RelevamientoWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const {
    address,
    center,
    surfaceM2,
    facturaFile,
    material,
    fotoTechoFile,
    fotoObstaculosFile,
    fotoTableroFile,
    cableado,
    distanciaTablero,
  } = useRelevamiento();

  const step1CanNext = address.trim() !== "" && center !== null;
  const step2CanNext = surfaceM2 > 0;
  const step3CanNext = !!facturaFile;
  const step4CanNext = !!material && !!fotoTechoFile && !!fotoObstaculosFile;
  const step5CanNext = !!fotoTableroFile && !!cableado && !!distanciaTablero;

  function canGoNext(): boolean {
    if (currentStep === 1) return step1CanNext;
    if (currentStep === 2) return step2CanNext;
    if (currentStep === 3) return step3CanNext;
    if (currentStep === 4) return step4CanNext;
    if (currentStep === 5) return step5CanNext;
    return true;
  }

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const showSharedNav = currentStep >= 3 && currentStep < 6;
  const canNext = canGoNext();

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <RelevamientoSuccess />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {currentStep === 1 && <Step1Direccion onBack={goBack} onNext={goNext} />}
      {currentStep === 2 && <Step2Mapa onBack={goBack} onNext={goNext} />}
      {currentStep === 3 && <Step3Factura onBack={goBack} onNext={goNext} />}
      {currentStep === 4 && <Step4Techo onBack={goBack} onNext={goNext} />}
      {currentStep === 5 && <Step5Tablero onBack={goBack} onNext={goNext} />}
      {currentStep === 6 && <Step6Contacto onBack={goBack} onNext={goNext} onSuccess={() => setSubmitted(true)} />}

      {showSharedNav && (
        <div className="shrink-0 p-4 border-t border-stone-200 bg-white flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border-2 border-amber-600 px-6 py-3 font-semibold text-amber-700 bg-white hover:bg-amber-50"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
