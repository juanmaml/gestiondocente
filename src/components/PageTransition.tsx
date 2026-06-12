"use client";

import { usePathname } from "next/navigation";

/**
 * Hace que el contenido entre con un fundido suave al cambiar de ruta.
 * La key por pathname reinicia la animación en cada navegación (los cambios
 * de query string, como las pestañas de una clase, no la relanzan).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
