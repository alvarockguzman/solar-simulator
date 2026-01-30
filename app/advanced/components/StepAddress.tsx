"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useWizard } from "../context/WizardContext";
import { WizardNav } from "./WizardNav";
import { searchAddress, reverseGeocode, type NominatimResult } from "../lib/geocode";

const MapAddress = dynamic(
  () => import("./MapAddress").then((m) => m.MapAddress),
  { ssr: false, loading: () => <div className="h-full w-full bg-stone-200 flex items-center justify-center rounded-r-xl">Cargando mapa…</div> }
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
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Dirección de la instalación</h2>
        <p className="mt-2 text-amber-100 text-sm">¿Dónde está tu empresa?</p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex flex-1 flex-col min-h-0 lg:flex-row">
        <div className="flex flex-col justify-center px-6 py-6 lg:py-8 lg:px-8 bg-white overflow-auto min-h-[240px] lg:min-h-0 shrink-0">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">
            Seleccioná la dirección de tu empresa
          </h3>
          <div ref={wrapperRef} className="relative max-w-md mb-4">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">Buscando…</span>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg max-h-48 overflow-y-auto"
                role="listbox"
              >
                {suggestions.map((item) => (
                  <li
                    key={item.place_id}
                    role="option"
                    tabIndex={0}
                    className="px-4 py-3 cursor-pointer hover:bg-amber-50 border-b border-stone-100 last:border-0 text-sm text-stone-800"
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
          <p className="text-sm text-stone-600 mb-4 max-w-md">
            Escribí o modificá la dirección; cuando estés listo apretá Siguiente. También podés elegir un punto directamente en el mapa.
          </p>
          {reverseLoading && <p className="text-sm text-amber-600 mb-2">Obteniendo dirección…</p>}
          <WizardNav onBack={onBack} onNext={onNext} canGoNext={canNext} />
        </div>
        <div className="flex-1 min-h-[280px] lg:min-h-0 lg:min-w-0">
          <MapAddress
            center={center}
            marker={coordinates}
            onMarkerChange={onMapClick}
            className="h-full min-h-[280px] lg:min-h-0"
          />
        </div>
      </div>
    </div>
  );
}
