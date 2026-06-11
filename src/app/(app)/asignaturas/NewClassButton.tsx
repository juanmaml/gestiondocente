"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { createClassAction } from "./actions";

export function NewClassButton({ subjectId }: { subjectId: string }) {
  return (
    <Modal
      title="Nueva clase"
      trigger={(open) => (
        <button
          className="text-sm font-medium text-indigo-600 hover:underline"
          onClick={open}
        >
          + Añadir clase
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={createClassAction}
          close={close}
          className="space-y-4"
          successMessage="Clase creada."
        >
          <input type="hidden" name="subjectId" value={subjectId} />
          <div>
            <label className="label" htmlFor="class-name">
              Nombre de la clase
            </label>
            <input
              id="class-name"
              name="name"
              className="input"
              placeholder="1º ESO A"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Crear clase</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
