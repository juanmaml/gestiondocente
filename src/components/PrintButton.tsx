"use client";

import { useEffect } from "react";
import { PrinterIcon } from "./icons";

/**
 * Botón de imprimir. Mientras dura la impresión se retira la clase `dark`
 * para que el papel salga siempre en tema claro (también con Ctrl+P).
 */
export function PrintButton() {
  useEffect(() => {
    let wasDark = false;
    function before() {
      wasDark = document.documentElement.classList.contains("dark");
      document.documentElement.classList.remove("dark");
    }
    function after() {
      if (wasDark) document.documentElement.classList.add("dark");
    }
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary print:hidden"
    >
      <PrinterIcon /> Imprimir
    </button>
  );
}
