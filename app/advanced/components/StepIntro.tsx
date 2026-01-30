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
        <p className="mt-4 text-amber-100 text-sm sm:text-base max-w-md">
          En 4 simples pasos, obtené una simulación avanzada para instalar paneles solares en tu empresa.
        </p>
      </div>

      {/* Right: content */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-12 lg:py-12 bg-white overflow-auto">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">
          Te pediremos los siguientes datos:
        </h2>
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
          className="rounded-xl bg-amber-500 px-8 py-4 font-semibold text-white shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-fit"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
