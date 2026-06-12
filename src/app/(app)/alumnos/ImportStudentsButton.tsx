"use client";

import { useMemo, useState } from "react";
import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { useToast } from "@/components/Toaster";
import { UploadIcon } from "@/components/icons";
import { plural } from "@/lib/plural";
import { parseStudentList } from "@/lib/students";
import { importStudentsAction } from "./actions";

type ClassOption = { id: string; label: string };

/**
 * Importación de alumnos pegando una lista desde Excel o texto plano.
 * Con `fixedClassId` (ficha de clase) los alumnos se matriculan directamente
 * en esa clase; sin él se ofrece un selector opcional.
 */
export function ImportStudentsButton({
  classes = [],
  fixedClassId,
  triggerClassName = "btn-secondary",
}: {
  classes?: ClassOption[];
  fixedClassId?: string;
  triggerClassName?: string;
}) {
  const [text, setText] = useState("");
  const toast = useToast();
  const parsed = useMemo(() => parseStudentList(text), [text]);

  return (
    <Modal
      title="Importar lista de alumnos"
      trigger={(open) => (
        <button className={triggerClassName} onClick={open}>
          <UploadIcon /> Importar lista
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={async (formData) => {
            const result = await importStudentsAction(formData);
            toast.success(
              `${plural(result.created, "alumno importado", "alumnos importados")}${
                result.enrolled
                  ? result.created === 1
                    ? " y matriculado en la clase"
                    : " y matriculados en la clase"
                  : ""
              }.`
            );
            setText("");
          }}
          close={close}
          className="space-y-4"
          errorMessage="No se pudo importar la lista. Revisa el formato."
        >
          {fixedClassId && (
            <input type="hidden" name="classGroupId" value={fixedClassId} />
          )}
          <div>
            <label className="label" htmlFor="import-list">
              Un alumno por línea
            </label>
            <textarea
              id="import-list"
              name="list"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                "García Pérez, María\nLópez Ruiz, Juan\tjuan@correo.es\n…"
              }
              className="input resize-y font-mono text-xs"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Formato «Apellidos, Nombre» (recomendado) o «Nombre Apellidos».
              Email opcional separado por tabulador o «;»: puedes pegar dos
              columnas directamente desde Excel.
            </p>
          </div>

          {!fixedClassId && classes.length > 0 && (
            <div>
              <label className="label" htmlFor="import-class">
                Matricular en una clase (opcional)
              </label>
              <select id="import-class" name="classGroupId" className="input">
                <option value="">— No matricular —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {text.trim() !== "" && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {parsed.length === 0 ? (
                <span className="text-red-600">
                  No se reconoce ningún alumno en el texto.
                </span>
              ) : (
                <>
                  <span className="font-medium text-gray-700">
                    Se importará{parsed.length === 1 ? "" : "n"}{" "}
                    {plural(parsed.length, "alumno")}:
                  </span>{" "}
                  <span className="text-gray-500">
                    {parsed
                      .slice(0, 4)
                      .map((p) => `${p.lastName}, ${p.firstName}`)
                      .join(" · ")}
                    {parsed.length > 4 ? ` · y ${parsed.length - 4} más` : ""}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit pendingLabel="Importando…">
              Importar {parsed.length > 0 ? plural(parsed.length, "alumno") : ""}
            </ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
