import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import {
  WEEKDAYS,
  addDays,
  fromDateKey,
  startOfWeek,
  toDateKey,
  formatDateShort,
} from "@/lib/dates";
import { WeekGrid } from "./WeekGrid";
import { HolidayButton } from "./HolidayButton";

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

  // Asignaturas con sus clases y franjas del curso activo. Las clases también
  // alimentan el selector del modal de creación por arrastre.
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, academicYearId: year.id },
    orderBy: { name: "asc" },
    include: {
      classGroups: {
        orderBy: { name: "asc" },
        include: { scheduleEntries: true },
      },
    },
  });

  const classOptions = subjects.flatMap((s) =>
    s.classGroups.map((c) => ({
      id: c.id,
      label: `${s.name} · ${c.name}`,
    }))
  );

  const entries = subjects.flatMap((s) =>
    s.classGroups.flatMap((c) =>
      c.scheduleEntries.map((e) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        classGroupId: c.id,
        subjectName: s.name,
        className: c.name,
        color: s.color,
      }))
    )
  );

  const days = WEEKDAYS.slice(0, 5).map((d, idx) => {
    const date = addDays(monday, idx);
    const dateKey = toDateKey(date);
    return {
      value: d.value,
      label: `${d.short} ${date.getDate()}`,
      dateKey,
      isToday: dateKey === toDateKey(today),
    };
  });

  // Festivos de la semana mostrada.
  const holidayRows = await prisma.holiday.findMany({
    where: {
      userId: user.id,
      date: { gte: monday, lt: addDays(monday, 7) },
    },
  });
  const holidays = holidayRows.map((h) => ({
    id: h.id,
    dateKey: toDateKey(h.date),
    name: h.name,
  }));

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
          <HolidayButton defaultDate={toDateKey(monday)} />
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

      {classOptions.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-medium text-gray-700">
            Primero crea asignaturas y clases
          </p>
          <p className="text-sm text-gray-400">
            Necesitas al menos una clase para poder añadir franjas al
            calendario.
          </p>
          <Link href="/asignaturas" className="btn-primary mt-2">
            Ir a asignaturas
          </Link>
        </div>
      ) : (
        <WeekGrid
          days={days}
          entries={entries}
          classOptions={classOptions}
          holidays={holidays}
        />
      )}
    </div>
  );
}
