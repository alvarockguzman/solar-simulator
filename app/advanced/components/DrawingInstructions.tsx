import { CheckCircle2, Lasso, MousePointerClick } from "lucide-react";

const STEPS = [
  {
    Icon: MousePointerClick,
    text: "1. Hacé click en cada esquina del techo o terreno disponible.",
  },
  {
    Icon: Lasso,
    text: "2. Marcá al menos 4 puntos para cerrar el polígono.",
  },
  {
    Icon: CheckCircle2,
    text: '3. Cuando termines, hacé click en "Confirmar área".',
  },
] as const;

export function DrawingInstructions() {
  return (
    <ul className="space-y-3 text-sm text-stone-700" aria-label="Instrucciones para dibujar el área">
      {STEPS.map(({ Icon, text }) => (
        <li key={text} className="flex gap-2.5">
          <Icon
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-600"
            strokeWidth={2}
            aria-hidden
          />
          <span className="leading-snug">{text}</span>
        </li>
      ))}
    </ul>
  );
}
