"use client";

interface WizardNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  canGoNext?: boolean;
  isLoading?: boolean;
}

export function WizardNav({
  onBack,
  onNext,
  nextLabel = "Siguiente",
  backLabel = "Atrás",
  canGoNext = true,
  isLoading = false,
}: WizardNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-2 border-amber-600 px-6 py-3 font-semibold text-amber-700 bg-white hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        {isLoading ? "..." : nextLabel}
      </button>
    </div>
  );
}
