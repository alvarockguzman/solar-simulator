"use client";

interface StepIntroProps {
  onStart: () => void;
}

export function StepIntro({ onStart }: StepIntroProps) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      {/* Left: brand / title */}
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-12 lg:w-2/5 lg:min-h-0">
        <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Calculadora Solar Avanzada
        </h1>
        <p className="mt-4 text-amber-100 text-sm sm:text-base max-w-md leading-relaxed">
          Simulación técnica y análisis económico para empresas industriales.
          Resultado en menos de 2 minutos: potencia recomendada, energía generada,
          ahorro anual y repago. Sin compromiso.
        </p>
      </div>

      {/* Right: content */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-12 lg:py-12 bg-white overflow-auto">
        <p className="text-sm font-medium text-brand-navy mb-3">
          Completá unos datos rápidos y obtené tu resultado en minutos.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-stone-700 mb-6">
          <li>Ubicación de tu empresa</li>
          <li>Superficie disponible</li>
          <li>Tarifa contratada</li>
          <li>Consumo anual estimado</li>
        </ol>
        <p className="text-sm text-stone-600 mb-2">
          Los datos son orientativos; no se requiere exactitud.
        </p>
        <p className="text-sm text-stone-600 mb-8">
          Completando el simulador vas a obtener un resultado inicial y una estimación del ahorro que podés generar con una instalación de paneles solares.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-4 font-semibold text-white shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-fit"
        >
          Comenzar simulación
          <span aria-hidden>→</span>
        </button>
        <p className="mt-3 text-sm text-brand-muted">
          Sin registro · Resultado inmediato · Un asesor te contacta solo si lo
          pedís
        </p>
      </div>
    </div>
  );
}
