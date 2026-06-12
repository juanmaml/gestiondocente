"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ModalForm, ModalSubmit } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { SunIcon } from "@/components/icons";
import { readableText } from "@/lib/colors";
import { WEEKDAYS, timeToMinutes } from "@/lib/dates";
import { createScheduleEntryAction } from "../horario/actions";
import { validateTimeRange } from "../horario/ScheduleForm";
import { deleteHolidayAction } from "./actions";

const PX_PER_MIN = 1.1;
/** Redondeo del ratón a múltiplos de 5 minutos. */
const SNAP = 5;
/** Arrastre mínimo (min) para abrir el modal de creación. */
const MIN_DRAG = 10;
const STORAGE_KEY = "calendario.rango";

type Day = { value: number; label: string; dateKey: string; isToday: boolean };
type Entry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classGroupId: string;
  subjectName: string;
  className: string;
  color: string;
};
type ClassOption = { id: string; label: string };
type Holiday = { id: string; dateKey: string; name: string };

function hhmm(min: number) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Rejilla semanal interactiva del calendario:
 * - Rango horario visible configurable (se recuerda en este dispositivo).
 * - Línea horizontal que sigue al ratón indicando la hora.
 * - Crear franjas arrastrando sobre una columna de día; al soltar se abre un
 *   modal con la clase, el día y las horas precargadas.
 */
export function WeekGrid({
  days,
  entries,
  classOptions,
  holidays = [],
}: {
  days: Day[];
  entries: Entry[];
  classOptions: ClassOption[];
  holidays?: Holiday[];
}) {
  const holidayByDate = new Map(holidays.map((h) => [h.dateKey, h]));
  // Rango preferido en horas (puede ampliarse si hay franjas fuera de él).
  const [prefStart, setPrefStart] = useState(8);
  const [prefEnd, setPrefEnd] = useState(15);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const v = JSON.parse(raw);
      if (
        Number.isInteger(v.start) &&
        Number.isInteger(v.end) &&
        v.start >= 0 &&
        v.end <= 24 &&
        v.start < v.end
      ) {
        setPrefStart(v.start);
        setPrefEnd(v.end);
      }
    } catch {
      // Valor corrupto: se ignora y quedan los valores por defecto.
    }
  }, []);

  function setRange(start: number, end: number) {
    setPrefStart(start);
    setPrefEnd(end);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ start, end }));
    } catch {
      // Sin almacenamiento disponible: la preferencia no se persiste.
    }
  }

  // Rango efectivo: el preferido, ampliado para que ninguna franja quede fuera.
  let startMin = prefStart * 60;
  let endMin = prefEnd * 60;
  for (const e of entries) {
    startMin = Math.min(startMin, timeToMinutes(e.startTime));
    endMin = Math.max(endMin, timeToMinutes(e.endTime));
  }
  startMin = Math.floor(startMin / 60) * 60;
  endMin = Math.ceil(endMin / 60) * 60;
  const gridHeight = (endMin - startMin) * PX_PER_MIN;

  const hourMarks: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) hourMarks.push(m);

  // ── Interacción con el ratón ─────────────────────────────
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hoverMin, setHoverMin] = useState<number | null>(null);
  const [drag, setDrag] = useState<{
    day: number;
    anchor: number;
    current: number;
  } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const [draft, setDraft] = useState<{
    day: number;
    start: number;
    end: number;
  } | null>(null);

  function minutesFromY(clientY: number) {
    const rect = bodyRef.current?.getBoundingClientRect();
    if (!rect) return startMin;
    const raw = startMin + (clientY - rect.top) / PX_PER_MIN;
    const snapped = Math.round(raw / SNAP) * SNAP;
    return Math.min(Math.max(snapped, startMin), endMin);
  }

  // Mientras se arrastra, sigue el ratón aunque salga de la columna.
  useEffect(() => {
    if (!drag) return;
    function onMove(e: MouseEvent) {
      const min = minutesFromY(e.clientY);
      setDrag((d) => (d ? { ...d, current: min } : d));
    }
    function onUp() {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const start = Math.min(d.anchor, d.current);
      // 24:00 no es una hora válida para guardar; se limita a 23:55.
      const end = Math.min(Math.max(d.anchor, d.current), 23 * 60 + 55);
      if (end - start >= MIN_DRAG) setDraft({ day: d.day, start, end });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  // Cierra el modal de creación con Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDraft(null);
    }
    if (draft) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [draft]);

  const dragStart = drag ? Math.min(drag.anchor, drag.current) : null;
  const dragEnd = drag ? Math.max(drag.anchor, drag.current) : null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Mantén pulsado y arrastra sobre un día para crear una franja.
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Horario visible
          <select
            value={prefStart}
            onChange={(e) => setRange(Number(e.target.value), prefEnd)}
            className="input w-auto py-1"
            aria-label="Hora de inicio del calendario"
          >
            {Array.from({ length: 24 }, (_, h) => h)
              .filter((h) => h < prefEnd)
              .map((h) => (
                <option key={h} value={h}>
                  {hhmm(h * 60)}
                </option>
              ))}
          </select>
          –
          <select
            value={prefEnd}
            onChange={(e) => setRange(prefStart, Number(e.target.value))}
            className="input w-auto py-1"
            aria-label="Hora de fin del calendario"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1)
              .filter((h) => h > prefStart)
              .map((h) => (
                <option key={h} value={h}>
                  {hhmm(h * 60)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="card overflow-x-auto p-4">
        <div className="min-w-[760px]">
          {/* Cabeceras de día */}
          <div className="flex">
            <div className="w-14 shrink-0" />
            <div className="grid flex-1 grid-cols-5 gap-2">
              {days.map((day) => {
                const holiday = holidayByDate.get(day.dateKey);
                return (
                  <div
                    key={day.value}
                    className={`mb-2 rounded-md py-1 text-center text-sm font-medium ${
                      day.isToday ? "bg-indigo-600 text-white" : "text-gray-600"
                    }`}
                  >
                    {day.label}
                    {holiday && (
                      <span
                        className={`mt-0.5 flex items-center justify-center gap-1 text-[11px] font-normal ${
                          // Sobre el índigo de «hoy», el ámbar oscuro no
                          // contrasta: se aclara.
                          day.isToday ? "text-amber-200" : "text-amber-700"
                        }`}
                      >
                        <SunIcon className="h-3 w-3" /> {holiday.name}
                        <ConfirmDeleteButton
                          action={deleteHolidayAction}
                          fields={{ id: holiday.id }}
                          title="Quitar festivo"
                          message={`Se quitará el festivo «${holiday.name}» (${day.label}). Las sesiones de ese día volverán a contar en la navegación.`}
                          confirmLabel="Quitar"
                          pendingLabel="Quitando…"
                          successMessage="Festivo eliminado."
                          className="opacity-50 transition hover:opacity-100"
                        >
                          ✕
                        </ConfirmDeleteButton>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cuerpo: gutter de horas + columnas, con línea de hover encima */}
          <div
            ref={bodyRef}
            className="relative flex"
            onMouseMove={(e) => setHoverMin(minutesFromY(e.clientY))}
            onMouseLeave={() => setHoverMin(null)}
          >
            {/* Columna de horas */}
            <div
              className="relative w-14 shrink-0"
              style={{ height: gridHeight }}
            >
              {hourMarks.map((m) => (
                <div
                  key={m}
                  className="absolute -translate-y-2 text-right text-xs text-gray-400"
                  style={{ top: (m - startMin) * PX_PER_MIN, right: 8 }}
                >
                  {hhmm(m)}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            <div className="grid flex-1 grid-cols-5 gap-2">
              {days.map((day) => {
                const holiday = holidayByDate.get(day.dateKey);
                const dayEntries = entries
                  .filter((e) => e.dayOfWeek === day.value)
                  .sort(
                    (a, b) =>
                      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                  );

                return (
                  <div
                    key={day.value}
                    className={`relative select-none rounded-lg ${
                      holiday
                        ? "bg-amber-50"
                        : "cursor-crosshair bg-gray-50"
                    }`}
                    style={{ height: gridHeight }}
                    onMouseDown={(e) => {
                      if (e.button !== 0 || holiday) return;
                      // Sobre una franja existente se navega, no se crea.
                      if ((e.target as HTMLElement).closest("a")) return;
                      e.preventDefault();
                      const min = minutesFromY(e.clientY);
                      setDrag({ day: day.value, anchor: min, current: min });
                    }}
                  >
                    {/* Líneas de hora */}
                    {hourMarks.slice(1).map((m) => (
                      <div
                        key={m}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: (m - startMin) * PX_PER_MIN }}
                      />
                    ))}

                    {/* Bloques de clase */}
                    {dayEntries.map((e) => {
                      const top =
                        (timeToMinutes(e.startTime) - startMin) * PX_PER_MIN;
                      const height =
                        (timeToMinutes(e.endTime) -
                          timeToMinutes(e.startTime)) *
                        PX_PER_MIN;
                      return (
                        <Link
                          key={e.id}
                          href={`/clases/${e.classGroupId}?date=${day.dateKey}&start=${e.startTime}&end=${e.endTime}`}
                          className={`absolute left-1 right-1 overflow-hidden rounded-md p-1.5 text-xs shadow-sm transition hover:brightness-95 ${
                            holiday ? "opacity-30 saturate-50" : ""
                          }`}
                          style={{
                            top,
                            height: Math.max(height, 30),
                            background: e.color,
                            color: readableText(e.color),
                          }}
                        >
                          <div className="font-semibold leading-tight">
                            {e.subjectName}
                          </div>
                          <div className="leading-tight opacity-90">
                            {e.className}
                          </div>
                          <div className="opacity-80">
                            {e.startTime}–{e.endTime}
                          </div>
                        </Link>
                      );
                    })}

                    {/* Selección en curso */}
                    {drag &&
                      drag.day === day.value &&
                      dragStart != null &&
                      dragEnd != null && (
                        <div
                          className="pointer-events-none absolute left-1 right-1 z-10 flex items-start justify-center rounded-md border-2 border-indigo-500 bg-indigo-500/15"
                          style={{
                            top: (dragStart - startMin) * PX_PER_MIN,
                            height: Math.max(
                              (dragEnd - dragStart) * PX_PER_MIN,
                              14
                            ),
                          }}
                        >
                          <span className="mt-0.5 rounded bg-indigo-600 px-1.5 py-px text-[11px] font-semibold text-white shadow">
                            {hhmm(dragStart)} – {hhmm(dragEnd)}
                          </span>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* Línea con la hora bajo el ratón */}
            {hoverMin != null && !drag && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20"
                style={{ top: (hoverMin - startMin) * PX_PER_MIN }}
              >
                <div className="border-t border-dashed border-indigo-400" />
                <span className="absolute -top-2 left-0 rounded bg-indigo-600 px-1 py-px text-[10px] font-medium text-white">
                  {hhmm(hoverMin)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de creación tras el arrastre */}
      {draft && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[12vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDraft(null);
          }}
        >
          <div
            className="card w-full max-w-md p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Nueva franja
              </h2>
              <button
                className="btn-ghost px-2 py-1"
                onClick={() => setDraft(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <ModalForm
              action={createScheduleEntryAction}
              close={() => setDraft(null)}
              className="space-y-4"
              successMessage="Franja añadida al horario."
              validate={validateTimeRange}
            >
              <div>
                <label className="label" htmlFor="cal-class">
                  Clase
                </label>
                <select
                  id="cal-class"
                  name="classGroupId"
                  className="input"
                  autoFocus
                  required
                >
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="cal-day">
                  Día
                </label>
                <select
                  id="cal-day"
                  name="dayOfWeek"
                  className="input"
                  defaultValue={draft.day}
                  required
                >
                  {WEEKDAYS.slice(0, 5).map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.long}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="cal-start">
                    Inicio
                  </label>
                  <input
                    id="cal-start"
                    name="startTime"
                    type="time"
                    className="input"
                    defaultValue={hhmm(draft.start)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cal-end">
                    Fin
                  </label>
                  <input
                    id="cal-end"
                    name="endTime"
                    type="time"
                    className="input"
                    defaultValue={hhmm(draft.end)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </button>
                <ModalSubmit pendingLabel="Añadiendo…">
                  Añadir franja
                </ModalSubmit>
              </div>
            </ModalForm>
          </div>
        </div>
      )}
    </>
  );
}
