"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { createStudentAction } from "./actions";

export function NewStudentButton() {
  return (
    <Modal
      title="Nuevo alumno"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + Nuevo alumno
        </button>
      )}
    >
      {(close) => (
        <ModalForm action={createStudentAction} close={close} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                className="input"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Apellidos
              </label>
              <input id="lastName" name="lastName" className="input" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email (opcional)
            </label>
            <input id="email" name="email" type="email" className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Crear alumno</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
