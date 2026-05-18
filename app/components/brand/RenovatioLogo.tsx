/** Colores del wordmark en www.renovatio.lat */
export const RENOVATIO_TITLE_COLOR = "#343A40";
export const RENOVATIO_TAGLINE_COLOR = "#E67E22";

interface BrandTextProps {
  className?: string;
  variant?: "compact" | "hero";
  /** `inverse`: texto claro sobre fondos oscuros (p. ej. footer). */
  theme?: "default" | "inverse";
}

/**
 * Wordmark "Renovatio" — mismo estilo que la landing (renovatio.lat).
 */
export function RenovatioLogo({
  className = "",
  variant = "compact",
  theme = "default",
}: BrandTextProps) {
  const sizeClass =
    variant === "hero"
      ? "text-4xl sm:text-5xl lg:text-6xl"
      : "text-xl sm:text-2xl";

  return (
    <span
      className={`font-bold tracking-tight ${sizeClass} ${theme === "inverse" ? "text-white" : ""} ${className}`}
      style={theme === "default" ? { color: RENOVATIO_TITLE_COLOR } : undefined}
    >
      Renovatio
    </span>
  );
}

/**
 * Tagline "Cuidamos tu energía" — mismo estilo que la landing.
 */
export function RenovatioTagline({
  className = "",
  variant = "compact",
  theme = "default",
}: BrandTextProps) {
  const sizeClass =
    variant === "hero"
      ? "text-xl font-medium sm:text-2xl"
      : "text-sm font-medium";

  return (
    <span
      className={`${sizeClass} ${theme === "inverse" ? "text-white/80" : ""} ${className}`}
      style={theme === "default" ? { color: RENOVATIO_TAGLINE_COLOR } : undefined}
    >
      Cuidamos tu energía
    </span>
  );
}
