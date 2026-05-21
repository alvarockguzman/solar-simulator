"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/** Formulario Monday — cotización / propuesta indicativa */
const MONDAY_PRESUPUESTO_FORM_URL = "https://wkf.ms/4nINfcK";

type ChecklistItem = {
  title: string;
  optional?: boolean;
  description?: string;
  notes?: string[];
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    title: "Tus últimas 12 facturas de electricidad",
    description:
      "Para analizar tu consumo energético histórico y estimar el sistema adecuado.",
    notes: [
      "Si no tenés las últimas 12, subí las que tengas.",
      "Si no contás con facturas, indicá tu consumo mensual estimado.",
    ],
  },
  {
    title: "Fotos del techo o superficie disponible",
    description:
      "Necesitamos visualizar el espacio donde podría realizarse la instalación solar, incluyendo posibles obstáculos como tanques, sombras, equipos o estructuras.",
  },
  {
    title: "Foto del tablero eléctrico principal",
    optional: true,
    description:
      "Si es posible, incluí también una imagen clara del tablero eléctrico principal de la propiedad.",
  },
  {
    title: "No es necesario estar en la propiedad",
    description:
      "Los archivos pueden subirse como fotos o documentos PDF.",
  },
];

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function PresupuestoIntroContent() {
  const searchParams = useSearchParams();
  const enviado = searchParams.get("enviado") === "1";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
      {enviado && (
        <div className="mb-6 w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-800">
          Solicitud enviada correctamente. Nuestro equipo técnico la revisará a
          la brevedad.
        </div>
      )}

      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Tu propuesta solar comienza aquí
        </h1>
        <p className="mt-5 text-base leading-relaxed text-stone-600 sm:text-lg">
          Completá el siguiente formulario con la información necesaria para que
          nuestro equipo de ingeniería evalúe tu propiedad y prepare una
          propuesta indicativa en las próximas 48 horas.
        </p>
      </header>

      <section className="mt-10 w-full" aria-labelledby="presupuesto-checklist">
        <h2
          id="presupuesto-checklist"
          className="mb-5 text-base font-bold text-stone-900 sm:text-lg"
        >
          ¿Qué necesitás tener a mano?
        </h2>
        <ul className="space-y-6">
          {CHECKLIST_ITEMS.map((item, index) => (
            <li key={item.title} className="flex items-start gap-3 sm:gap-4">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-semibold leading-snug text-stone-900 sm:text-base">
                  {item.title}
                  {item.optional && (
                    <span className="ml-1.5 font-medium text-stone-500">
                      (opcional)
                    </span>
                  )}
                </p>
                {item.description && (
                  <p className="text-sm leading-relaxed text-stone-600 sm:text-[15px]">
                    {item.description}
                  </p>
                )}
                {item.notes && item.notes.length > 0 && (
                  <ul className="mt-2 space-y-1 border-l-2 border-amber-200/80 pl-3">
                    {item.notes.map((note) => (
                      <li
                        key={note}
                        className="text-sm leading-relaxed text-stone-500 sm:text-[15px]"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 flex items-center justify-center gap-2 text-sm text-stone-600 sm:mt-12 sm:text-base">
        <ClockIcon className="h-[18px] w-[18px] shrink-0 text-amber-600" />
        <span>Tiempo estimado: 5–10 minutos.</span>
      </p>

      <a
        href={MONDAY_PRESUPUESTO_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full rounded-xl bg-amber-500 px-8 py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-base"
      >
        COMPLETAR FORMULARIO
      </a>
    </main>
  );
}

export default function PresupuestoPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
          <p className="text-stone-500">Cargando…</p>
        </main>
      }
    >
      <PresupuestoIntroContent />
    </Suspense>
  );
}
