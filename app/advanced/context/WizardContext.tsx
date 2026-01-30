"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { TariffId } from "../lib/constants";
import { calculate, type CalculationResult } from "../lib/calculations";

export interface WizardState {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  surfaceM2: number;
  tariff: TariffId | null;
  consumptionKwhPerYear: number;
}

const initialState: WizardState = {
  address: "",
  coordinates: null,
  surfaceM2: 0,
  tariff: null,
  consumptionKwhPerYear: 0,
};

interface WizardContextValue extends WizardState {
  setAddress: (address: string, coords: { lat: number; lng: number } | null) => void;
  setSurfaceM2: (m2: number) => void;
  setTariff: (tariff: TariffId) => void;
  setConsumptionKwhPerYear: (kwh: number) => void;
  getResults: () => CalculationResult | null;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const setAddress = useCallback((address: string, coordinates: { lat: number; lng: number } | null) => {
    setState((s) => ({ ...s, address, coordinates }));
  }, []);

  const setSurfaceM2 = useCallback((surfaceM2: number) => {
    setState((s) => ({ ...s, surfaceM2 }));
  }, []);

  const setTariff = useCallback((tariff: TariffId) => {
    setState((s) => ({ ...s, tariff }));
  }, []);

  const setConsumptionKwhPerYear = useCallback((consumptionKwhPerYear: number) => {
    setState((s) => ({ ...s, consumptionKwhPerYear }));
  }, []);

  const getResults = useCallback((): CalculationResult | null => {
    if (
      state.surfaceM2 <= 0 ||
      !state.tariff ||
      state.consumptionKwhPerYear <= 0
    ) {
      return null;
    }
    return calculate({
      surfaceM2: state.surfaceM2,
      tariff: state.tariff,
      consumptionKwhPerYear: state.consumptionKwhPerYear,
    });
  }, [state.surfaceM2, state.tariff, state.consumptionKwhPerYear]);

  const value: WizardContextValue = {
    ...state,
    setAddress,
    setSurfaceM2,
    setTariff,
    setConsumptionKwhPerYear,
    getResults,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
