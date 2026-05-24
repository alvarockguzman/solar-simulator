"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useWizard } from "../context/WizardContext";
import { WizardNav } from "./WizardNav";
import { MapStepLayout, MAP_MIN_HEIGHT_CLASS } from "./MapStepLayout";
import { searchAddress, reverseGeocode, type NominatimResult } from "../lib/geocode";

const MapAddress = dynamic(
  () => import("./MapAddress").then((m) => m.MapAddress),
  {
    ssr: false,
    loading: () => (
      <div
        className={`flex h-full w-full items-center justify-center bg-stone-200 lg:rounded-r-xl ${MAP_MIN_HEIGHT_CLASS}`}
      >
        Cargando mapa…
      </div>
    ),
  }
);

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

interface StepAddressProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
}

export function StepAddress({ stepIndex, onBack, onNext }: StepAddressProps) {
  const { address, coordinates, setAddress } = useWizard();
  const [inputValue, setInputValue] = useState(address);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(address);
  }, [address]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    searchAddress(q)
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 350);
    setShowSuggestions(true);
  };

  const onSelectSuggestion = (item: NominatimResult) => {
    setInputValue(item.display_name);
    setAddress(item.display_name, { lat: Number(item.lat), lng: Number(item.lon) });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const onMapClick = useCallback(
    async (lat: number, lng: number) => {
      setReverseLoading(true);
      try {
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, { lat, lng });
        if (addr) setInputValue(addr);
      } finally {
        setReverseLoading(false);
      }
    },
    [setAddress]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canNext = address.trim() !== "" && coordinates !== null;
  const center = coordinates ?? DEFAULT_CENTER;

  return (
    <MapStepLayout
      stepIndex={stepIndex}
      title="Dirección de la instalación"
      subtitle="¿Dónde está tu empresa?"
      controls={
        <>
          <h3 className="mb-3 text-lg font-semibold text-stone-800">
            Seleccioná la dirección de tu empresa
          </h3>
          <div ref={wrapperRef} className="relative mb-3 max-w-md">
            <input
              type="text"
              value={inputValue}
              onChange={onInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Escribí la dirección..."
              className="w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              aria-label="Dirección"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                Buscando…
              </span>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg"
                role="listbox"
              >
                {suggestions.map((item) => (
                  <li
                    key={item.place_id}
                    role="option"
                    tabIndex={0}
                    className="cursor-pointer border-b border-stone-100 px-4 py-3 text-sm text-stone-800 last:border-0 hover:bg-amber-50"
                    onClick={() => onSelectSuggestion(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelectSuggestion(item);
                    }}
                  >
                    {item.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {reverseLoading && (
            <p className="mb-2 text-sm text-amber-600">Obteniendo dirección…</p>
          )}
          <WizardNav onBack={onBack} onNext={onNext} canGoNext={canNext} />
          <p className="mt-3 max-w-md text-sm text-stone-600">
            Escribí o modificá la dirección; cuando estés listo apretá Siguiente. También podés
            elegir un punto directamente en el mapa.
          </p>
        </>
      }
      map={
        <MapAddress
          center={center}
          marker={coordinates}
          onMarkerChange={onMapClick}
          className={`h-full w-full ${MAP_MIN_HEIGHT_CLASS}`}
        />
      }
    />
  );
}
