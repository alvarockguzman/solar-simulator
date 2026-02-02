"use client";

import { useState, useCallback } from "react";
import { StepIntro } from "./components/StepIntro";
import { StepAddress } from "./components/StepAddress";
import { StepSurface } from "./components/StepSurface";
import { StepTariff } from "./components/StepTariff";
import { StepConsumption } from "./components/StepConsumption";
import { StepResults } from "./components/StepResults";
import { LeadFormAdvanced } from "./components/LeadFormAdvanced";
import { useWizard } from "./context/WizardContext";

const STEPS = ["intro", "address", "surface", "tariff", "consumption", "results"] as const;
type StepId = (typeof STEPS)[number];

export default function AdvancedPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("intro");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const { getResults } = useWizard();

  const stepIndex = STEPS.indexOf(currentStep);
  const isIntro = currentStep === "intro";
  const isResults = currentStep === "results";

  const goNext = useCallback(() => {
    if (currentStep === "intro") setCurrentStep("address");
    else if (currentStep === "address") setCurrentStep("surface");
    else if (currentStep === "surface") setCurrentStep("tariff");
    else if (currentStep === "tariff") setCurrentStep("consumption");
    else if (currentStep === "consumption") setCurrentStep("results");
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep === "address") setCurrentStep("intro");
    else if (currentStep === "surface") setCurrentStep("address");
    else if (currentStep === "tariff") setCurrentStep("surface");
    else if (currentStep === "consumption") setCurrentStep("tariff");
    else if (currentStep === "results") setCurrentStep("consumption");
  }, [currentStep]);

  const results = isResults ? getResults() : null;

  return (
    <>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
      </main>

      {showLeadForm && (
        <LeadFormAdvanced
          onClose={() => setShowLeadForm(false)}
          results={results ?? undefined}
        />
      )}
    </>
  );
}
