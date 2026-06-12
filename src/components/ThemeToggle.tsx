"use client";

import { useEffect, useState } from "react";

/**
 * Conmutador claro/oscuro. El tema se aplica con la clase `dark` en <html>
 * (las variables de color se redefinen en globals.css) y se recuerda en
 * localStorage; un script en el layout raíz lo aplica antes del primer pintado.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Sin almacenamiento disponible: el tema no se persiste.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost w-full justify-start px-2 text-sm text-gray-500"
      aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
      {dark == null ? "Tema" : dark ? "Tema claro" : "Tema oscuro"}
    </button>
  );
}
