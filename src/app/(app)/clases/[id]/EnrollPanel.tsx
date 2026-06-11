"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import {
  createAndEnrollStudentAction,
  enrollStudentAction,
} from "./actions";

type Student = { id: string; firstName: string; lastName: string };

export function EnrollButtons({
  classGroupId,
  available,
}: {
  classGroupId: string;
  available: Student[];
}) {
  return (
    <div className="flex gap-2">
      <Modal
        title="Matricular alumno existente"
        trigger={(open) => (
          <button
            className="btn-secondary"
            onClick={open}
            disabled={available.length === 0}
          >
            Matricular existente
          </button>
        )}
      >
        {(close) => (
          <ModalForm
            action={enrollStudentAction}
            close={close}
            className="space-y-4"
            successMessage="Alumno matriculado."
          >
            <input type="hidden" name="classGroupId" value={classGroupId} />
            <div>
              <label className="label" htmlFor="enroll-student">
                Alumno
              </label>
              <select
                id="enroll-student"
                name="studentId"
                className="input"
                required
              >
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName}, {s.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={close}>
                Cancelar
              </button>
              <ModalSubmit>Matricular</ModalSubmit>
            </div>
          </ModalForm>
        )}
      </Modal>

      <Modal
        title="Nuevo alumno en esta clase"
        trigger={(open) => (
          <button className="btn-primary" onClick={open}>
            + Nuevo alumno
          </button>
        )}
      >
        {(close) => (
          <ModalForm
            action={createAndEnrollStudentAction}
            close={close}
            className="space-y-4"
            successMessage="Alumno creado y matriculado."
          >
            <input type="hidden" name="classGroupId" value={classGroupId} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ce-first">
                  Nombre
                </label>
                <input
                  id="ce-first"
                  name="firstName"
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="ce-last">
                  Apellidos
                </label>
                <input id="ce-last" name="lastName" className="input" required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={close}>
                Cancelar
              </button>
              <ModalSubmit>Crear y matricular</ModalSubmit>
            </div>
          </ModalForm>
        )}
      </Modal>
    </div>
  );
}
