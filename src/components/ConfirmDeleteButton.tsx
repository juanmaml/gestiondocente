"use client";

import { useEffect, useState, useTransition } from "react";
import { Spinner } from "./Spinner";
import { useToast } from "./Toaster";

/**
 * Botón de borrado con modal de confirmación. Sustituye a los formularios de
 * eliminación directa: al confirmar ejecuta la Server Action con los campos
 * indicados, muestra estado de carga y lanza un toast de éxito o error.
 */
export function ConfirmDeleteButton({
  action,
  fields,
  title = "Confirmar eliminación",
  message,
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando…",
  successMessage = "Elemento eliminado.",
  errorMessage = "No se pudo eliminar. Inténtalo de nuevo.",
  className = "text-xs text-red-500 hover:underline",
  children = "Eliminar",
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  title?: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function confirm() {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
        setOpen(false);
      } catch {
        toast.error(errorMessage);
      }
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[16vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            className="card w-full max-w-md p-6 text-left shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
          >
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirm}
                disabled={pending}
              >
                {pending && <Spinner className="h-4 w-4" />}
                {pending ? pendingLabel : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
