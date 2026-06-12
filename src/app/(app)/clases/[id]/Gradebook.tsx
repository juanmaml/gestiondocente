"use client";

import { Spinner } from "@/components/Spinner";
import {
  AutosaveIndicator,
  focusNextOnEnter,
  useAutosave,
} from "@/components/Autosave";
import { saveGradebookAction } from "./actions";

type Column = {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  isGroup: boolean;
};
type Row = {
  studentId: string;
  name: string;
  scores: Record<string, number | null>; // assessmentId -> score
};

const TYPE_COLOR: Record<string, string> = {
  examen: "#dc2626",
  tarea: "#2563eb",
  trabajo: "#7c3aed",
  actividad: "#059669",
  otro: "#6b7280",
};

/** Nota normalizada a base 10 según la puntuación máxima del evaluable. */
function normalized(score: number | null, maxScore: number): number | null {
  if (score == null || !maxScore) return null;
  return (score / maxScore) * 10;
}

function studentAverage(row: Row, columns: Column[]): number | null {
  const vals: number[] = [];
  for (const c of columns) {
    const n = normalized(row.scores[c.id] ?? null, c.maxScore);
    if (n != null) vals.push(n);
  }
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function avgColor(avg: number | null): string {
  if (avg == null) return "#9ca3af";
  if (avg < 5) return "#dc2626";
  if (avg < 7) return "#d97706";
  return "#059669";
}

export function Gradebook({
  classGroupId,
  columns,
  rows,
}: {
  classGroupId: string;
  columns: Column[];
  rows: Row[];
}) {
  const { formRef, status, savedAt, onInput, save } =
    useAutosave(saveGradebookAction);

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-gray-400">
        {rows.length === 0
          ? "Matricula alumnos en la clase para usar el cuaderno."
          : "Crea evaluables (exámenes, tareas, trabajos…) para empezar a calificar."}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onInput={onInput}
      onKeyDown={focusNextOnEnter}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Alumnos en filas, evaluables en columnas. Las notas se guardan solas
          al dejar de escribir; Enter baja al siguiente alumno. La media es una
          media simple normalizada sobre 10.
        </p>
        <div className="flex items-center gap-3">
          <AutosaveIndicator status={status} savedAt={savedAt} />
          <button
            type="submit"
            className="btn-primary"
            disabled={status === "saving"}
          >
            {status === "saving" && <Spinner className="h-4 w-4" />}
            {status === "saving" ? "Guardando…" : "Guardar ahora"}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Alumno
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="px-2 py-2 text-center align-bottom"
                  title={`${c.title} · ${c.type} · máx. ${c.maxScore}`}
                >
                  <div className="mx-auto flex w-24 flex-col items-center gap-1">
                    <span
                      className="chip text-[10px]"
                      style={{
                        background: `${TYPE_COLOR[c.type] ?? TYPE_COLOR.otro}1a`,
                        color: TYPE_COLOR[c.type] ?? TYPE_COLOR.otro,
                      }}
                    >
                      {c.type}
                      {c.isGroup ? " · grupo" : ""}
                    </span>
                    <span className="line-clamp-2 text-xs font-medium text-gray-700">
                      {c.title}
                    </span>
                    <span className="text-[10px] text-gray-400">/{c.maxScore}</span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Media
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const avg = studentAverage(r, columns);
              return (
                <tr key={r.studentId} className="hover:bg-gray-50/60">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-gray-900">
                    {r.name}
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className="px-2 py-1.5 text-center">
                      <input
                        name={`grade_${c.id}_${r.studentId}`}
                        data-col={c.id}
                        type="number"
                        step="0.01"
                        min={0}
                        max={c.maxScore}
                        defaultValue={r.scores[c.id] ?? ""}
                        aria-label={`Nota de ${r.name} en ${c.title}`}
                        className="input w-20 px-2 py-1 text-center"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center">
                    <span
                      className="font-semibold"
                      style={{ color: avgColor(avg) }}
                    >
                      {avg == null ? "—" : avg.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {/* Fila de medias por evaluable */}
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                Media clase
              </td>
              {columns.map((c) => {
                const vals = rows
                  .map((r) => r.scores[c.id] ?? null)
                  .filter((v): v is number => v != null);
                const m =
                  vals.length > 0
                    ? vals.reduce((a, b) => a + b, 0) / vals.length
                    : null;
                return (
                  <td key={c.id} className="px-2 py-2 text-center text-gray-600">
                    {m == null ? "—" : m.toFixed(2)}
                  </td>
                );
              })}
              <td className="px-3 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <AutosaveIndicator status={status} savedAt={savedAt} />
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
