"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import {
  createStudentNoteAction,
  deleteStudentNoteAction,
} from "./actions";

type Student = { id: string; firstName: string; lastName: string };
type Note = {
  id: string;
  studentId: string;
  type: string;
  content: string;
  studentName: string;
};

const NOTE_TYPES = [
  { value: "positiva", label: "Positiva", color: "#059669" },
  { value: "negativa", label: "Negativa", color: "#dc2626" },
  { value: "incidencia", label: "Incidencia", color: "#ea580c" },
  { value: "general", label: "General", color: "#6b7280" },
];

function typeMeta(t: string) {
  return NOTE_TYPES.find((n) => n.value === t) ?? NOTE_TYPES[3];
}

export function StudentNotesPanel({
  classGroupId,
  date,
  sessionId,
  students,
  notes,
}: {
  classGroupId: string;
  date: string;
  sessionId: string | null;
  students: Student[];
  notes: Note[];
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Anotaciones sobre alumnos
        </h3>
        <Modal
          title="Nueva anotación sobre alumno"
          trigger={(open) => (
            <button
              className="text-sm font-medium text-indigo-600 hover:underline disabled:text-gray-300"
              onClick={open}
              disabled={students.length === 0}
            >
              + Añadir
            </button>
          )}
        >
          {(close) => (
            <ModalForm
              action={createStudentNoteAction}
              close={close}
              className="space-y-4"
            >
              <input type="hidden" name="classGroupId" value={classGroupId} />
              <input type="hidden" name="date" value={date} />
              {sessionId && (
                <input type="hidden" name="sessionId" value={sessionId} />
              )}
              <div>
                <label className="label" htmlFor="note-student">
                  Alumno
                </label>
                <select
                  id="note-student"
                  name="studentId"
                  className="input"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="note-type">
                  Tipo
                </label>
                <select id="note-type" name="type" className="input">
                  {NOTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="note-content">
                  Anotación
                </label>
                <textarea
                  id="note-content"
                  name="content"
                  rows={3}
                  className="input resize-y"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={close}>
                  Cancelar
                </button>
                <ModalSubmit>Guardar</ModalSubmit>
              </div>
            </ModalForm>
          )}
        </Modal>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">
          Sin anotaciones sobre alumnos en esta sesión.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const meta = typeMeta(n.type);
            return (
              <li
                key={n.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 p-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {n.studentName}
                    </span>
                    <span
                      className="chip"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{n.content}</p>
                </div>
                <form action={deleteStudentNoteAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="classGroupId" value={classGroupId} />
                  <button className="text-xs text-gray-300 hover:text-red-500">
                    ✕
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
