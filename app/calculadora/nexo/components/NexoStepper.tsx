const STEPS = ["Dirección", "Superficie", "Tarifa", "Consumo", "Resultado"] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M3.5 8.2 6.4 11l6.1-6.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** stepIndex del wizard (intro = 0). Los pasos de datos empiezan en 1. */
export function NexoStepper({ stepIndex }: { stepIndex: number }) {
  const active = Math.min(Math.max(stepIndex - 1, 0), STEPS.length - 1);

  return (
    <nav aria-label="Pasos de la calculadora" className="bg-white px-3 py-4 sm:px-6">
      <ol className="relative mx-auto flex max-w-3xl justify-between">
        <div
          className="absolute left-[8%] right-[8%] top-3.5 h-0.5 sm:left-[6%] sm:right-[6%]"
          style={{
            background: "linear-gradient(90deg, #009657 0%, #7CC142 50%, #0397D1 100%)",
          }}
          aria-hidden
        />
        {STEPS.map((label, index) => {
          const state = index < active ? "done" : index === active ? "active" : "upcoming";
          return (
            <li key={label} className="relative z-10 flex w-14 flex-col items-center sm:w-20">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  state === "active"
                    ? "bg-brand-primary text-white"
                    : state === "done"
                      ? "bg-brand-accent text-white"
                      : "border-2 border-brand-primary bg-white text-brand-primary"
                }`}
                aria-current={state === "active" ? "step" : undefined}
              >
                {state === "done" ? <CheckIcon /> : index + 1}
              </span>
              <span
                className={`mt-1.5 text-center text-[10px] leading-tight sm:text-xs ${
                  state === "active" ? "font-bold text-brand-primary" : "font-medium text-brand-muted"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
