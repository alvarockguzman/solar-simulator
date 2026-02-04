"use client";

import { useState } from "react";
import Link from "next/link";

export interface HomeFlipCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  /** Si se provee, al hacer click se llama en lugar de navegar (para transición) */
  onNavigate?: (href: string) => void;
}

export function HomeFlipCard({ title, description, href, icon, onNavigate }: HomeFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="group h-[220px] w-full [perspective:1000px]"
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-[400ms] [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(180deg)]"}`}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-stone-200 bg-white px-6 py-8 shadow-sm transition-shadow [backface-visibility:hidden] group-hover:border-amber-200 group-hover:shadow-md"
          style={{ transform: "rotateY(0deg)" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            {icon}
          </div>
          <h3 className="text-center text-lg font-semibold text-stone-800">{title}</h3>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-8 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="text-center text-sm leading-relaxed text-stone-600">
            {description}
          </p>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate(href)}
              tabIndex={flipped ? 0 : -1}
              className="rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Ir a la aplicación
            </button>
          ) : (
            <Link
              href={href}
              tabIndex={flipped ? 0 : -1}
              className="rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Ir a la aplicación
            </Link>
          )}
        </div>
      </div>

      {/* Tap-to-flip on mobile; when flipped, no pointer events so the Link on the back is clickable */}
      <button
        type="button"
        className={`absolute inset-0 rounded-2xl ${flipped ? "pointer-events-none" : ""}`}
        aria-label={flipped ? undefined : `Ver más sobre ${title}`}
        onClick={(e) => {
          if (flipped) return;
          e.preventDefault();
          setFlipped(true);
        }}
        onKeyDown={(e) => {
          if (flipped) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped(true);
          }
        }}
      />
    </div>
  );
}
