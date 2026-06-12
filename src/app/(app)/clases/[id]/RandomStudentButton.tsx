"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DiceIcon } from "@/components/icons";

type Student = { id: string; firstName: string; lastName: string };

/**
 * Elige un alumno al azar sin repetir: los ya elegidos se recuerdan por clase
 * en este dispositivo y, cuando han salido todos, la ronda se reinicia.
 */
export function RandomStudentButton({
  classGroupId,
  students,
}: {
  classGroupId: string;
  students: Student[];
}) {
  const storageKey = `random.${classGroupId}`;
  const [picked, setPicked] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);
  const [roundRestarted, setRoundRestarted] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function readUsed(): string[] {
    try {
      const raw = localStorage.getItem(storageKey);
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }

  function pick() {
    if (students.length === 0) return;
    let used = readUsed().filter((id) => students.some((s) => s.id === id));
    let pool = students.filter((s) => !used.includes(s.id));
    let restarted = false;
    if (pool.length === 0) {
      used = [];
      pool = students;
      restarted = true;
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    try {
      localStorage.setItem(storageKey, JSON.stringify([...used, chosen.id]));
    } catch {
      // Sin almacenamiento: la ronda no se recuerda entre recargas.
    }
    setPicked(chosen);
    setRoundRestarted(restarted);
    setOpen(true);
  }

  const remaining =
    students.length -
    readUsed().filter((id) => students.some((s) => s.id === id)).length;

  return (
    <>
      <button
        type="button"
        onClick={pick}
        disabled={students.length === 0}
        className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/30 disabled:opacity-40"
        title="Elegir un alumno al azar (sin repetir hasta completar la ronda)"
      >
        <span className="flex items-center gap-1.5">
          <DiceIcon /> Al azar
        </span>
      </button>

      {open && picked && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[16vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="card w-full max-w-sm p-6 text-center shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alumno elegido al azar"
          >
            <div className="flex flex-col items-center gap-3">
              <Avatar
                name={`${picked.firstName} ${picked.lastName}`}
                className="h-16 w-16 text-xl"
              />
              <p className="text-xl font-bold text-gray-900">
                {picked.firstName} {picked.lastName}
              </p>
              <p className="text-xs text-gray-400">
                {roundRestarted
                  ? "Ronda completada: vuelve a empezar."
                  : `Quedan ${Math.max(remaining, 0)} alumno(s) en esta ronda.`}
              </p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
              <button type="button" className="btn-primary" onClick={pick}>
                <DiceIcon /> Otro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
