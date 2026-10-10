"use client";

import { createContext, useContext, type ReactNode } from "react";
import { brands, type BrandConfig, type BrandId } from "./brands";

const BrandContext = createContext<BrandConfig | null>(null);

export function BrandProvider({
  id,
  children,
}: {
  id: BrandId;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brands[id]}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error("useBrand debe usarse dentro de BrandProvider");
  }
  return brand;
}
