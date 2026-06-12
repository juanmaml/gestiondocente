"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "./Spinner";
import { CheckIcon } from "./icons";

export type AutosaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "invalid"
  | "error";

/**
 * Autoguardado con debounce para formularios de Server Actions.
 *
 * Uso: colgar `formRef` del <form>, llamar a `onInput` en su onInput y
 * (opcionalmente) a `save()` desde un botón de guardado manual. Tras cada
 * pausa de escritura se envía el formulario completo a `action`.
 *
 * - Si el formulario tiene campos inválidos (p. ej. notas fuera de rango) no
 *   se guarda y el estado pasa a "invalid".
 * - Si la pestaña se oculta o se cierra con cambios pendientes, se intenta un
 *   guardado inmediato y se avisa antes de salir.
 */
export function useAutosave(
  action: (formData: FormData) => Promise<void>,
  delay = 1200
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  const save = useCallback(async () => {
    const form = formRef.current;
    if (!form) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!form.checkValidity()) {
      setStatus("invalid");
      return;
    }
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    try {
      await action(new FormData(form));
      setSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        void save();
      }
    }
  }, [action]);

  const onInput = useCallback(() => {
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), delay);
  }, [save, delay]);

  useEffect(() => {
    function flushIfDirty() {
      if (statusRef.current === "dirty") void save();
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (statusRef.current === "dirty" || statusRef.current === "saving") {
        e.preventDefault();
      }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flushIfDirty();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", flushIfDirty);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", flushIfDirty);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [save]);

  return { formRef, status, savedAt, onInput, save };
}

const TIME_FMT = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Texto de estado del autoguardado, para colocar junto al botón de guardar. */
export function AutosaveIndicator({
  status,
  savedAt,
}: {
  status: AutosaveStatus;
  savedAt: Date | null;
}) {
  if (status === "idle") {
    return (
      <span className="text-xs text-gray-400">
        Los cambios se guardan automáticamente.
      </span>
    );
  }
  if (status === "dirty") {
    return <span className="text-xs text-gray-400">Cambios sin guardar…</span>;
  }
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <Spinner className="h-3 w-3" /> Guardando…
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="text-xs font-medium text-amber-700">
        Revisa los valores marcados en rojo; no se han guardado.
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-xs font-medium text-red-600">
        No se pudo guardar. Sigue editando o pulsa «Guardar» para reintentar.
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
      <CheckIcon className="h-3 w-3" />
      Guardado{savedAt ? ` a las ${TIME_FMT.format(savedAt)}` : ""}
    </span>
  );
}

/**
 * Navegación con Enter en rejillas de notas: salta al siguiente campo de la
 * misma columna (mismo data-col) en lugar de enviar el formulario.
 */
export function focusNextOnEnter(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Enter") return;
  const target = e.target as HTMLElement;
  if (target.tagName !== "INPUT") return;
  const col = target.getAttribute("data-col");
  if (!col) return;
  e.preventDefault();
  const form = (target as HTMLInputElement).form;
  if (!form) return;
  const inputs = Array.from(
    form.querySelectorAll<HTMLInputElement>(`input[data-col="${col}"]`)
  );
  const idx = inputs.indexOf(target as HTMLInputElement);
  const next = inputs[idx + 1];
  if (next) {
    next.focus();
    next.select();
  } else {
    (target as HTMLInputElement).blur();
  }
}
