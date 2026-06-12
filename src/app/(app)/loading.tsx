/**
 * Esqueleto de carga al navegar entre páginas: conserva la estructura
 * percibida (cabecera + contenido) en lugar de un spinner centrado.
 */
export default function Loading() {
  return (
    <div
      className="animate-pulse p-6 motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Cargando"
    >
      {/* Cabecera de página: título, subtítulo y acción */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="h-7 w-48 rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Contenido principal */}
      <div className="card h-[420px] p-4">
        <div className="h-4 w-1/3 rounded bg-gray-100" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-5/6 rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
