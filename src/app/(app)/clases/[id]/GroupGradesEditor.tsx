"use client";

import { useFormStatus } from "react-dom";
import { saveGroupGradeAction } from "./actions";

type Member = { studentId: string; name: string; score: number | null };
type Group = {
  id: string;
  name: string;
  groupScore: number | null;
  members: Member[];
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary px-3 py-1.5 text-sm" disabled={pending}>
      {pending ? "Guardando…" : "Aplicar al grupo"}
    </button>
  );
}

export function GroupGradesEditor({
  classGroupId,
  assessmentItemId,
  maxScore,
  groups,
}: {
  classGroupId: string;
  assessmentItemId: string;
  maxScore: number;
  groups: Group[];
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Este evaluable es grupal. Crea grupos en la pestaña «Grupos» para poder
        calificarlo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <form
          key={g.id}
          action={saveGroupGradeAction}
          className="rounded-lg border border-gray-200 p-3"
        >
          <input type="hidden" name="classGroupId" value={classGroupId} />
          <input
            type="hidden"
            name="assessmentItemId"
            value={assessmentItemId}
          />
          <input type="hidden" name="studentGroupId" value={g.id} />

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-gray-900">{g.name}</h4>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Nota del grupo</span>
              <input
                name="groupScore"
                type="number"
                step="0.01"
                min={0}
                max={maxScore}
                defaultValue={g.groupScore ?? ""}
                className="input w-24 py-1"
                placeholder={`/${maxScore}`}
              />
            </label>
          </div>

          {g.members.length === 0 ? (
            <p className="text-sm text-gray-400">Grupo sin integrantes.</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">
                Ajuste individual opcional (si se deja vacío se aplica la nota
                del grupo):
              </p>
              {g.members.map((m) => (
                <div
                  key={m.studentId}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-gray-700">{m.name}</span>
                  <input
                    name={`member_${m.studentId}`}
                    type="number"
                    step="0.01"
                    min={0}
                    max={maxScore}
                    defaultValue={m.score ?? ""}
                    className="input w-24 py-1"
                    placeholder="grupo"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <SaveButton />
          </div>
        </form>
      ))}
    </div>
  );
}
