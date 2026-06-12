"use client";

import { useEffect, useRef } from "react";

/**
 * Marcador invisible que desplaza la vista hasta su posición al montarse o
 * cuando cambia `watch` (p. ej. el id del detalle abierto bajo una tabla).
 * Respeta prefers-reduced-motion: sin animación si el usuario la rechaza.
 */
export function ScrollIntoView({ watch }: { watch?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    ref.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [watch]);
  return <div ref={ref} aria-hidden="true" className="scroll-mt-6" />;
}
