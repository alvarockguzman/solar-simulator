import type { ReactNode } from "react";
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
  return (
    <div className={`flex min-h-0 flex-1 flex-col lg:flex-row ${className}`}>
      <div className={WIZARD_BANNER_SLOT_CLASS}>{banner}</div>
      <div className={WIZARD_CONTENT_PANEL_CLASS}>{children}</div>
    </div>
  );
}
