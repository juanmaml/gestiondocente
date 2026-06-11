"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toaster";
import { saveGradesAction } from "./actions";

type Row = {
  studentId: string;
  name: string;
  score: number | null;
  observation: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? "Guardando…" : "Guardar calificaciones"}
    </button>
  );
}

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
  const toast = useToast();
  return (
    <form
      action={async (formData) => {
        try {
          await saveGradesAction(formData);
          toast.success("Calificaciones guardadas.");
        } catch {
          toast.error("No se pudieron guardar las calificaciones.");
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />
      <input type="hidden" name="assessmentItemId" value={assessmentItemId} />
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
                  {r.name}
                  <input type="hidden" name="studentId" value={r.studentId} />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`score_${r.studentId}`}
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
      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
