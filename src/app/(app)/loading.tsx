import { Spinner } from "@/components/Spinner";

/** Indicador de carga al navegar entre páginas de la aplicación. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner className="h-8 w-8 text-indigo-500" />
        <p className="text-sm">Cargando…</p>
      </div>
    </div>
  );
}
