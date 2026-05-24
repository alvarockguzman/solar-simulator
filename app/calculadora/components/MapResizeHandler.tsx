"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Recalcula tiles y escala cuando el contenedor cambia de tamaño (mobile/desktop). */
export function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    invalidate();
    const t1 = window.setTimeout(invalidate, 100);
    const t2 = window.setTimeout(invalidate, 400);

    const parent = map.getContainer().parentElement;
    let observer: ResizeObserver | undefined;
    if (parent && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(invalidate);
      observer.observe(parent);
    }

    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer?.disconnect();
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
    };
  }, [map]);

  return null;
}
