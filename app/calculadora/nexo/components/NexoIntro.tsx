"use client";

const CARDS = [
  {
    key: "actividades",
    title: "Energía para industrias, comercios y agro",
    text: "Proyectos de energía adaptados a las necesidades de cada actividad y empresa.",
  },
  {
    key: "medida",
    title: "Soluciones a medida",
    text: "Analizamos el consumo y las instalaciones para definir la solución más adecuada para cada cliente.",
  },
  {
    key: "ingenieria",
    title: "De la ingeniería a la puesta en marcha",
    text: "Un equipo de ingenieros acompaña cada etapa del proyecto, con un único responsable técnico.",
  },
] as const;

export function NexoIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      <section className="relative isolate min-h-[28rem] overflow-hidden sm:min-h-[32rem]">
        <img
          src="/brand/nexo/portada.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgb(3 12 78 / 0.85) 0%, rgb(3 12 78 / 0.55) 48%, rgb(3 12 78 / 0) 100%)",
          }}
        />
        <div className="relative flex min-h-[28rem] max-w-3xl flex-col justify-center px-4 py-10 sm:min-h-[32rem] sm:px-8 sm:py-14">
          <h1 className="w-fit border-b-[3px] border-brand-accent pb-3 text-[2.75rem] font-bold leading-[1.05] text-white sm:whitespace-nowrap sm:text-6xl">
            Calculadora solar
          </h1>
          <p className="mt-5 text-[2rem] font-bold leading-[1.15] sm:text-5xl">
            <span className="block text-white">Menos costos.</span>
            <span className="block text-[#7CC142]">Más autonomía.</span>
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/90">
            Calculá en 2 minutos cuánto puede ahorrar tu empresa en su factura eléctrica con energía solar.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-6 inline-flex w-fit items-center rounded-full bg-brand-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#030C4E]"
          >
            Calcular mi ahorro
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 sm:py-10">
        {CARDS.map((card) => (
          <article
            key={card.key}
            className="rounded-[20px] bg-brand-accent px-5 py-6 text-white"
          >
            <h2 className="text-base font-bold leading-snug">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/95">{card.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
