"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const KIND_STYLES: Record<ToastKind, { icon: string; classes: string }> = {
  success: {
    icon: "✓",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: "✕",
    classes: "border-red-200 bg-red-50 text-red-800",
  },
  info: {
    icon: "ℹ",
    classes: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
};

const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
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
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
      info: (message: string) => push("info", message),
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
              role="status"
              className={`toast-enter pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg ${style.classes}`}
            >
              <span className="mt-0.5 font-bold">{style.icon}</span>
              <p className="flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="opacity-50 transition hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
