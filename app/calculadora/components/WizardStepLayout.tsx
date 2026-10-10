"use client";

import type { ReactNode } from "react";
import { useBrand } from "@/app/lib/BrandContext";
import { WIZARD_BANNER_SLOT_CLASS, WIZARD_CONTENT_PANEL_CLASS } from "./wizardStepStyles";

/**
 * Un solo árbol: banner arriba (mobile) o a la izquierda (lg+), contenido al lado / debajo.
 * El reflow lo resuelve flex; no hay markup duplicado por breakpoint.
 */
export function WizardStepLayout({
  banner,
  children,
  className = "",
}: {
  banner: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  if (useBrand().id === "nexo") {
    return (
      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto bg-white ${className}`}>
        <div className="shrink-0 border-b border-brand-line bg-white">{banner}</div>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col lg:flex-row ${className}`}>
      <div className={WIZARD_BANNER_SLOT_CLASS}>{banner}</div>
      <div className={WIZARD_CONTENT_PANEL_CLASS}>{children}</div>
    </div>
  );
}
