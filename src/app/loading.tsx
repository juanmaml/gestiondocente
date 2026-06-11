import { Spinner } from "@/components/Spinner";

/** Indicador de carga a pantalla completa (login, redirecciones iniciales). */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner className="h-8 w-8 text-indigo-500" />
        <p className="text-sm">Cargando…</p>
      </div>
    </div>
  );
}
