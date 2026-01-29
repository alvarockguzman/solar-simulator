"use client";

import { useState } from "react";
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
      const message =
        err instanceof Error ? err.message : "No se pudo enviar. Revisa los datos o intenta más tarde.";
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

  const selectedProfileData = selectedProfile
    ? PROFILES.find((p) => p.id === selectedProfile)
    : null;
  const economics = selectedProfile ? ECONOMICS_BY_PROFILE[selectedProfile] : null;

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
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/90 py-4 backdrop-blur sm:py-6">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            Simulador Solar
          </h1>
          <p className="mt-1 text-stone-600">
            Beneficio económico de paneles solares para tu empresa
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* 1. Intro */}
        <section className="mb-12">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            Cómo funciona la calculadora
          </h2>
          <p className="text-stone-700 leading-relaxed">
            Elegí uno de los tres perfiles de instalación solar según el tipo de techo y el tamaño de tu proyecto. La calculadora te mostrará de inmediato los economics estimados: energía producida al año, ahorro en USD, años para recuperar la inversión y potencia instalada. Si querés más información o una propuesta a medida, completá el formulario y te contactamos.
          </p>
        </section>

        {/* 2. Perfiles */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-stone-900">
            Perfiles de instalación
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

        {/* 3. Economics */}
        {selectedProfile && economics && selectedProfileData && (
          <section className="mb-12">
            <EconomicsBlock
              economics={economics}
              profileName={selectedProfileData.shortName}
            />
          </section>
        )}

        {/* 4. Lead */}
        <section className="mb-12">
          <button
            type="button"
            onClick={() => setShowLeadForm(true)}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Quiero recibir más información
          </button>
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
