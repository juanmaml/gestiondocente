"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { updateStudentAction } from "../actions";

export function EditStudentButton({
  student,
}: {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
}) {
  return (
    <Modal
      title="Editar alumno"
      trigger={(open) => (
        <button className="btn-secondary" onClick={open}>
          Editar datos
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={updateStudentAction}
          close={close}
          className="space-y-4"
          successMessage="Datos del alumno actualizados."
        >
          <input type="hidden" name="id" value={student.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="edit-firstName">
                Nombre
              </label>
              <input
                id="edit-firstName"
                name="firstName"
                className="input"
                defaultValue={student.firstName}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-lastName">
                Apellidos
              </label>
              <input
                id="edit-lastName"
                name="lastName"
                className="input"
                defaultValue={student.lastName}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="edit-email">
              Email (opcional)
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              className="input"
              defaultValue={student.email ?? ""}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Guardar cambios</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
