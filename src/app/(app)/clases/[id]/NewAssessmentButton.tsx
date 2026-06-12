"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { createAssessmentAction } from "./actions";

const TYPES = ["tarea", "examen", "trabajo", "actividad", "otro"];

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

export function NewAssessmentButton({
  classGroupId,
}: {
  classGroupId: string;
}) {
  return (
    <Modal
      title="Nuevo elemento evaluable"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + Nuevo evaluable
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={createAssessmentAction}
          close={close}
          className="space-y-4"
          successMessage="Evaluable creado."
          validate={validateAssessment}
        >
          <input type="hidden" name="classGroupId" value={classGroupId} />
          <div>
            <label className="label" htmlFor="a-title">
              Título
            </label>
            <input
              id="a-title"
              name="title"
              className="input"
              placeholder="Examen tema 3"
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="a-type">
                Tipo
              </label>
              <select id="a-type" name="type" className="input">
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
              <input id="a-date" name="date" type="date" className="input" />
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
                defaultValue={10}
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
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isGroup" className="h-4 w-4" />
            Trabajo grupal (se califica por grupos)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Crear</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
