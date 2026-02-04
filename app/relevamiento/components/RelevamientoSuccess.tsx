"use client";

const WHATSAPP_NUMBER = "34685567446";
const WHATSAPP_MESSAGE = "Hola Renovatio, acabo de completar el relevamiento para mi instalación solar y me gustaría dar seguimiento a mi propuesta.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function RelevamientoSuccess() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-md mx-auto text-center">
        <div className="mb-6 [animation:relevamiento-check-in_0.5s_ease-out]">
          <svg
            className="w-20 h-20 sm:w-24 sm:h-24 text-green-500 mx-auto drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
          ¡Relevamiento recibido!
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8">
          Tu información ha sido enviada correctamente. Nuestro equipo de ingeniería revisará los datos y las fotos del tablero para preparar tu propuesta a medida a la brevedad.
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:max-w-sm min-w-0 rounded-xl px-6 py-4 font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Contactar vía WhatsApp
        </a>

        <a
          href="/"
          className="mt-6 text-sm text-stone-500 hover:text-stone-700 hover:underline"
        >
          Volver al inicio de la web
        </a>
      </div>
    </div>
  );
}
