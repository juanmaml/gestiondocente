"use client";

import { Modal } from "@/components/Modal";
import { createAssessmentAction } from "./actions";

const TYPES = ["tarea", "examen", "trabajo", "actividad", "otro"];

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
        <form action={createAssessmentAction} className="space-y-4">
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
                defaultValue={10}
                className="input"
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
            <button type="submit" className="btn-primary" onClick={close}>
              Crear
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
