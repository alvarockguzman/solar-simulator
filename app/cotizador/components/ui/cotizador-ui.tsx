"use client";

import type { ReactNode } from "react";
export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

export function inputClsEmpty(value: string | number | null | undefined): string {
  const empty = value === "" || value === null || value === undefined;
  return `${inputCls}${empty ? " bg-slate-50" : ""}`;
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-0.5 ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
              active
                ? "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function BtnPrimary({
  children,
  disabled,
  onClick,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export const selectCls = `${inputCls} cursor-pointer`;

export function PresetCards<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label?: string;
  options: { id: T; title: string; subtitle: string }[];
  selected: T | null;
  onSelect: (id: T) => void;
}) {
  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-amber-600 bg-amber-50 shadow-sm ring-2 ring-amber-500/25"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <p
                className={`text-sm font-semibold ${active ? "text-amber-800" : "text-slate-800"}`}
              >
                {opt.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{opt.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ValidationHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      {children}
    </p>
  );
}

export function KeyboardHint() {
  return (
    <p className="text-center text-[11px] text-slate-400">
      <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
        Ctrl
      </kbd>
      +
      <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
        Enter
      </kbd>{" "}
      para continuar
    </p>
  );
}

export function BtnSecondary({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
