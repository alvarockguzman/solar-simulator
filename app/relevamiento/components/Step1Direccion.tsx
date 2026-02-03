"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRelevamiento } from "../context/RelevamientoContext";
import { searchAddress, reverseGeocode, type NominatimResult } from "../lib/geocode";

const MapaDireccion = dynamic(
  () => import("./MapaDireccion").then((m) => m.MapaDireccion),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[240px] bg-stone-200 rounded-xl flex items-center justify-center">
        Cargando mapa…
      </div>
    ),
  }
);

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

interface Step1DireccionProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step1Direccion({ onBack, onNext }: Step1DireccionProps) {
  const { address, center, setAddress } = useRelevamiento();
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

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setReverseLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, { lat, lng });
          if (addr) setInputValue(addr);
        } finally {
          setReverseLoading(false);
        }
      },
      () => setReverseLoading(false)
    );
  }, [setAddress]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canNext = address.trim() !== "" && center !== null;
  const mapCenter = center ?? DEFAULT_CENTER;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-stone-800">Ubicación de la propiedad</h2>
        <p className="text-stone-600 text-sm">Escribí la dirección o tocá en el mapa para marcar el punto.</p>

        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
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

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white shadow-md hover:bg-amber-600 flex items-center justify-center gap-2"
          aria-label="Utilizar ubicación actual del dispositivo"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Utilizar ubicación actual
        </button>

        {reverseLoading && <p className="text-sm text-amber-600">Obteniendo dirección…</p>}

        {address && (
          <div className="rounded-xl border border-stone-200 bg-amber-50/80 px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Dirección seleccionada</p>
            <p className="text-stone-800 font-medium break-words">{address}</p>
          </div>
        )}

        <div className="w-full h-[280px] rounded-xl overflow-hidden border border-stone-200">
          <MapaDireccion
            center={mapCenter}
            marker={center}
            onMarkerChange={onMapClick}
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-stone-200 bg-white flex flex-wrap gap-3 justify-center">
        <Link
          href="/relevamiento"
          className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-600 hover:bg-stone-50"
        >
          Salir
        </Link>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
