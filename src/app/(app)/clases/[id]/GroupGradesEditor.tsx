"use client";

import { useFormStatus } from "react-dom";
import {
  applyGroupGradeToAllAction,
  saveGroupGradeAction,
} from "./actions";

type Member = { studentId: string; name: string; score: number | null };
type Group = {
  id: string;
  name: string;
  groupScore: number | null;
  members: Member[];
};

function ActionButton({
  formAction,
  variant,
  children,
  pendingLabel,
}: {
  formAction: (formData: FormData) => void;
  variant: "primary" | "secondary";
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} px-3 py-1.5 text-sm`}
    >
      {pending ? pendingLabel : children}
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
          // La key incluye las notas actuales: tras sobreescribir, el form se
          // vuelve a montar y los campos reflejan los nuevos valores.
          key={`${g.id}:${g.groupScore}:${g.members.map((m) => m.score).join(",")}`}
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
                Ajuste individual (si se deja vacío se aplica la nota del grupo
                al guardar ajustes):
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

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <ActionButton
              formAction={saveGroupGradeAction}
              variant="secondary"
              pendingLabel="Guardando…"
            >
              Guardar ajustes individuales
            </ActionButton>
            <ActionButton
              formAction={applyGroupGradeToAllAction}
              variant="primary"
              pendingLabel="Aplicando…"
            >
              Aplicar a todo el grupo
            </ActionButton>
          </div>
        </form>
      ))}
    </div>
  );
}
