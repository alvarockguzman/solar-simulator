"use client";

import { Loader2 } from "lucide-react";

export function CotizadorPageLoader({
  title,
  subtitle,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {subtitle && <p className="max-w-xs text-center text-xs text-slate-500">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
      <div
        className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-xl"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-12 w-12 animate-spin text-amber-600" aria-hidden />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
