"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";
import { useToast } from "./Toaster";
import { XIcon } from "./icons";

/**
 * Resultado opcional de una Server Action: si devuelve `{ error }`, el
 * formulario lo muestra y no se cierra. Lanzar excepciones queda para fallos
 * imprevistos (en producción Next.js oculta su mensaje, así que los errores
 * esperados deben viajar como valor de retorno).
 */
export type ActionResult = { error: string } | void;

/**
 * Modal sobre <dialog> nativo: foco atrapado dentro, Esc para cerrar y
 * devolución del foco al disparador la aporta el navegador. El contenido se
 * pasa como children y recibe una función `close` para cerrar tras enviar
 * formularios.
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
  return (
    <>
      {trigger(() => setOpen(true))}
      <ControlledModal open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </ControlledModal>
    </>
  );
}

/**
 * Variante de apertura programática (sin disparador propio): el estado
 * `open` vive en quien lo usa, p. ej. abrir tras un arrastre o tras un
 * sorteo. Mismo <dialog> nativo que Modal.
 */
export function ControlledModal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-lg",
  headerless = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: (close: () => void) => React.ReactNode;
  /** Ancho máximo de la caja (p. ej. "max-w-sm"). */
  maxWidthClass?: string;
  /** Sin barra de título: el contenido define su propia cabecera. */
  headerless?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal() solo puede llamarse con el elemento ya montado.
  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      aria-label={title}
      // El evento close cubre Esc y cualquier cierre nativo.
      onClose={onClose}
      onMouseDown={(e) => {
        // Un clic sobre el ::backdrop llega con el propio dialog como
        // target; si cae fuera de la caja, se cierra.
        const r = ref.current?.getBoundingClientRect();
        if (
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
      className={`card mx-auto mt-[8vh] max-h-[84vh] w-full ${maxWidthClass} overflow-y-auto p-6 shadow-xl backdrop:bg-black/30`}
    >
      {!headerless && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            className="btn-ghost px-2 py-1"
            onClick={() => ref.current?.close()}
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>
      )}
      {children(() => ref.current?.close())}
    </dialog>
  );
}

/**
 * Formulario para usar dentro de un Modal. Ejecuta la Server Action y, solo si
 * termina sin error, cierra el modal. Evita el error
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
  action: (formData: FormData) => Promise<ActionResult> | ActionResult;
  close: () => void;
  className?: string;
  children: React.ReactNode;
  /** Toast de éxito tras guardar (si se omite, no se muestra). */
  successMessage?: string;
  /** Toast de error si la acción falla sin causa conocida; el modal queda abierto. */
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
        let result: ActionResult;
        try {
          result = await action(formData);
        } catch {
          toast.error(errorMessage);
          return;
        }
        // Error esperado con causa: se muestra dentro del formulario.
        if (result && result.error) {
          setValidationError(result.error);
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
