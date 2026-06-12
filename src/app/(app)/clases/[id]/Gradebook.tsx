"use client";

import Link from "next/link";
import { Fragment, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/Spinner";
import {
  AutosaveIndicator,
  focusNextOnEnter,
  useAutosave,
} from "@/components/Autosave";
import { ControlledModal } from "@/components/Modal";
import { PlusIcon } from "@/components/icons";
import { classAverage } from "@/lib/grades";
import { plural } from "@/lib/plural";
import { NewAssessmentForm } from "./NewAssessmentForm";
import { saveGradebookAction } from "./actions";

type Column = {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  weight: number | null;
  isGroup: boolean;
};
type Row = {
  studentId: string;
  name: string;
  scores: Record<string, number | null>; // assessmentId -> score
};
type Group = {
  id: string;
  name: string;
  memberIds: string[];
  memberNames: string[];
};

/** Propuesta pendiente de extender una nota grupal a los compañeros. */
type Spread = {
  key: string;
  colId: string;
  studentId: string;
  value: string;
  groupName: string;
  mates: { id: string; name: string }[];
};

const TYPE_COLOR: Record<string, string> = {
  examen: "#dc2626",
  tarea: "#2563eb",
  trabajo: "#7c3aed",
  actividad: "#059669",
  otro: "#6b7280",
};

function studentAverage(row: Row, columns: Column[]): number | null {
  return classAverage(
    columns.map((c) => ({
      score: row.scores[c.id] ?? null,
      maxScore: c.maxScore,
      weight: c.weight,
    }))
  ).value;
}

function avgColor(avg: number | null): string {
  if (avg == null) return "#9ca3af";
  if (avg < 5) return "#dc2626";
  if (avg < 7) return "#d97706";
  return "#059669";
}

/** «María, Juan y Lucía» a partir de una lista de nombres. */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/**
 * El cuaderno es la única superficie de calificación de la clase: la
 * columna «+» crea evaluables, la cabecera de cada columna abre su detalle
 * bajo la rejilla, y en los evaluables grupales escribir una nota ofrece
 * extenderla a los compañeros de grupo.
 */
export function Gradebook({
  classGroupId,
  columns,
  rows,
  groups = [],
  selectedId = null,
}: {
  classGroupId: string;
  columns: Column[];
  rows: Row[];
  groups?: Group[];
  selectedId?: string | null;
}) {
  const { formRef, status, savedAt, onInput, save } =
    useAutosave(saveGradebookAction);
  const [creating, setCreating] = useState(false);
  const [spread, setSpread] = useState<Spread | null>(null);
  // Propuestas descartadas (columna|alumno|valor): no se vuelven a ofrecer.
  const dismissed = useRef(new Set<string>());

  // Alumno → su grupo, solo si pertenece exactamente a uno; con varios
  // grupos la extensión sería ambigua y se deja al editor grupal del detalle.
  const soleGroupByStudent = useMemo(() => {
    const count = new Map<string, number>();
    const byStudent = new Map<string, Group>();
    for (const g of groups) {
      for (const id of g.memberIds) {
        count.set(id, (count.get(id) ?? 0) + 1);
        byStudent.set(id, g);
      }
    }
    const m = new Map<string, Group>();
    for (const [id, g] of byStudent) {
      if (count.get(id) === 1) m.set(id, g);
    }
    return m;
  }, [groups]);

  if (rows.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-gray-400">
        Matricula alumnos en la clase para usar el cuaderno.
      </div>
    );
  }

  function offerSpread(c: Column, r: Row, rawValue: string) {
    if (!c.isGroup) return;
    const value = rawValue.trim();
    const num = Number(value);
    if (!value || !Number.isFinite(num) || num < 0 || num > c.maxScore) return;
    const group = soleGroupByStudent.get(r.studentId);
    if (!group) return;
    const key = `${c.id}|${r.studentId}|${value}`;
    if (dismissed.current.has(key)) return;
    const mates = group.memberIds
      .map((id, i) => ({ id, name: group.memberNames[i] }))
      .filter((m) => {
        if (m.id === r.studentId) return false;
        const input = formRef.current?.elements.namedItem(
          `grade_${c.id}_${m.id}`
        );
        return (
          input instanceof HTMLInputElement && input.value.trim() !== value
        );
      });
    if (mates.length === 0) return;
    setSpread({
      key,
      colId: c.id,
      studentId: r.studentId,
      value,
      groupName: group.name,
      mates,
    });
  }

  function applySpread() {
    if (!spread || !formRef.current) return;
    for (const m of spread.mates) {
      const input = formRef.current.elements.namedItem(
        `grade_${spread.colId}_${m.id}`
      );
      if (input instanceof HTMLInputElement) input.value = spread.value;
    }
    setSpread(null);
    void save();
  }

  function dismissSpread() {
    if (spread) dismissed.current.add(spread.key);
    setSpread(null);
  }

  // La cabecera alterna abrir/cerrar el detalle del evaluable bajo la rejilla.
  const detailHref = (id: string) =>
    `/clases/${classGroupId}?tab=calificaciones${
      id === selectedId ? "" : `&eval=${id}`
    }`;

  return (
    <>
      {columns.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-gray-400">
            Crea tareas, exámenes o trabajos para empezar a calificar.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreating(true)}
          >
            <PlusIcon /> Nuevo evaluable
          </button>
        </div>
      ) : (
        <form
          ref={formRef}
          onInput={onInput}
          onKeyDown={focusNextOnEnter}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <input type="hidden" name="classGroupId" value={classGroupId} />

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Las notas se guardan solas; Enter baja al siguiente alumno.
              Pulsa una cabecera para abrir el detalle del evaluable.{" "}
              {columns.every((c) => c.weight != null)
                ? "La media pondera cada evaluable por su peso."
                : columns.some((c) => c.weight != null)
                  ? `Media simple sobre 10: ${plural(
                      columns.filter((c) => c.weight == null).length,
                      "evaluable sin peso impide",
                      "evaluables sin peso impiden"
                    )} ponderar.`
                  : "La media es una media simple normalizada sobre 10."}
            </p>
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={status} savedAt={savedAt} />
              <button
                type="submit"
                className="btn-secondary"
                disabled={status === "saving"}
              >
                {status === "saving" && <Spinner className="h-4 w-4" />}
                {status === "saving" ? "Guardando…" : "Guardar ahora"}
              </button>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Alumno
                  </th>
                  {columns.map((c) => (
                    <th key={c.id} className="px-2 py-2 text-center align-bottom">
                      <Link
                        href={detailHref(c.id)}
                        title={`${c.title} · ${c.type} · máx. ${c.maxScore}${
                          c.weight != null ? ` · peso ${c.weight}%` : ""
                        } · abrir detalle`}
                        aria-expanded={selectedId === c.id}
                        className={`mx-auto flex w-24 flex-col items-center gap-1 rounded-lg px-1 py-1 transition ${
                          selectedId === c.id
                            ? "bg-indigo-50 ring-1 ring-indigo-200"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span
                          className="chip text-[10px]"
                          style={{
                            background: `${TYPE_COLOR[c.type] ?? TYPE_COLOR.otro}1a`,
                            color: TYPE_COLOR[c.type] ?? TYPE_COLOR.otro,
                          }}
                        >
                          {c.type}
                          {c.isGroup ? " · grupo" : ""}
                        </span>
                        <span className="line-clamp-2 text-xs font-medium text-gray-700">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          /{c.maxScore}
                          {c.weight != null ? ` · ${c.weight}%` : ""}
                        </span>
                      </Link>
                    </th>
                  ))}
                  <th className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      title="Nuevo evaluable (añade una columna)"
                      aria-label="Nuevo evaluable"
                      className="mx-auto flex h-9 w-14 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <PlusIcon />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Media
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => {
                  const avg = studentAverage(r, columns);
                  return (
                    <Fragment key={r.studentId}>
                      <tr className="hover:bg-gray-50/60">
                        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-gray-900">
                          {r.name}
                        </td>
                        {columns.map((c) => (
                          <td key={c.id} className="px-2 py-1.5 text-center">
                            <input
                              name={`grade_${c.id}_${r.studentId}`}
                              data-col={c.id}
                              type="number"
                              step="0.01"
                              min={0}
                              max={c.maxScore}
                              defaultValue={r.scores[c.id] ?? ""}
                              aria-label={`Nota de ${r.name} en ${c.title}`}
                              onBlur={(e) =>
                                offerSpread(c, r, e.currentTarget.value)
                              }
                              className="input w-20 px-2 py-1 text-center"
                            />
                          </td>
                        ))}
                        <td />
                        <td className="px-3 py-1.5 text-center">
                          <span
                            className="font-semibold"
                            style={{ color: avgColor(avg) }}
                          >
                            {avg == null ? "—" : avg.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                      {spread?.studentId === r.studentId && (
                        <tr>
                          <td
                            colSpan={columns.length + 3}
                            className="border-y border-indigo-100 bg-indigo-50/70 px-4 py-2"
                          >
                            <div
                              role="status"
                              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-indigo-900"
                            >
                              <span>
                                ¿Aplicar <strong>{spread.value}</strong> también
                                a {listNames(spread.mates.map((m) => m.name))}{" "}
                                (grupo {spread.groupName})?
                              </span>
                              <span className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn-primary px-2.5 py-1 text-xs"
                                  onClick={applySpread}
                                >
                                  Aplicar al grupo
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost px-2.5 py-1 text-xs"
                                  onClick={dismissSpread}
                                >
                                  Solo a este alumno
                                </button>
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {/* Fila de medias por evaluable */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                    Media clase
                  </td>
                  {columns.map((c) => {
                    const vals = rows
                      .map((r) => r.scores[c.id] ?? null)
                      .filter((v): v is number => v != null);
                    const m =
                      vals.length > 0
                        ? vals.reduce((a, b) => a + b, 0) / vals.length
                        : null;
                    return (
                      <td key={c.id} className="px-2 py-2 text-center text-gray-600">
                        {m == null ? "—" : m.toFixed(2)}
                      </td>
                    );
                  })}
                  <td />
                  <td className="px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      )}

      {/* El dialog vive fuera del form del cuaderno (un form no puede anidar otro) */}
      <ControlledModal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo elemento evaluable"
      >
        {(close) => <NewAssessmentForm classGroupId={classGroupId} close={close} />}
      </ControlledModal>
    </>
  );
}
