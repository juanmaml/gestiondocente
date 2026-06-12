"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";
import { useToast } from "./Toaster";

/**
 * Modal sencillo controlado por un botón disparador. El contenido se pasa como
 * children y recibe una función `close` para cerrar tras enviar formularios.
 */
export function Modal({
  trigger,
  title,
  children,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[8vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={ref}
            className="card w-full max-w-lg p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                className="btn-ghost px-2 py-1"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            {children(() => setOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Formulario para usar dentro de un Modal. Ejecuta la Server Action y, solo si
 * termina sin lanzar error, cierra el modal. Evita el error
 * «Form submission canceled because the form is not connected» que provocaba
 * cerrar el modal en el onClick del botón (desmontaba el form antes de enviar).
 */
export function ModalForm({
  action,
  close,
  className,
  children,
  successMessage,
  errorMessage = "No se pudo completar la acción. Inténtalo de nuevo.",
  validate,
}: {
  action: (formData: FormData) => Promise<void> | void;
  close: () => void;
  className?: string;
  children: React.ReactNode;
  /** Toast de éxito tras guardar (si se omite, no se muestra). */
  successMessage?: string;
  /** Toast de error si la acción falla; el modal queda abierto. */
  errorMessage?: string;
  /**
   * Validación previa al envío: si devuelve un texto, se muestra como error
   * dentro del formulario y la acción no se ejecuta.
   */
  validate?: (formData: FormData) => string | null;
}) {
  const toast = useToast();
  const [validationError, setValidationError] = useState<string | null>(null);
  return (
    <form
      className={className}
      action={async (formData) => {
        const error = validate?.(formData) ?? null;
        setValidationError(error);
        if (error) return;
        try {
          await action(formData);
        } catch {
          toast.error(errorMessage);
          return;
        }
        if (successMessage) toast.success(successMessage);
        close();
      }}
    >
      {validationError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {validationError}
        </p>
      )}
      {children}
    </form>
  );
}

/** Botón de envío con estado de carga, para usar dentro de ModalForm. */
export function ModalSubmit({
  children = "Guardar",
  pendingLabel = "Guardando…",
}: {
  children?: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
