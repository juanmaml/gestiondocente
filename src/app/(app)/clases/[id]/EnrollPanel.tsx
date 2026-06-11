"use client";

import { Modal } from "@/components/Modal";
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
          <form action={enrollStudentAction} className="space-y-4">
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
              <button type="submit" className="btn-primary" onClick={close}>
                Matricular
              </button>
            </div>
          </form>
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
          <form action={createAndEnrollStudentAction} className="space-y-4">
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
              <button type="submit" className="btn-primary" onClick={close}>
                Crear y matricular
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
