"use client";

import { ModalForm, ModalSubmit } from "@/components/Modal";
import { createAssessmentAction, updateAssessmentAction } from "./actions";

const TYPES = ["tarea", "examen", "trabajo", "actividad", "otro"];

/** Datos de un evaluable existente para precargar el formulario de edición. */
export type AssessmentDefaults = {
  id: string;
  title: string;
  type: string;
  /** Fecha en formato yyyy-mm-dd, o null. */
  date: string | null;
  maxScore: number;
  weight: number | null;
  term: string | null;
  description: string | null;
  isGroup: boolean;
};

function validateAssessment(formData: FormData): string | null {
  const maxScore = Number(formData.get("maxScore"));
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return "La puntuación máxima debe ser un número mayor que 0.";
  }
  const weightRaw = String(formData.get("weight") ?? "").trim();
  if (weightRaw !== "") {
    const weight = Number(weightRaw);
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
      return "El peso debe estar entre 0 y 100 (%).";
    }
  }
  return null;
}

/**
 * Formulario de evaluable para usar dentro de un Modal/ControlledModal:
 * crea uno nuevo o, si recibe `assessment`, edita el existente. El carácter
 * grupal solo se elige al crear (cambiarlo después mezclaría calificación
 * individual y por grupos).
 */
export function AssessmentForm({
  classGroupId,
  close,
  assessment,
}: {
  classGroupId: string;
  close: () => void;
  assessment?: AssessmentDefaults;
}) {
  return (
    <ModalForm
      action={assessment ? updateAssessmentAction : createAssessmentAction}
      close={close}
      className="space-y-4"
      successMessage={assessment ? "Evaluable actualizado." : "Evaluable creado."}
      validate={validateAssessment}
    >
      <input type="hidden" name="classGroupId" value={classGroupId} />
      {assessment && <input type="hidden" name="id" value={assessment.id} />}
      <div>
        <label className="label" htmlFor="a-title">
          Título
        </label>
        <input
          id="a-title"
          name="title"
          className="input"
          placeholder="Examen tema 3"
          defaultValue={assessment?.title}
          autoFocus
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="a-type">
            Tipo
          </label>
          <select
            id="a-type"
            name="type"
            className="input"
            defaultValue={assessment?.type}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="a-date">
            Fecha
          </label>
          <input
            id="a-date"
            name="date"
            type="date"
            className="input"
            defaultValue={assessment?.date ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="a-max">
            Punt. máx.
          </label>
          <input
            id="a-max"
            name="maxScore"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={assessment?.maxScore ?? 10}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="a-weight">
            Peso (%)
          </label>
          <input
            id="a-weight"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="input"
            placeholder="opc."
            defaultValue={assessment?.weight ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="a-term">
            Periodo
          </label>
          <input
            id="a-term"
            name="term"
            className="input"
            placeholder="1ª eval"
            defaultValue={assessment?.term ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="a-desc">
          Descripción
        </label>
        <textarea
          id="a-desc"
          name="description"
          rows={2}
          className="input resize-y"
          defaultValue={assessment?.description ?? ""}
        />
      </div>
      {assessment ? (
        <p className="text-sm text-gray-400">
          {assessment.isGroup
            ? "Evaluable grupal (se califica por grupos)."
            : "Evaluable individual."}{" "}
          El carácter grupal no se puede cambiar tras crearlo.
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isGroup" className="h-4 w-4" />
          Trabajo grupal (se califica por grupos)
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={close}>
          Cancelar
        </button>
        <ModalSubmit>{assessment ? "Guardar cambios" : "Crear"}</ModalSubmit>
      </div>
    </ModalForm>
  );
}
