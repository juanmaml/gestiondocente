import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import { WEEKDAYS, timeToMinutes } from "@/lib/dates";
import { readableText } from "@/lib/colors";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NewScheduleButton } from "./ScheduleForm";
import { deleteScheduleEntryAction } from "./actions";

export default async function HorarioPage() {
  const user = await requireUser();
  const year = await getActiveYear(user.id);

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, academicYearId: year.id, deletedAt: null },
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

  // Aplana todas las franjas con info de asignatura/clase.
  const entries = subjects.flatMap((s) =>
    s.classGroups.flatMap((c) =>
      c.scheduleEntries.map((e) => ({
        ...e,
        subjectName: s.name,
        className: c.name,
        color: s.color,
      }))
    )
  );

  const days = WEEKDAYS.slice(0, 5); // Lun-Vie

  return (
    <div className="p-6">
      <PageHeader
        title="Horario semanal"
        subtitle="Configura las franjas de cada clase. Aparecerán en tu calendario."
      >
        <NewScheduleButton classes={classOptions} />
      </PageHeader>

      {classOptions.length === 0 ? (
        <EmptyState
          title="Primero crea asignaturas y clases"
          hint="Necesitas al menos una clase para configurar el horario."
        />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Horario vacío"
          hint="Añade franjas para construir tu horario semanal."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {days.map((day) => {
            const dayEntries = entries
              .filter((e) => e.dayOfWeek === day.value)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            return (
              <div key={day.value} className="card p-3">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  {day.long}
                </h3>
                <div className="space-y-2">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-gray-300">—</p>
                  ) : (
                    dayEntries.map((e) => (
                      <div
                        key={e.id}
                        className="group rounded-lg px-2.5 py-2 text-xs"
                        style={{
                          background: e.color,
                          color: readableText(e.color),
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold">{e.subjectName}</span>
                          <ConfirmDeleteButton
                            action={deleteScheduleEntryAction}
                            fields={{ id: e.id }}
                            title="Eliminar franja"
                            message={`Se eliminará la franja de ${e.subjectName} · ${e.className} (${e.startTime}–${e.endTime}) del horario y del calendario.`}
                            successMessage="Franja eliminada."
                            className="rounded opacity-0 transition group-hover:opacity-80 hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                          >
                            ✕
                          </ConfirmDeleteButton>
                        </div>
                        <div>{e.className}</div>
                        <div className="opacity-80">
                          {e.startTime}–{e.endTime}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
