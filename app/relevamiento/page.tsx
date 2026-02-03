"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function RelevamientoHomeContent() {
  const searchParams = useSearchParams();
  const enviado = searchParams.get("enviado") === "1";

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto">
      {enviado && (
        <div className="mb-6 w-full rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm text-center">
          Relevamiento enviado correctamente. Nuestro equipo lo revisará a la brevedad.
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center">
        Tu Ingeniería Solar comienza aquí
      </h1>
      <p className="mt-4 text-stone-600 text-center text-sm sm:text-base">
        Usa tu móvil para capturar los datos técnicos. Nuestros ingenieros
        diseñarán el sistema exacto para tu techo, garantizando el máximo
        ahorro.
      </p>

      <div className="mt-8 w-full">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">
          ¿Qué necesitas tener a mano?
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-stone-600 text-sm">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span><strong className="text-stone-700">Tu última factura de electricidad:</strong> Para analizar tu consumo histórico.</span>
          </li>
          <li className="flex items-start gap-3 text-stone-600 text-sm">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span><strong className="text-stone-700">Acceso al techo o superficie:</strong> Donde se realizará la potencial instalación.</span>
          </li>
          <li className="flex items-start gap-3 text-stone-600 text-sm">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span><strong className="text-stone-700">Acceso al tablero eléctrico:</strong> Asegúrate de tener una linterna si el sector está oscuro.</span>
          </li>
          <li className="flex items-start gap-3 text-stone-600 text-sm">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span><strong className="text-stone-700">Estar en la propiedad:</strong> Es necesario realizar el relevamiento in-situ.</span>
          </li>
        </ul>
      </div>

      <p className="mt-6 flex items-center gap-2 text-stone-600 text-sm">
        <span aria-hidden className="text-lg">
          ⏳
        </span>
        Completarás esto en 5-7 minutos.
      </p>

      <Link
        href="/relevamiento/wizard"
        className="mt-8 w-full sm:w-auto rounded-xl bg-amber-500 px-8 py-4 font-semibold text-white shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-center"
      >
        COMENZAR RELEVAMIENTO
      </Link>
    </main>
  );
}

export default function RelevamientoHomePage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto">
        <p className="text-stone-500">Cargando…</p>
      </main>
    }>
      <RelevamientoHomeContent />
    </Suspense>
  );
}
