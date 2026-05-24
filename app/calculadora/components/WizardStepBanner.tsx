/** Barra de progreso del paso (mismo markup; flex reflow arriba vs columna lateral). */
export function WizardStepBanner({
  title,
  subtitle,
  stepIndex,
  totalSteps = 6,
}: {
  title: string;
  subtitle: string;
  stepIndex: number;
  totalSteps?: number;
}) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <header className="flex h-full min-h-0 flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 lg:block">
        <div className="min-w-0 flex-1 lg:flex-none">
          <h2 className="text-lg font-bold text-white lg:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-amber-100 lg:mt-2">{subtitle}</p>
        </div>
        <p className="shrink-0 text-sm text-white/90 lg:mt-2">Paso {stepIndex + 1}/{totalSteps}</p>
      </div>
      <div
        className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-amber-300/50 lg:mt-6"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
      >
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
