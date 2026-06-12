"use client";

import { useState } from "react";
import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/components/Toaster";
import { CONVIVENCIA_LIMIT } from "@/lib/convivencia";
import { readableText } from "@/lib/colors";
import { plural } from "@/lib/plural";
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
  { value: "convivencia", label: "Convivencia", color: "#c026d3" },
  { value: "parte", label: "Parte", color: "#0f766e" },
  { value: "general", label: "General", color: "#6b7280" },
];

function typeMeta(t: string) {
  return NOTE_TYPES.find((n) => n.value === t) ?? NOTE_TYPES[3];
}

/** Minúsculas y sin tildes, para que «martinez» encuentre a «Martínez». */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * Selector de alumno con búsqueda: input que filtra en vivo una lista de
 * radios nativos (teclado y validación gratis). Con prisa, teclear tres
 * letras gana siempre a recorrer un desplegable de 30 nombres.
 */
function StudentPicker({ students }: { students: Student[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const q = normalize(query.trim());
  const filtered = q
    ? students.filter((s) =>
        normalize(`${s.firstName} ${s.lastName}`).includes(q)
      )
    : students;

  const selectedStudent = students.find((s) => s.id === selected);
  const selectedVisible = filtered.some((s) => s.id === selected);

  return (
    <div>
      <label className="label" htmlFor="note-student-search">
        Alumno
      </label>
      <input
        id="note-student-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // Enter no envía el formulario: selecciona el primer resultado
          // (teclear tres letras + Enter y ya está elegido el alumno).
          if (e.key === "Enter") {
            e.preventDefault();
            if (filtered.length > 0) setSelected(filtered[0].id);
          }
        }}
        placeholder="Buscar por nombre…"
        className="input mb-2"
        autoFocus
      />
      {/* Si el filtro oculta al alumno elegido, su valor sigue viajando. */}
      {selected && !selectedVisible && (
        <input type="hidden" name="studentId" value={selected} />
      )}
      {selectedStudent && !selectedVisible && (
        <p className="mb-1.5 text-xs text-gray-500">
          Seleccionado: {selectedStudent.lastName}, {selectedStudent.firstName}
        </p>
      )}
      <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-gray-400">
            Ningún alumno coincide con «{query.trim()}».
          </p>
        ) : (
          filtered.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2.5 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50 has-[:checked]:bg-indigo-50"
            >
              <input
                type="radio"
                name="studentId"
                value={s.id}
                checked={selected === s.id}
                onChange={() => setSelected(s.id)}
                className="accent-indigo-600"
              />
              <Avatar
                name={`${s.firstName} ${s.lastName}`}
                className="h-6 w-6 text-[9px]"
              />
              <span className="text-gray-900">
                {s.lastName}, {s.firstName}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

/** Tipo de anotación como chips de radio con el color de cada tipo. */
function TypeChips() {
  const [type, setType] = useState(NOTE_TYPES[0].value);
  return (
    <fieldset>
      <legend className="label">Tipo</legend>
      <div className="flex flex-wrap gap-1.5">
        {NOTE_TYPES.map((t) => {
          const active = type === t.value;
          return (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={active}
                onChange={() => setType(t.value)}
                className="peer sr-only"
              />
              <span
                className="chip border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-1"
                style={
                  active
                    ? {
                        background: t.color,
                        color: readableText(t.color),
                        borderColor: t.color,
                      }
                    : {
                        background: `${t.color}14`,
                        color: t.color,
                        borderColor: "transparent",
                      }
                }
              >
                {t.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
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
  const toast = useToast();

  // Guarda la anotación y, si es de convivencia, avisa del acumulado:
  // al llegar al límite corresponde tramitar un parte.
  async function saveNote(formData: FormData) {
    const studentId = String(formData.get("studentId") ?? "");
    const type = String(formData.get("type") ?? "");
    const result = await createStudentNoteAction(formData);
    const student = students.find((s) => s.id === studentId);
    const name = student ? `${student.firstName} ${student.lastName}` : "El alumno";
    const pending = result?.pendingConvivencias;
    if (type === "parte") {
      toast.info(`Parte registrado: el contador de convivencias de ${name} vuelve a cero.`);
    } else if (pending != null && pending >= CONVIVENCIA_LIMIT) {
      toast.warning(
        `${name} acumula ${pending} convivencias sin parte: corresponde tramitar un parte.`
      );
    } else if (pending != null && pending > 0) {
      toast.info(
        `${name} lleva ${plural(pending, "convivencia")} de ${CONVIVENCIA_LIMIT} desde el último parte.`
      );
    }
  }

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
              action={saveNote}
              close={close}
              className="space-y-4"
              successMessage="Anotación guardada."
              validate={(formData) =>
                formData.get("studentId") ? null : "Elige un alumno."
              }
            >
              <input type="hidden" name="classGroupId" value={classGroupId} />
              <input type="hidden" name="date" value={date} />
              {sessionId && (
                <input type="hidden" name="sessionId" value={sessionId} />
              )}
              <StudentPicker students={students} />
              <TypeChips />
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
                <ConfirmDeleteButton
                  action={deleteStudentNoteAction}
                  fields={{ id: n.id, classGroupId }}
                  title="Eliminar anotación"
                  message={`Se eliminará esta anotación sobre ${n.studentName}.`}
                  successMessage="Anotación eliminada."
                  className="text-xs text-gray-300 hover:text-red-500"
                >
                  ✕
                </ConfirmDeleteButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
