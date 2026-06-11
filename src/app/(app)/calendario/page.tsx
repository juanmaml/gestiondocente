import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import {
  WEEKDAYS,
  addDays,
  fromDateKey,
  startOfWeek,
  timeToMinutes,
  toDateKey,
  formatDateShort,
} from "@/lib/dates";
import { readableText } from "@/lib/colors";

const PX_PER_MIN = 1.1;

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireUser();
  const year = await getActiveYear(user.id);
  const sp = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseDate = sp.week ? fromDateKey(sp.week) : today;
  const monday = startOfWeek(baseDate);

  const prevWeek = toDateKey(addDays(monday, -7));
  const nextWeek = toDateKey(addDays(monday, 7));

  // Franjas del horario del usuario en el curso activo.
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      classGroup: { subject: { userId: user.id, academicYearId: year.id } },
    },
    include: {
      classGroup: { include: { subject: true } },
    },
  });

  const days = WEEKDAYS.slice(0, 5);

  // Rango horario del grid.
  let minStart = 8 * 60;
  let maxEnd = 15 * 60;
  for (const e of entries) {
    minStart = Math.min(minStart, timeToMinutes(e.startTime));
    maxEnd = Math.max(maxEnd, timeToMinutes(e.endTime));
  }
  minStart = Math.floor(minStart / 60) * 60;
  maxEnd = Math.ceil(maxEnd / 60) * 60;
  const totalMin = maxEnd - minStart;
  const gridHeight = totalMin * PX_PER_MIN;

  const hourMarks: number[] = [];
  for (let m = minStart; m <= maxEnd; m += 60) hourMarks.push(m);

  function hhmm(min: number) {
    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="mt-1 text-sm text-gray-500">
            Semana del {formatDateShort(monday)} · Curso {year.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendario?week=${prevWeek}`}
            className="btn-secondary"
            aria-label="Semana anterior"
          >
            ←
          </Link>
          <Link href="/calendario" className="btn-secondary">
            Hoy
          </Link>
          <Link
            href={`/calendario?week=${nextWeek}`}
            className="btn-secondary"
            aria-label="Semana siguiente"
          >
            →
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-medium text-gray-700">Tu horario está vacío</p>
          <p className="text-sm text-gray-400">
            Configura tu horario semanal para ver aquí tus clases.
          </p>
          <Link href="/horario" className="btn-primary mt-2">
            Configurar horario
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto p-4">
          <div className="flex min-w-[760px]">
            {/* Columna de horas */}
            <div className="w-14 shrink-0 pt-8">
              <div className="relative" style={{ height: gridHeight }}>
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute -translate-y-2 text-right text-xs text-gray-400"
                    style={{ top: (m - minStart) * PX_PER_MIN, right: 8 }}
                  >
                    {hhmm(m)}
                  </div>
                ))}
              </div>
            </div>

            {/* Columnas de días */}
            <div className="grid flex-1 grid-cols-5 gap-2">
              {days.map((day, idx) => {
                const date = addDays(monday, idx);
                const dateKey = toDateKey(date);
                const isToday = dateKey === toDateKey(today);
                const dayEntries = entries
                  .filter((e) => e.dayOfWeek === day.value)
                  .sort(
                    (a, b) =>
                      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                  );

                return (
                  <div key={day.value} className="flex flex-col">
                    <div
                      className={`mb-2 rounded-md py-1 text-center text-sm font-medium ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {day.short} {date.getDate()}
                    </div>
                    <div
                      className="relative rounded-lg bg-gray-50"
                      style={{ height: gridHeight }}
                    >
                      {/* Líneas de hora */}
                      {hourMarks.slice(1).map((m) => (
                        <div
                          key={m}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{ top: (m - minStart) * PX_PER_MIN }}
                        />
                      ))}
                      {/* Bloques */}
                      {dayEntries.map((e) => {
                        const top =
                          (timeToMinutes(e.startTime) - minStart) * PX_PER_MIN;
                        const height =
                          (timeToMinutes(e.endTime) -
                            timeToMinutes(e.startTime)) *
                          PX_PER_MIN;
                        const color = e.classGroup.subject.color;
                        return (
                          <Link
                            key={e.id}
                            href={`/clases/${e.classGroup.id}?date=${dateKey}&start=${e.startTime}&end=${e.endTime}`}
                            className="absolute left-1 right-1 overflow-hidden rounded-md p-1.5 text-xs shadow-sm transition hover:brightness-95"
                            style={{
                              top,
                              height: Math.max(height, 30),
                              background: color,
                              color: readableText(color),
                            }}
                          >
                            <div className="font-semibold leading-tight">
                              {e.classGroup.subject.name}
                            </div>
                            <div className="leading-tight opacity-90">
                              {e.classGroup.name}
                            </div>
                            <div className="opacity-80">
                              {e.startTime}–{e.endTime}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
