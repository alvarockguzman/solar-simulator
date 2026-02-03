"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type SurfacePoint = [number, number];

export type MaterialTecho = "Chapa" | "Teja" | "Losa" | "Suelo";
export type Cableado = "Exterior" | "Interior" | "Zanjas";
export type DistanciaTablero = "< 10m" | "10-25m" | "> 25m";

export interface RelevamientoState {
  address: string;
  polygon: SurfacePoint[];
  center: { lat: number; lng: number } | null;
  surfaceM2: number;
  city: string | null;
  facturaFile: File | null;
  facturaPreview: string | null;
  material: MaterialTecho | null;
  fotoTechoFile: File | null;
  fotoTechoPreview: string | null;
  fotoObstaculosFile: File | null;
  fotoObstaculosPreview: string | null;
  fotoTableroFile: File | null;
  fotoTableroPreview: string | null;
  cableado: Cableado | null;
  distanciaTablero: DistanciaTablero | null;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  telefono: string;
}

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

const initialState: RelevamientoState = {
  address: "",
  polygon: [],
  center: null,
  surfaceM2: 0,
  city: null,
  facturaFile: null,
  facturaPreview: null,
  material: null,
  fotoTechoFile: null,
  fotoTechoPreview: null,
  fotoObstaculosFile: null,
  fotoObstaculosPreview: null,
  fotoTableroFile: null,
  fotoTableroPreview: null,
  cableado: null,
  distanciaTablero: null,
  nombre: "",
  apellido: "",
  empresa: "",
  email: "",
  telefono: "",
};

interface RelevamientoContextValue extends RelevamientoState {
  setAddress: (address: string, center: { lat: number; lng: number }) => void;
  setAddressOnly: (address: string) => void;
  setMapData: (polygon: SurfacePoint[], center: { lat: number; lng: number }, surfaceM2: number, city?: string | null) => void;
  setFactura: (file: File | null, preview: string | null) => void;
  setMaterial: (material: MaterialTecho) => void;
  setFotoTecho: (file: File | null, preview: string | null) => void;
  setFotoObstaculos: (file: File | null, preview: string | null) => void;
  setFotoTablero: (file: File | null, preview: string | null) => void;
  setConexion: (cableado: Cableado, distanciaTablero: DistanciaTablero) => void;
  setContacto: (data: { nombre: string; apellido: string; empresa: string; email: string; telefono: string }) => void;
  submit: (contactOverride?: { nombre: string; apellido: string; empresa: string; email: string; telefono: string }) => Promise<{ id?: string; error?: string }>;
}

const RelevamientoContext = createContext<RelevamientoContextValue | null>(null);

export function RelevamientoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RelevamientoState>(initialState);

  const setAddress = useCallback((address: string, center: { lat: number; lng: number }) => {
    setState((s) => ({ ...s, address, center }));
  }, []);

  const setAddressOnly = useCallback((address: string) => {
    setState((s) => ({ ...s, address }));
  }, []);

  const setMapData = useCallback(
    (polygon: SurfacePoint[], center: { lat: number; lng: number }, surfaceM2: number, city?: string | null) => {
      setState((s) => ({ ...s, polygon, center, surfaceM2, city: city ?? s.city }));
    },
    []
  );

  const setFactura = useCallback((file: File | null, preview: string | null) => {
    setState((s) => ({ ...s, facturaFile: file, facturaPreview: preview }));
  }, []);

  const setMaterial = useCallback((material: MaterialTecho) => {
    setState((s) => ({ ...s, material }));
  }, []);

  const setFotoTecho = useCallback((file: File | null, preview: string | null) => {
    setState((s) => ({ ...s, fotoTechoFile: file, fotoTechoPreview: preview }));
  }, []);

  const setFotoObstaculos = useCallback((file: File | null, preview: string | null) => {
    setState((s) => ({ ...s, fotoObstaculosFile: file, fotoObstaculosPreview: preview }));
  }, []);

  const setFotoTablero = useCallback((file: File | null, preview: string | null) => {
    setState((s) => ({ ...s, fotoTableroFile: file, fotoTableroPreview: preview }));
  }, []);

  const setConexion = useCallback((cableado: Cableado, distanciaTablero: DistanciaTablero) => {
    setState((s) => ({ ...s, cableado, distanciaTablero }));
  }, []);

  const setContacto = useCallback(
    (data: { nombre: string; apellido: string; empresa: string; email: string; telefono: string }) => {
      setState((s) => ({ ...s, ...data }));
    },
    []
  );

  const submit = useCallback(
    async (contactOverride?: { nombre: string; apellido: string; empresa: string; email: string; telefono: string }): Promise<{ id?: string; error?: string }> => {
      const contact = contactOverride ?? { nombre: state.nombre, apellido: state.apellido, empresa: state.empresa, email: state.email, telefono: state.telefono };
      const uploadFile = async (file: File | null): Promise<string> => {
        if (!file) return "";
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/relevamiento/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Error subiendo archivo");
        const data = await res.json();
        return data.url ?? "";
      };

      try {
        const [facturaUrl, fotoTechoUrl, fotoObstaculosUrl, fotoTableroUrl] = await Promise.all([
          uploadFile(state.facturaFile),
          uploadFile(state.fotoTechoFile),
          uploadFile(state.fotoObstaculosFile),
          uploadFile(state.fotoTableroFile),
        ]);

        const body = {
          address: state.address,
          polygon: state.polygon,
          center: state.center ?? DEFAULT_CENTER,
          surfaceM2: state.surfaceM2,
          city: state.city,
          facturaUrl,
          material: state.material ?? "Chapa",
          fotoTechoUrl,
          fotoObstaculosUrl,
          fotoTableroUrl,
          cableado: state.cableado ?? "Exterior",
          distanciaTablero: state.distanciaTablero ?? "< 10m",
          ...contact,
        };

      const res = await fetch("/api/relevamiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Error al enviar" };
      return { id: data.id };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Error de conexión" };
    }
  }, [state]);

  const value: RelevamientoContextValue = {
    ...state,
    setAddress,
    setAddressOnly,
    setMapData,
    setFactura,
    setMaterial,
    setFotoTecho,
    setFotoObstaculos,
    setFotoTablero,
    setConexion,
    setContacto,
    submit,
  };

  return (
    <RelevamientoContext.Provider value={value}>
      {children}
    </RelevamientoContext.Provider>
  );
}

export function useRelevamiento() {
  const ctx = useContext(RelevamientoContext);
  if (!ctx) throw new Error("useRelevamiento must be used within RelevamientoProvider");
  return ctx;
}
