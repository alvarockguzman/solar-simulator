"use client";

import { useBrand } from "@/app/lib/BrandContext";

/** Estilos compartidos de botones del wizard (mismos en todos los breakpoints). */
export const wizardBtnSecondary =
  "rounded-xl border-2 border-brand-accent-dark bg-white px-6 py-3 text-sm font-semibold text-brand-accent-deep transition-colors hover:bg-brand-accent-wash focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const wizardBtnPrimary =
  "rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-accent-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Pastilla verde / outline navy. Solo se aplican en la ruta Nexo. */
export const nexoBtnPrimary =
  "inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-accent-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const nexoBtnSecondary =
  "inline-flex items-center justify-center rounded-full border-2 border-brand-primary bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-blue-050 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function useWizardButtons() {
  const isNexo = useBrand().id === "nexo";
  if (isNexo) return { primary: nexoBtnPrimary, secondary: nexoBtnSecondary };
  return { primary: wizardBtnPrimary, secondary: wizardBtnSecondary };
}

/** Fuera de Nexo se conserva la clase actual. En Nexo el título es navy y peso 700. */
export function stepTitleClass(isNexo: boolean, extra = ""): string {
  const base = isNexo
    ? "text-lg font-bold text-brand-primary"
    : "text-lg font-semibold text-brand-ink-soft";
  return extra ? `${extra} ${base}` : base;
}
