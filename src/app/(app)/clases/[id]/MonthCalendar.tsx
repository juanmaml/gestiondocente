import Link from "next/link";
import { WEEKDAYS, isoDay, monthLabel, toDateKey } from "@/lib/dates";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export type DayMarks = {
  hasSession?: boolean;
  hasNotes?: boolean;
  hasAssessment?: boolean;
  hasIncident?: boolean;
};

/**
 * Vista calendario mensual de una clase. Marca los días con sesiones,
 * anotaciones, evaluaciones e incidencias. Server component.
 */
export function MonthCalendar({
  classGroupId,
  year,
  month, // 0-11
  marks,
  scheduledDows,
}: {
  classGroupId: string;
  year: number;
  month: number;
  marks: Map<string, DayMarks>;
  scheduledDows: Set<number>;
}) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = isoDay(first) - 1; // huecos antes del día 1
  const todayKey = toDateKey(new Date());

  const prevMonth = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, "0")}`;
  const nextMonth = month === 11 ? `${year + 1}-01` : `${year}-${String(month + 2).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold capitalize text-gray-900">
          {monthLabel(year, month)}
        </h3>
        <div className="flex gap-1">
          <Link
            href={`/clases/${classGroupId}?tab=historial&vista=mes&month=${prevMonth}`}
            className="btn-ghost px-2 py-1"
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon />
          </Link>
          <Link
            href={`/clases/${classGroupId}?tab=historial&vista=mes&month=${nextMonth}`}
            className="btn-ghost px-2 py-1"
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div
            key={d.value}
            className="py-1 text-xs font-medium uppercase text-gray-400"
          >
            {d.short}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`x${i}`} />;
          const date = new Date(year, month, day);
          const key = toDateKey(date);
          const m = marks.get(key);
          const scheduled = scheduledDows.has(isoDay(date));
          const isToday = key === todayKey;

          const inner = (
            <>
              <span
                className={`text-sm ${
                  isToday
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white"
                    : "text-gray-700"
                }`}
              >
                {day}
              </span>
              <span className="mt-0.5 flex h-1.5 justify-center gap-0.5">
                {m?.hasNotes && (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-500" title="Anotaciones" />
                )}
                {m?.hasAssessment && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Evaluación" />
                )}
                {m?.hasIncident && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" title="Incidencia" />
                )}
                {m?.hasSession && !m.hasNotes && !m.hasAssessment && !m.hasIncident && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" title="Sesión" />
                )}
              </span>
            </>
          );

          return scheduled || m ? (
            <Link
              key={key}
              href={`/clases/${classGroupId}?date=${key}`}
              className={`flex flex-col items-center rounded-lg py-1.5 transition hover:bg-indigo-50 ${
                scheduled ? "bg-gray-50" : ""
              }`}
            >
              {inner}
            </Link>
          ) : (
            <div key={key} className="flex flex-col items-center py-1.5 opacity-50">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Sesión con contenido
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" /> Anotaciones
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Evaluación
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Incidencia
        </span>
      </div>
    </div>
  );
}
