"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { SearchIcon } from "@/components/icons";
import { deleteStudentAction } from "./actions";

type Chip = { id: string; label: string; color: string };
type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  chips: Chip[];
};

/** Normaliza para buscar sin distinguir mayúsculas ni tildes. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function StudentsTable({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return students;
    return students.filter((s) =>
      fold(
        `${s.firstName} ${s.lastName} ${s.email ?? ""} ${s.chips
          .map((c) => c.label)
          .join(" ")}`
      ).includes(q)
    );
  }, [students, query]);

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <label htmlFor="student-search" className="sr-only">
          Buscar alumnos
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            id="student-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o clase…"
            className="input pl-9"
          />
        </div>
        {query && (
          <p className="mt-1.5 text-xs text-gray-400">
            {visible.length} de {students.length} alumno(s)
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card px-6 py-12 text-center text-gray-400">
          Ningún alumno coincide con «{query}».
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Alumno</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Clases (curso activo)</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/alumnos/${s.id}`}
                      className="flex items-center gap-2.5 font-medium text-gray-900 hover:text-indigo-600"
                    >
                      <Avatar name={`${s.firstName} ${s.lastName}`} />
                      <span className="hover:underline">
                        {s.lastName}, {s.firstName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{s.email ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {s.chips.length === 0 ? (
                        <span className="text-gray-400">Sin clases este curso</span>
                      ) : (
                        s.chips.map((c) => (
                          <span
                            key={c.id}
                            className="chip"
                            style={{
                              background: `${c.color}22`,
                              color: c.color,
                            }}
                          >
                            {c.label}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ConfirmDeleteButton
                      action={deleteStudentAction}
                      fields={{ id: s.id }}
                      title="Eliminar alumno"
                      message={`Se eliminará a ${s.firstName} ${s.lastName} junto con sus matrículas, calificaciones y anotaciones. Esta acción no se puede deshacer.`}
                      successMessage="Alumno eliminado."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
