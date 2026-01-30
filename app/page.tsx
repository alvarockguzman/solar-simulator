"use client";

import { useState, useRef, useEffect } from "react";
import {
  PROFILES,
  ECONOMICS_BY_PROFILE,
  type ProfileId,
  type Profile,
  type Economics,
} from "./data/profiles";
import { RoofFlatIcon, RoofFlatLargeIcon, RoofSawIcon } from "./components/ProfileIcons";
import {
  EnergyIcon,
  SavingsIcon,
  ClockIcon,
  PowerIcon,
} from "./components/EconomicsIcons";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

function ProfileCard({
  profile,
  selected,
  onSelect,
}: {
  profile: Profile;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon =
    profile.icon === "roof-flat"
      ? RoofFlatIcon
      : profile.icon === "roof-flat-large"
        ? RoofFlatLargeIcon
        : RoofSawIcon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
        selected
          ? "border-amber-500 bg-amber-50 shadow-md"
          : "border-stone-200 bg-white hover:border-amber-300"
      }`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-semibold text-stone-900">{profile.name}</h3>
      <p className="mb-4 text-sm text-stone-600">{profile.description}</p>
      <p className="text-xs text-stone-500">
        Potencia: {profile.power} kWp · Superficie: {profile.surface} m²
      </p>
    </button>
  );
}

function EconomicsBlock({ economics, profileName }: { economics: Economics; profileName: string }) {
  const items = [
    {
      label: "Energía producida",
      value: `${formatNumber(economics.energyKwh)} kWh`,
      icon: EnergyIcon,
    },
    {
      label: "Ahorro",
      value: `USD ${formatNumber(economics.savingsUsd)}`,
      icon: SavingsIcon,
    },
    {
      label: "Recupero inversión",
      value: `${economics.paybackYears} años`,
      icon: ClockIcon,
    },
    {
      label: "Potencia instalada",
      value: `${economics.powerKwp} kWp`,
      icon: PowerIcon,
    },
  ];

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-stone-800">
        Economics · {profileName}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">{label}</p>
              <p className="font-semibold text-stone-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    title: "1. ¿Qué son los perfiles de instalación?",
    content:
      "Seleccionamos tres perfiles representativos basados en los proyectos solares más comunes en Argentina, combinando instalaciones medianas y grandes y distintos tipos de techo. La geometría del techo, plano o serrucho, influye en el rendimiento del sistema y por eso se modelan como escenarios distintos.",
  },
  {
    title: "2. ¿Cómo se calcula el ahorro anual?",
    content:
      "El ahorro refleja la energía que tu empresa deja de comprar a la distribuidora gracias a la generación solar y, en caso de excedentes, la energía que podría inyectarse a la red. El cálculo utiliza una tarifa eléctrica promedio para grandes usuarios como referencia.",
  },
  {
    title: "3. ¿Qué significa potencia instalada?",
    content:
      "La potencia instalada es la capacidad total del sistema solar fotovoltaico. Indica cuántos paneles se instalan y cuánta energía puede generar el sistema en condiciones estándar.",
  },
  {
    title: "4. ¿Qué es el recupero de la inversión?",
    content:
      "Es una estimación del tiempo necesario para recuperar la inversión realizada, comparando el ahorro anual generado por el sistema con el costo de la instalación. Se expresa en años y tiene carácter orientativo.",
  },
  {
    title: "5. ¿Qué representa la energía producida?",
    content:
      "Es la cantidad de energía que el sistema solar genera en un año. Esta energía puede utilizarse directamente en tus instalaciones o entregarse a la red pública, y se calcula en base a rendimientos promedio del mercado.",
  },
] as const;

function FaqCard({ title, content }: { title: string; content: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="group h-[140px] w-full cursor-pointer [perspective:800px]"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
      aria-label={title}
    >
      <div
        className={`relative h-full w-full transition-transform duration-300 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(180deg)]"}`}
      >
        {/* Front: título + icono */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 [backface-visibility:hidden]">
          <svg
            className="h-8 w-8 shrink-0 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="line-clamp-3 text-center text-sm font-medium text-stone-600">
            {title}
          </h3>
        </div>
        {/* Back: contenido */}
        <div className="absolute inset-0 rounded-xl border border-stone-200 bg-white px-4 py-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="h-full overflow-y-auto text-xs text-stone-600 leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

function CtaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
    >
      Quiero recibir más información
    </button>
  );
}

function LeadForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    apellido: string;
    empresa: string;
    mail: string;
    telefono: string;
  }) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [mail, setMail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await onSubmit({ nombre, apellido, empresa, mail, telefono });
      setSent(true);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "";
      const message =
        rawMessage === "Failed to fetch"
          ? "No se pudo conectar con el servidor. Revisá que estés corriendo la app en local (npm run dev) y que en .env.local tengas LEAD_FORM_URL con la URL de tu Google Apps Script."
          : rawMessage || "No se pudo enviar. Revisá los datos o intentá más tarde.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <p className="mb-4 text-lg font-medium text-stone-800">
          Gracias. Recibirás más información a la brevedad.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <h3 className="mb-4 text-xl font-semibold text-stone-900">
        Quiero recibir más información
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-stone-700">
            Nombre *
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label htmlFor="apellido" className="mb-1 block text-sm font-medium text-stone-700">
            Apellido *
          </label>
          <input
            id="apellido"
            type="text"
            required
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="empresa" className="mb-1 block text-sm font-medium text-stone-700">
          Empresa *
        </label>
        <input
          id="empresa"
          type="text"
          required
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="mail" className="mb-1 block text-sm font-medium text-stone-700">
          Mail *
        </label>
        <input
          id="mail"
          type="email"
          required
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-stone-700">
          Teléfono
        </label>
        <input
          id="telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileId | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const profilesSectionRef = useRef<HTMLElement>(null);
  const economicsSectionRef = useRef<HTMLElement>(null);

  const selectedProfileData = selectedProfile
    ? PROFILES.find((p) => p.id === selectedProfile)
    : null;
  const economics = selectedProfile ? ECONOMICS_BY_PROFILE[selectedProfile] : null;

  // Scroll suave a Economics cuando el usuario selecciona un perfil
  useEffect(() => {
    if (selectedProfile && economicsSectionRef.current) {
      economicsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedProfile]);

  const handleLeadSubmit = async (data: {
    nombre: string;
    apellido: string;
    empresa: string;
    mail: string;
    telefono: string;
  }) => {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Error al enviar");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:py-16">
        {/* Hero: ilustración izquierda, texto + CTA derecha */}
        <section className="relative mb-16 overflow-hidden rounded-2xl bg-white sm:mb-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            {/* Izquierda: ilustración isométrica paneles solares */}
            <div className="relative flex min-h-[220px] items-center justify-center sm:min-h-[280px] lg:min-h-[320px]">
              {/* Formas de fondo sutiles (estilo referencia) */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute -left-4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-sky-100/60 blur-2xl" />
                <div className="absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-amber-100/50 blur-xl" />
                <svg className="absolute inset-0 h-full w-full text-sky-200/40" aria-hidden>
                  <defs>
                    <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>
              </div>
              {/* SVG isométrico: grid 3x4 paneles solares + líneas de conexión */}
              <svg
                className="relative z-10 w-full max-w-sm sm:max-w-md"
                viewBox="0 0 360 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <defs>
                  <linearGradient id="panel-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                  <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <pattern id="cell-grid" width="6" height="6" patternUnits="userSpaceOnUse">
                    <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35" />
                  </pattern>
                </defs>
                {/* Líneas de conexión entre paneles (glow) */}
                <g stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" opacity="0.9" filter="url(#line-glow)">
                  {/* horizontales */}
                  <line x1="72" y1="58" x2="108" y2="72" />
                  <line x1="142" y1="72" x2="178" y2="86" />
                  <line x1="212" y1="86" x2="248" y2="100" />
                  <line x1="72" y1="98" x2="108" y2="112" />
                  <line x1="142" y1="112" x2="178" y2="126" />
                  <line x1="212" y1="126" x2="248" y2="140" />
                  <line x1="72" y1="138" x2="108" y2="152" />
                  <line x1="142" y1="152" x2="178" y2="166" />
                  <line x1="212" y1="166" x2="248" y2="180" />
                  {/* verticales */}
                  <line x1="108" y1="72" x2="72" y2="98" />
                  <line x1="178" y1="86" x2="142" y2="112" />
                  <line x1="248" y1="100" x2="212" y2="126" />
                  <line x1="108" y1="112" x2="72" y2="138" />
                  <line x1="178" y1="126" x2="142" y2="152" />
                  <line x1="248" y1="140" x2="212" y2="166" />
                </g>
                {/* Puntos de conexión (glow) */}
                <g fill="#bae6fd" filter="url(#line-glow)">
                  {[
                    [72, 58], [108, 72], [142, 72], [178, 86], [212, 86], [248, 100],
                    [72, 98], [108, 112], [142, 112], [178, 126], [212, 126], [248, 140],
                    [72, 138], [108, 152], [142, 152], [178, 166], [212, 166], [248, 180],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3.5" />
                  ))}
                </g>
                {/* 12 paneles: 4 columnas x 3 filas (paralelogramos isométricos) */}
                {[
                  [30, 35], [100, 48], [170, 61], [240, 74],
                  [30, 75], [100, 88], [170, 101], [240, 114],
                  [30, 115], [100, 128], [170, 141], [240, 154],
                ].map(([px, py], i) => (
                  <g key={i}>
                    <path
                      d={`M ${px} ${py} L ${px + 58} ${py + 29} L ${px + 58} ${py + 72} L ${px} ${py + 43} Z`}
                      fill="url(#panel-blue)"
                      stroke="#e0f2fe"
                      strokeWidth="2"
                    />
                    <path
                      d={`M ${px + 4} ${py + 5} L ${px + 54} ${py + 34} L ${px + 54} ${py + 67} L ${px + 4} ${py + 38} Z`}
                      fill="url(#panel-blue)"
                      fillOpacity="0.95"
                      stroke="none"
                    />
                    <path
                      d={`M ${px + 4} ${py + 5} L ${px + 54} ${py + 34} L ${px + 54} ${py + 67} L ${px + 4} ${py + 38} Z`}
                      fill="url(#cell-grid)"
                      opacity="0.5"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Derecha: título, explicación, CTA */}
            <div className="flex flex-col justify-center lg:py-4">
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Calculadora Solar
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
                Elegí entre tres perfiles de instalación solar y accedé a una estimación del ahorro económico, la energía producida y el plazo de recupero, utilizando parámetros típicos del mercado industrial.
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => profilesSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-lg bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
                >
                  Ver perfiles de instalación
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Perfiles */}
        <section ref={profilesSectionRef} className="mb-12" id="perfiles">
          <h2 className="mb-6 text-xl font-semibold text-stone-900">
            Seleccioná el perfil indicado para tu empresa
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {PROFILES.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                selected={selectedProfile === profile.id}
                onSelect={() => setSelectedProfile(profile.id)}
              />
            ))}
          </div>
        </section>

        {/* CTA: debajo de perfiles cuando no hay economics */}
        {!selectedProfile && (
          <section className="mb-12">
            <CtaButton onClick={() => setShowLeadForm(true)} />
          </section>
        )}

        {/* 3. Economics */}
        {selectedProfile && economics && selectedProfileData && (
          <>
            <section ref={economicsSectionRef} className="mb-12" id="economics">
              <h2 className="mb-4 text-xl font-semibold text-stone-900">
                Comprobá los resultados
              </h2>
              <EconomicsBlock
                economics={economics}
                profileName={selectedProfileData.shortName}
              />
            </section>
            {/* CTA: debajo de economics cuando aparecen */}
            <section className="mb-12">
              <p className="mb-4 text-stone-600">
                Dejanos tus datos para que un representante se contacte contigo para hacer un presupuesto a medida.
              </p>
              <CtaButton onClick={() => setShowLeadForm(true)} />
            </section>
          </>
        )}

        {/* 4. FAQs – más discretas, flip al hover */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-medium text-stone-600">
            FAQs – Aclaraciones rápidas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FAQ_ITEMS.map((item) => (
              <FaqCard key={item.title} title={item.title} content={item.content} />
            ))}
          </div>
        </section>
      </main>

      {/* Modal formulario */}
      {showLeadForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-form-title"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <LeadForm
              onClose={() => setShowLeadForm(false)}
              onSubmit={handleLeadSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
