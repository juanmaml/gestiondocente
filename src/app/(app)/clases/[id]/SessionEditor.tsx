"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toaster";
import { AutosaveIndicator, useAutosave } from "@/components/Autosave";
import {
  movePlannedToNextSessionAction,
  saveSessionAction,
} from "./actions";

type SessionData = {
  plannedContent: string | null;
  deliveredContent: string | null;
  homework: string | null;
  generalNotes: string | null;
  privateNotes: string | null;
} | null;

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
  next,
}: {
  classGroupId: string;
  date: string;
  startTime: string;
  endTime: string;
  session: SessionData;
  /** Próxima sesión programada, para poder pasarle contenido pendiente. */
  next: { dateKey: string; startTime: string; endTime: string } | null;
}) {
  const [showPrivate, setShowPrivate] = useState(false);
  const [moving, startMoving] = useTransition();
  const toast = useToast();
  const { formRef, status, savedAt, onInput, save } =
    useAutosave(saveSessionAction);

  // Copia el contenido previsto actual (tal y como está escrito, aunque no se
  // haya guardado aún) al campo "previsto" de la próxima sesión.
  function moveToNext() {
    if (!next) return;
    const field = formRef.current?.elements.namedItem("plannedContent");
    const content =
      field instanceof HTMLTextAreaElement ? field.value.trim() : "";
    if (!content) {
      toast.info("No hay contenido previsto que pasar.");
      return;
    }
    const formData = new FormData();
    formData.set("classGroupId", classGroupId);
    formData.set("nextDate", next.dateKey);
    formData.set("nextStart", next.startTime);
    formData.set("nextEnd", next.endTime);
    formData.set("content", content);
    startMoving(async () => {
      try {
        await movePlannedToNextSessionAction(formData);
        toast.success("Contenido copiado a la próxima sesión.");
      } catch {
        toast.error("No se pudo copiar el contenido.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onInput={onInput}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-4"
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="endTime" value={endTime} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Field
            label="Contenido previsto"
            name="plannedContent"
            value={session?.plannedContent ?? null}
            placeholder="Qué tienes planificado para esta sesión…"
            accent="#6366f1"
          />
          {next && (
            <button
              type="button"
              onClick={moveToNext}
              disabled={moving}
              className="mt-1 text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
              title="¿No ha dado tiempo? Copia lo previsto al campo «previsto» de la próxima sesión"
            >
              {moving ? "Copiando…" : "→ Pasar a la próxima sesión"}
            </button>
          )}
        </div>
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

      <div className="sticky bottom-0 -mx-1 mt-4 flex items-center justify-end gap-2 border-t border-gray-100 bg-white/90 px-1 pt-3 backdrop-blur">
        <span className="mr-auto">
          <AutosaveIndicator status={status} savedAt={savedAt} />
        </span>
        <button
          type="submit"
          className="btn-primary"
          disabled={status === "saving"}
        >
          {status === "saving" && <Spinner className="h-4 w-4" />}
          {status === "saving" ? "Guardando…" : "Guardar ahora"}
        </button>
      </div>
    </form>
  );
}
