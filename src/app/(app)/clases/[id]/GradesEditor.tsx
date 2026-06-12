"use client";

import { Spinner } from "@/components/Spinner";
import { Avatar } from "@/components/Avatar";
import {
  AutosaveIndicator,
  focusNextOnEnter,
  useAutosave,
} from "@/components/Autosave";
import { saveGradesAction } from "./actions";

type Row = {
  studentId: string;
  name: string;
  score: number | null;
  observation: string | null;
};

export function GradesEditor({
  classGroupId,
  assessmentItemId,
  maxScore,
  rows,
}: {
  classGroupId: string;
  assessmentItemId: string;
  maxScore: number;
  rows: Row[];
}) {
  const { formRef, status, savedAt, onInput, save } =
    useAutosave(saveGradesAction);

  return (
    <form
      ref={formRef}
      onInput={onInput}
      onKeyDown={focusNextOnEnter}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />
      <input type="hidden" name="assessmentItemId" value={assessmentItemId} />
      <p className="text-xs text-gray-400">
        Las notas se guardan solas al dejar de escribir. Enter baja al
        siguiente alumno.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Alumno</th>
              <th className="w-28 px-3 py-2">Nota /{maxScore}</th>
              <th className="px-3 py-2">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.studentId}>
                <td className="px-3 py-2 font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name} className="h-7 w-7 text-[10px]" />
                    {r.name}
                  </span>
                  <input type="hidden" name="studentId" value={r.studentId} />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`score_${r.studentId}`}
                    data-col="score"
                    type="number"
                    step="0.01"
                    min={0}
                    max={maxScore}
                    defaultValue={r.score ?? ""}
                    className="input py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`obs_${r.studentId}`}
                    data-col="obs"
                    defaultValue={r.observation ?? ""}
                    placeholder="opcional"
                    className="input py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3">
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
