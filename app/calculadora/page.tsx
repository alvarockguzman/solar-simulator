"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepIntro } from "./components/StepIntro";
import { StepAddress } from "./components/StepAddress";
import { StepSurface } from "./components/StepSurface";
import { StepTariff } from "./components/StepTariff";
import { StepConsumption } from "./components/StepConsumption";
import { StepResults } from "./components/StepResults";
import { LeadFormAdvanced } from "./components/LeadFormAdvanced";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useWizard } from "./context/WizardContext";

const STEPS = ["intro", "address", "surface", "tariff", "consumption", "results"] as const;
type StepId = (typeof STEPS)[number];

/** Espera mínima para que el overlay "Calculando…" no parpadee. */
const MIN_CALCULATION_MS = 800;

async function fetchPvgisYield(coords: { lat: number; lng: number }): Promise<number | null> {
  try {
    const res = await fetch(`/api/pvgis?lat=${coords.lat}&lon=${coords.lng}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.yieldKwhPerKwpYear === "number" && data.yieldKwhPerKwpYear > 0
      ? data.yieldKwhPerKwpYear
      : null;
  } catch {
    return null;
  }
}

function CalculadoraPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewLeadSuccess =
    process.env.NODE_ENV === "development" &&
    searchParams.get("preview") === "lead-success";

  const [currentStep, setCurrentStep] = useState<StepId>("intro");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { getResults, coordinates, setPvgisYield } = useWizard();

  useEffect(() => {
    if (previewLeadSuccess) {
      setShowLeadForm(true);
    }
  }, [previewLeadSuccess]);

  const stepIndex = STEPS.indexOf(currentStep);
  const isIntro = currentStep === "intro";
  const isResults = currentStep === "results";

  const goNext = useCallback(() => {
    if (currentStep === "consumption") {
      setIsCalculating(true);
      const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_CALCULATION_MS));
      const yieldPromise = coordinates ? fetchPvgisYield(coordinates) : Promise.resolve(null);
      // Si PVGIS falla o no hay coordenadas, yield = null y calculate() usa el promedio.
      Promise.all([yieldPromise, minDelay]).then(([pvgisYield]) => {
        setPvgisYield(pvgisYield);
        setCurrentStep("results");
        setIsCalculating(false);
      });
      return;
    }
    if (currentStep === "intro") setCurrentStep("address");
    else if (currentStep === "address") setCurrentStep("surface");
    else if (currentStep === "surface") setCurrentStep("tariff");
    else if (currentStep === "tariff") setCurrentStep("consumption");
  }, [currentStep, coordinates, setPvgisYield]);

  const goBack = useCallback(() => {
    if (currentStep === "address") setCurrentStep("intro");
    else if (currentStep === "surface") setCurrentStep("address");
    else if (currentStep === "tariff") setCurrentStep("surface");
    else if (currentStep === "consumption") setCurrentStep("tariff");
    else if (currentStep === "results") setCurrentStep("consumption");
  }, [currentStep]);

  const closeLeadForm = useCallback(() => {
    setShowLeadForm(false);
    if (previewLeadSuccess) {
      router.replace("/calculadora");
    }
  }, [previewLeadSuccess, router]);

  const results = isResults ? getResults() : null;

  return (
    <>
      <main
        className={`flex-1 flex flex-col min-h-0 ${isResults ? "overflow-y-auto" : "overflow-hidden"}`}
      >
        <div key={currentStep} className="fade-slide-in flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentStep === "intro" && <StepIntro onStart={goNext} />}
          {currentStep === "address" && (
            <StepAddress
              stepIndex={1}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {currentStep === "surface" && (
            <StepSurface
              stepIndex={2}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {currentStep === "tariff" && (
            <StepTariff
              stepIndex={3}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {currentStep === "consumption" && (
            <StepConsumption
              stepIndex={4}
              onBack={goBack}
              onNext={goNext}
              isLoading={isCalculating}
              nextLabel="Calcular"
              loadingLabel="Calculando…"
            />
          )}
          {currentStep === "results" && results && (
            <StepResults
              results={results}
              stepIndex={5}
              onBack={goBack}
              onRequestQuote={() => setShowLeadForm(true)}
            />
          )}
        </div>
      </main>

      <LoadingOverlay
        visible={isCalculating}
        message="Calculando…"
        aria-label="Procesando datos"
      />

      {showLeadForm && (
        <LeadFormAdvanced
          onClose={closeLeadForm}
          results={results ?? undefined}
          initialSuccess={previewLeadSuccess}
        />
      )}
    </>
  );
}

export default function AdvancedPage() {
  return (
    <Suspense fallback={null}>
      <CalculadoraPageContent />
    </Suspense>
  );
}
