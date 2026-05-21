"use client";

import Image from "next/image";

export interface LandingFeatureCardProps {
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  /** Desktop: texto abajo a la izquierda o derecha; mobile siempre izquierda */
  align: "left" | "right";
  onNavigate?: (href: string) => void;
}

function ChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function LandingFeatureCard({
  title,
  body,
  ctaLabel,
  href,
  imageSrc,
  imageAlt,
  align,
  onNavigate,
}: LandingFeatureCardProps) {
  const contentAlign =
    align === "right"
      ? "items-start text-left md:items-end md:text-right md:ml-auto"
      : "items-start text-left";

  const ctaClass =
    "landing-cta inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-6 sm:py-3.5 sm:text-base";

  return (
    <article className="relative min-h-[min(420px,72vh)] w-full overflow-hidden rounded-3xl sm:min-h-[min(560px,78vh)] lg:min-h-[82vh]">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15"
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 lg:p-12">
        <div className={`flex max-w-xl flex-col gap-4 sm:gap-5 ${contentAlign}`}>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {title}
          </h2>
          <p className="max-w-sm text-sm leading-snug text-white/85 text-balance sm:max-w-md sm:text-base sm:leading-snug">
            {body}
          </p>
          {onNavigate ? (
            <button type="button" onClick={() => onNavigate(href)} className={ctaClass}>
              {ctaLabel}
              <ChevronRight />
            </button>
          ) : (
            <a href={href} className={ctaClass}>
              {ctaLabel}
              <ChevronRight />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
