"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

interface PendingState {
  active: boolean;
  title: string;
  subtitle?: string;
}

interface CotizadorPendingContextValue {
  pending: PendingState;
  startPending: (title: string, subtitle?: string) => void;
  clearPending: () => void;
}

const idle: PendingState = { active: false, title: "" };

const CotizadorPendingContext = createContext<CotizadorPendingContextValue | null>(null);

export function CotizadorPendingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState>(idle);

  const startPending = useCallback((title: string, subtitle?: string) => {
    setPending({ active: true, title, subtitle });
  }, []);

  const clearPending = useCallback(() => {
    setPending(idle);
  }, []);

  const value = useMemo(
    () => ({ pending, startPending, clearPending }),
    [pending, startPending, clearPending]
  );

  return (
    <CotizadorPendingContext.Provider value={value}>{children}</CotizadorPendingContext.Provider>
  );
}

export function useCotizadorPending() {
  const ctx = useContext(CotizadorPendingContext);
  if (!ctx) {
    throw new Error("useCotizadorPending debe usarse dentro de CotizadorPendingProvider");
  }
  return ctx;
}

type CotizadorNavLinkProps = ComponentProps<typeof Link> & {
  pendingTitle: string;
  pendingSubtitle?: string;
};

/** Link con feedback inmediato al hacer clic (antes de que Next termine la navegación). */
export function CotizadorNavLink({
  pendingTitle,
  pendingSubtitle,
  onClick,
  ...props
}: CotizadorNavLinkProps) {
  const { startPending } = useCotizadorPending();

  return (
    <Link
      {...props}
      onClick={(e) => {
        startPending(pendingTitle, pendingSubtitle);
        onClick?.(e);
      }}
    />
  );
}
