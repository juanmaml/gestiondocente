"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Spinner } from "./Spinner";
import { useToast } from "./Toaster";

/**
 * Botón de borrado con diálogo de confirmación nativo (<dialog>): foco
 * atrapado, Esc para cancelar y devolución del foco al disparador. Al
 * confirmar ejecuta la Server Action con los campos indicados, muestra estado
 * de carga y lanza un toast de éxito o error.
 *
 * Si se pasa `undoAction`, el toast de éxito incluye un botón «Deshacer»
 * durante 10 s que ejecuta esa acción con los mismos campos (pensado para
 * borrados suaves reversibles).
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
  undoAction,
  undoneMessage = "Elemento restaurado.",
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
  /** Acción que revierte el borrado; activa el «Deshacer» en el toast. */
  undoAction?: (formData: FormData) => Promise<void>;
  /** Toast mostrado cuando el deshacer termina bien. */
  undoneMessage?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);

  function buildFormData() {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    return formData;
  }

  function undo() {
    if (!undoAction) return;
    startTransition(async () => {
      try {
        await undoAction(buildFormData());
        toast.success(undoneMessage);
      } catch {
        toast.error("No se pudo deshacer. Recarga la página y comprueba.");
      }
    });
  }

  function confirm() {
    startTransition(async () => {
      try {
        await action(buildFormData());
        if (undoAction) {
          toast.withAction(successMessage, { label: "Deshacer", onAction: undo });
        } else {
          toast.success(successMessage);
        }
        ref.current?.close();
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
        <dialog
          ref={ref}
          role="alertdialog"
          aria-label={title}
          onClose={() => setOpen(false)}
          onCancel={(e) => {
            // Esc no debe interrumpir un borrado en curso.
            if (pending) e.preventDefault();
          }}
          onMouseDown={(e) => {
            const r = ref.current?.getBoundingClientRect();
            if (
              !pending &&
              e.target === ref.current &&
              r &&
              (e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom)
            ) {
              ref.current?.close();
            }
          }}
          className="card mx-auto mt-[16vh] w-full max-w-md p-6 text-left shadow-xl backdrop:bg-black/30"
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => ref.current?.close()}
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
        </dialog>
      )}
    </>
  );
}
