"use client";

import { useState } from "react";
import Link from "next/link";

export interface HomeFlipCardProps {
  title: string;
  /** Subtítulo que se muestra en el front de la tarjeta */
  subtitle: string;
  /** Texto descriptivo que se muestra en el dorso */
  body: string;
  /** Etiqueta del botón de acción en el dorso */
  ctaLabel: string;
  href: string;
  icon: React.ReactNode;
  /** Si se provee, al hacer click se llama en lugar de navegar (para transición) */
  onNavigate?: (href: string) => void;
}

export function HomeFlipCard({
  title,
  subtitle,
  body,
  ctaLabel,
  href,
  icon,
  onNavigate,
}: HomeFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="group h-[220px] w-full cursor-pointer [perspective:1000px] transition-transform duration-300 ease-out group-hover:-translate-y-1"
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-[600ms] [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(180deg)]"}`}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-6 py-8 shadow-sm transition-shadow [backface-visibility:hidden] group-hover:border-amber-200 group-hover:shadow-md"
          style={{ transform: "rotateY(0deg)" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            {icon}
          </div>
          <h3 className="text-center text-lg font-bold text-stone-800">{title}</h3>
          <p className="mt-1 max-w-xs text-center text-sm text-stone-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-8 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p
            className="mt-2 flex-1 text-center text-sm text-stone-700"
            style={{ lineHeight: 1.6 }}
          >
            {body}
          </p>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate(href)}
              tabIndex={flipped ? 0 : -1}
              className="home-card-button px-5 py-2.5 font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {ctaLabel}
            </button>
          ) : (
            <Link
              href={href}
              tabIndex={flipped ? 0 : -1}
              className="home-card-button inline-flex items-center justify-center px-5 py-2.5 font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
