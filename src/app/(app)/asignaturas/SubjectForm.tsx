"use client";

import { useState } from "react";
import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { SUBJECT_COLORS, SUBJECT_COLOR_NAMES } from "@/lib/colors";
import { createSubjectAction } from "./actions";

function ColorPicker({ name }: { name: string }) {
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  return (
    <div>
      <span className="label">Color identificativo</span>
      <input type="hidden" name={name} value={color} />
      <div className="flex flex-wrap gap-2">
        {SUBJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            style={{ background: c }}
            className={`h-8 w-8 rounded-full ring-offset-2 transition ${
              color === c ? "ring-2 ring-gray-800" : ""
            }`}
            aria-label={`Color ${SUBJECT_COLOR_NAMES[c] ?? c}`}
            aria-pressed={color === c}
          />
        ))}
      </div>
    </div>
  );
}

export function NewSubjectButton() {
  return (
    <Modal
      title="Nueva asignatura"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + Nueva asignatura
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={createSubjectAction}
          close={close}
          className="space-y-4"
          successMessage="Asignatura creada."
        >
          <div>
            <label className="label" htmlFor="subject-name">
              Nombre
            </label>
            <input
              id="subject-name"
              name="name"
              className="input"
              placeholder="Matemáticas"
              autoFocus
              required
            />
          </div>
          <ColorPicker name="color" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Crear asignatura</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
