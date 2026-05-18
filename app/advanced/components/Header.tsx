import Link from "next/link";
import {
  RenovatioLogo,
  RenovatioTagline,
} from "../../components/brand/RenovatioLogo";

const WHATSAPP_ADVISOR_URL =
  "https://wa.me/5491123969892?text=" +
  encodeURIComponent(
    "Hola, vengo de la web y quiero contactar con un asesor!"
  );

export function Header() {
  return (
    <header className="flex h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-200/80 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
      >
        <RenovatioLogo className="shrink-0" />
        <RenovatioTagline />
      </Link>
      <a
        href={WHATSAPP_ADVISOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-brand-navy underline decoration-brand-navy/30 underline-offset-2 transition-colors hover:text-brand-orange hover:decoration-brand-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 rounded-sm"
      >
        Contactar a una asesor
      </a>
    </header>
  );
}
