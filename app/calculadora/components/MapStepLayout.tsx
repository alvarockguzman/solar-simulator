import type { ReactNode } from "react";
import { WizardStepBanner } from "./WizardStepBanner";
import { WIZARD_BANNER_SLOT_CLASS } from "./wizardStepStyles";

/** Altura mínima del mapa cuando va debajo de los controles (mobile / panel estrecho). */
export const MAP_MIN_HEIGHT_CLASS = "min-h-[min(40dvh,360px)] lg:min-h-0";

/**
 * Pasos con mapa — un solo árbol:
 * - mobile: banner → controles → mapa
 * - desktop: banner lateral | (controles | mapa)
 */
export function MapStepLayout({
  title,
  subtitle,
  stepIndex,
  controls,
  map,
}: {
  title: string;
  subtitle: string;
  stepIndex: number;
  controls: ReactNode;
  map: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className={WIZARD_BANNER_SLOT_CLASS}>
        <WizardStepBanner stepIndex={stepIndex} title={title} subtitle={subtitle} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="shrink-0 border-b border-stone-100 bg-white px-4 py-4 sm:px-6 lg:flex lg:min-w-[360px] lg:max-w-md lg:flex-1 lg:flex-col lg:justify-center lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
          {controls}
        </div>
        <div className={`relative flex min-h-0 flex-1 ${MAP_MIN_HEIGHT_CLASS}`}>{map}</div>
      </div>
    </div>
  );
}
