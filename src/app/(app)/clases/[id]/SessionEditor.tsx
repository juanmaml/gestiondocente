"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toaster";
import { saveSessionAction } from "./actions";

type SessionData = {
  plannedContent: string | null;
  deliveredContent: string | null;
  homework: string | null;
  generalNotes: string | null;
  privateNotes: string | null;
} | null;

function SaveBar() {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-1 mt-4 flex items-center justify-end gap-2 border-t border-gray-100 bg-white/90 px-1 pt-3 backdrop-blur">
      <span className="mr-auto text-xs text-gray-400">
        Los cambios se guardan al pulsar.
      </span>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Guardando…" : "Guardar sesión"}
      </button>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  rows = 3,
  accent,
}: {
  label: string;
  name: string;
  value: string | null;
  placeholder?: string;
  rows?: number;
  accent?: string;
}) {
  return (
    <div>
      <label className="label flex items-center gap-2">
        {accent && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: accent }}
          />
        )}
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="input resize-y"
      />
    </div>
  );
}

export function SessionEditor({
  classGroupId,
  date,
  startTime,
  endTime,
  session,
}: {
  classGroupId: string;
  date: string;
  startTime: string;
  endTime: string;
  session: SessionData;
}) {
  const [showPrivate, setShowPrivate] = useState(false);
  const toast = useToast();
  return (
    <form
      action={async (formData) => {
        try {
          await saveSessionAction(formData);
          toast.success("Sesión guardada.");
        } catch {
          toast.error("No se pudo guardar la sesión. Inténtalo de nuevo.");
        }
      }}
      className="space-y-4"
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="endTime" value={endTime} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Contenido previsto"
          name="plannedContent"
          value={session?.plannedContent ?? null}
          placeholder="Qué tienes planificado para esta sesión…"
          accent="#6366f1"
        />
        <Field
          label="Contenido impartido"
          name="deliveredContent"
          value={session?.deliveredContent ?? null}
          placeholder="Qué se ha trabajado realmente…"
          accent="#059669"
        />
      </div>

      <Field
        label="Deberes / tareas mandadas"
        name="homework"
        value={session?.homework ?? null}
        placeholder="Tareas para casa…"
        accent="#ca8a04"
        rows={2}
      />

      <Field
        label="Anotaciones generales de la sesión"
        name="generalNotes"
        value={session?.generalNotes ?? null}
        placeholder="Cómo ha ido la clase, incidencias generales…"
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <button
          type="button"
          onClick={() => setShowPrivate((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-amber-800"
        >
          <span>🔒 Anotaciones privadas del docente</span>
          <span>{showPrivate ? "Ocultar" : "Mostrar"}</span>
        </button>
        {showPrivate && (
          <textarea
            name="privateNotes"
            rows={3}
            defaultValue={session?.privateNotes ?? ""}
            placeholder="Solo tú ves estas notas…"
            className="input mt-2 resize-y"
          />
        )}
        {!showPrivate && (
          // Mantiene el valor aunque esté oculto.
          <input
            type="hidden"
            name="privateNotes"
            value={session?.privateNotes ?? ""}
          />
        )}
      </div>

      <SaveBar />
    </form>
  );
}
