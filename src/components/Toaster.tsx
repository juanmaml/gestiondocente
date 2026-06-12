"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckIcon, InfoIcon, WarningIcon, XIcon } from "./icons";

type ToastKind = "success" | "error" | "info" | "warning";
type ToastAction = { label: string; onAction: () => void };
type Toast = { id: number; kind: ToastKind; message: string; action?: ToastAction };

const KIND_STYLES: Record<ToastKind, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckIcon />,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: <XIcon />,
    classes: "border-red-200 bg-red-50 text-red-800",
  },
  info: {
    icon: <InfoIcon />,
    classes: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  warning: {
    icon: <WarningIcon />,
    classes: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  /** Toast con botón de acción (p. ej. «Deshacer» tras un borrado). */
  withAction: (message: string, action: ToastAction, duration?: number) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

/**
 * Proveedor global de notificaciones tipo toast. Se monta una sola vez en el
 * layout raíz; cualquier componente cliente puede lanzar avisos con useToast().
 * Los toasts se descartan solos a los 4,5 s o al pulsar la ✕.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, duration = 4500, action?: ToastAction) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, kind, message, action }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
      info: (message: string) => push("info", message),
      // Los avisos importantes (p. ej. convivencias) duran más en pantalla.
      warning: (message: string) => push("warning", message, 9000),
      // Dura más para dar tiempo a reaccionar (p. ej. deshacer un borrado).
      withAction: (message: string, action: ToastAction, duration = 10000) =>
        push("info", message, duration, action),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const style = KIND_STYLES[t.kind];
          return (
            <div
              key={t.id}
              // Los errores se anuncian de inmediato al lector de pantalla;
              // el resto espera a que el usuario esté libre.
              role={t.kind === "error" ? "alert" : "status"}
              className={`toast-enter pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg ${style.classes}`}
            >
              <span className="mt-0.5">{style.icon}</span>
              <p className="flex-1">{t.message}</p>
              {t.action && (
                <button
                  onClick={() => {
                    dismiss(t.id);
                    t.action!.onAction();
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="opacity-50 transition hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                <XIcon />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
