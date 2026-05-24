"use client";

import { wizardBtnPrimary, wizardBtnSecondary } from "./wizardButtons";

interface WizardNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  canGoNext?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function WizardNav({
  onBack,
  onNext,
  nextLabel = "Siguiente",
  backLabel = "Atrás",
  canGoNext = true,
  isLoading = false,
  loadingLabel,
}: WizardNavProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className={wizardBtnSecondary}
        >
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={wizardBtnPrimary}
      >
        {isLoading ? (loadingLabel ?? "...") : nextLabel}
      </button>
    </div>
  );
}
