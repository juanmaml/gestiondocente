import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  formatDateLong,
  formatDateShort,
  fromDateKey,
  toDateKey,
} from "@/lib/dates";
import { readableText } from "@/lib/colors";
import { adjacentSlots, defaultSlot } from "@/lib/sessions";
import { getActiveYear } from "@/lib/year";
import { pendingConvivenciasByStudent } from "@/lib/convivencia";
import { plural } from "@/lib/plural";
import { ConvivenciaBadge } from "@/components/ConvivenciaBadge";
import { SessionEditor } from "./SessionEditor";
import { StudentNotesPanel } from "./StudentNotesPanel";
import { RandomStudentButton } from "./RandomStudentButton";
import { CancelSessionButton } from "./CancelSessionButton";
import { ImportStudentsButton } from "../../alumnos/ImportStudentsButton";
import { EnrollButtons } from "./EnrollPanel";
import { GradesEditor } from "./GradesEditor";
import { GroupGradesEditor } from "./GroupGradesEditor";
import { NewGroupButton, GroupCard } from "./GroupsPanel";
import { MonthCalendar, type DayMarks } from "./MonthCalendar";
import { Gradebook } from "./Gradebook";
import { Avatar } from "@/components/Avatar";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ScrollIntoView } from "@/components/ScrollIntoView";
import {
  BanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  XIcon,
} from "@/components/icons";
import {
  deleteAssessmentAction,
  unenrollStudentAction,
} from "./actions";

const TABS = [
  { key: "sesion", label: "Sesión" },
  { key: "alumnos", label: "Alumnos" },
  { key: "calificaciones", label: "Calificaciones" },
  { key: "historial", label: "Historial" },
] as const;

// La ficha pasó de 7 a 4 pestañas; los enlaces guardados con las claves
// antiguas siguen funcionando.
const TAB_ALIASES: Record<string, { tab: string; vista?: string }> = {
  evaluaciones: { tab: "calificaciones" },
  cuaderno: { tab: "calificaciones" },
  grupos: { tab: "alumnos" },
  mes: { tab: "historial", vista: "mes" },
};

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    vista?: string;
    date?: string;
    start?: string;
    end?: string;
    eval?: string;
    month?: string;
  }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const cls = await prisma.classGroup.findFirst({
    where: { id, subject: { userId: user.id, deletedAt: null } },
    include: {
      subject: true,
      scheduleEntries: true,
      enrollments: {
        include: { student: true },
        orderBy: [
          { student: { lastName: "asc" } },
          { student: { firstName: "asc" } },
        ],
      },
    },
  });
  if (!cls) notFound();

  const students = cls.enrollments.map((e) => e.student);
  const alias = sp.tab ? TAB_ALIASES[sp.tab] : undefined;
  const tab =
    alias?.tab ??
    (TABS.some((t) => t.key === sp.tab) ? sp.tab! : "sesion");
  const vista = alias?.vista ?? sp.vista;
  const color = cls.subject.color;

  // Festivos del docente: se saltan al navegar entre sesiones.
  const holidayRows = await prisma.holiday.findMany({
    where: { userId: user.id },
  });
  const holidays = new Set(holidayRows.map((h) => toDateKey(h.date)));
  const holidayName = new Map(
    holidayRows.map((h) => [toDateKey(h.date), h.name])
  );

  // ── Resolución de la sesión mostrada ─────────────────────
  // Prioridad: fecha+hora de la URL > franja por defecto (hoy/próxima/última).
  let slot: { dateKey: string; startTime: string; endTime: string } | null = null;
  if (sp.date && sp.start && sp.end) {
    slot = { dateKey: sp.date, startTime: sp.start, endTime: sp.end };
  } else if (sp.date) {
    // Fecha sin hora (p.ej. desde el calendario mensual): busca sesión o franja de ese día.
    const d = fromDateKey(sp.date);
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    const entry = cls.scheduleEntries
      .filter((e) => e.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    if (entry) {
      slot = { dateKey: sp.date, startTime: entry.startTime, endTime: entry.endTime };
    } else {
      slot = { dateKey: sp.date, startTime: "09:00", endTime: "10:00" };
    }
  } else {
    slot = defaultSlot(cls.scheduleEntries, holidays);
  }

  // Datos de la sesión seleccionada.
  let session = null;
  let sessionNotes: {
    id: string;
    studentId: string;
    type: string;
    content: string;
    studentName: string;
  }[] = [];

  if (slot) {
    const dayStart = fromDateKey(slot.dateKey);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    session = await prisma.classSession.findFirst({
      where: {
        classGroupId: cls.id,
        startTime: slot.startTime,
        date: { gte: dayStart, lt: dayEnd },
      },
    });
    const notes = await prisma.studentNote.findMany({
      where: {
        classGroupId: cls.id,
        date: { gte: dayStart, lt: dayEnd },
      },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
    sessionNotes = notes.map((n) => ({
      id: n.id,
      studentId: n.studentId,
      type: n.type,
      content: n.content,
      studentName: `${n.student.firstName} ${n.student.lastName}`,
    }));
  }

  const { prev, next } = slot
    ? adjacentSlots(cls.scheduleEntries, slot.dateKey, slot.startTime, holidays)
    : { prev: null, next: null };

  const slotHref = (s: { dateKey: string; startTime: string; endTime: string }) =>
    `/clases/${cls.id}?date=${s.dateKey}&start=${s.startTime}&end=${s.endTime}`;

  const tabHref = (key: string) => {
    const base = `/clases/${cls.id}?tab=${key}`;
    return slot
      ? `${base}&date=${slot.dateKey}&start=${slot.startTime}&end=${slot.endTime}`
      : base;
  };

  // ── Datos por pestaña ────────────────────────────────────
  // Detalle del evaluable abierto desde la cabecera de columna del cuaderno.
  const selectedAssessment =
    tab === "calificaciones" && sp.eval
      ? await loadAssessment(cls.id, sp.eval)
      : null;

  let groups: {
    id: string;
    name: string;
    notes: string | null;
    memberIds: string[];
    memberNames: string[];
  }[] = [];
  if (tab === "alumnos" || tab === "calificaciones") {
    const raw = await prisma.studentGroup.findMany({
      where: { classGroupId: cls.id },
      orderBy: { name: "asc" },
      include: { memberships: { include: { student: true } } },
    });
    groups = raw.map((g) => ({
      id: g.id,
      name: g.name,
      notes: g.notes,
      memberIds: g.memberships.map((m) => m.studentId),
      memberNames: g.memberships.map(
        (m) => `${m.student.firstName} ${m.student.lastName}`
      ),
    }));
  }

  let history: Awaited<ReturnType<typeof loadHistory>> = [];
  if (tab === "historial" && vista !== "mes") history = await loadHistory(cls.id);

  let gradebook: {
    columns: {
      id: string;
      title: string;
      type: string;
      maxScore: number;
      weight: number | null;
      isGroup: boolean;
    }[];
    rows: {
      studentId: string;
      name: string;
      scores: Record<string, number | null>;
    }[];
  } | null = null;
  if (tab === "calificaciones") {
    const items = await prisma.assessmentItem.findMany({
      where: { classGroupId: cls.id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: { grades: true },
    });
    gradebook = {
      columns: items.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        maxScore: a.maxScore,
        weight: a.weight,
        isGroup: a.isGroup,
      })),
      rows: students.map((s) => ({
        studentId: s.id,
        name: `${s.lastName}, ${s.firstName}`,
        scores: Object.fromEntries(
          items.map((a) => [
            a.id,
            a.grades.find((g) => g.studentId === s.id)?.score ?? null,
          ])
        ),
      })),
    };
  }

  let monthData: {
    year: number;
    month: number;
    marks: Map<string, DayMarks>;
  } | null = null;
  if (tab === "historial" && vista === "mes") {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    if (sp.month && /^\d{4}-\d{2}$/.test(sp.month)) {
      const [yy, mm] = sp.month.split("-").map(Number);
      y = yy;
      m = mm - 1;
    }
    monthData = { year: y, month: m, marks: await loadMonthMarks(cls.id, y, m) };
  }

  return (
    <div className="p-6">
      {/* Migas de pan: dónde estoy y cómo vuelvo */}
      <nav
        aria-label="Migas de pan"
        className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-gray-400"
      >
        <Link href="/calendario" className="hover:text-indigo-600 hover:underline">
          Calendario
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/asignaturas" className="hover:text-indigo-600 hover:underline">
          {cls.subject.name}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-gray-700">{cls.name}</span>
      </nav>

      {/* Cabecera de la clase */}
      <div
        className="mb-5 rounded-xl p-5"
        style={{ background: color, color: readableText(color) }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm opacity-80">{cls.subject.name}</p>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm opacity-90">
            <span>{plural(students.length, "alumno")}</span>
            <RandomStudentButton
              classGroupId={cls.id}
              students={students.map((s) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Pestaña Sesión ── */}
      {tab === "sesion" && (
        <div>
          {!slot ? (
            <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="font-medium text-gray-700">
                Esta clase no tiene horario configurado
              </p>
              <Link href="/horario" className="btn-primary mt-1">
                Configurar horario
              </Link>
            </div>
          ) : (
            <>
              {/* Navegación de sesiones */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold capitalize text-gray-900">
                    {formatDateLong(fromDateKey(slot.dateKey))}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {slot.startTime} – {slot.endTime}
                    {session ? "" : " · sesión sin guardar todavía"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {prev ? (
                    <Link href={slotHref(prev)} className="btn-secondary">
                      <ChevronLeftIcon /> Sesión anterior
                    </Link>
                  ) : (
                    <span className="btn-secondary opacity-40" aria-disabled="true">
                      <ChevronLeftIcon /> Sesión anterior
                    </span>
                  )}
                  <Link href={`/clases/${cls.id}`} className="btn-secondary">
                    Hoy
                  </Link>
                  {next ? (
                    <Link href={slotHref(next)} className="btn-secondary">
                      Próxima sesión <ChevronRightIcon />
                    </Link>
                  ) : (
                    <span className="btn-secondary opacity-40" aria-disabled="true">
                      Próxima sesión <ChevronRightIcon />
                    </span>
                  )}
                  <CancelSessionButton
                    classGroupId={cls.id}
                    date={slot.dateKey}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    cancelled={session?.cancelled ?? false}
                  />
                </div>
              </div>

              {holidays.has(slot.dateKey) && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  <SunIcon />
                  <span>
                    Este día está marcado como festivo
                    {holidayName.get(slot.dateKey)
                      ? `: ${holidayName.get(slot.dateKey)}`
                      : ""}
                    . La navegación entre sesiones lo salta.
                  </span>
                </div>
              )}

              {session?.cancelled ? (
                <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <BanIcon className="h-8 w-8 text-gray-400" />
                  <p className="font-medium text-gray-700">
                    Sesión cancelada (no impartida)
                  </p>
                  <p className="text-sm text-gray-400">
                    Esta sesión no cuenta en el historial. Usa «Restaurar
                    sesión» si fue un error.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="card p-4 lg:col-span-2">
                    {/* La key remonta el editor al cambiar de sesión: sin ella,
                        los textareas no controlados conservarían el texto de la
                        sesión anterior. */}
                    <SessionEditor
                      key={`${slot.dateKey}-${slot.startTime}`}
                      classGroupId={cls.id}
                      date={slot.dateKey}
                      startTime={slot.startTime}
                      endTime={slot.endTime}
                      session={session}
                      next={next}
                    />
                  </div>
                  <StudentNotesPanel
                    classGroupId={cls.id}
                    date={slot.dateKey}
                    sessionId={session?.id ?? null}
                    students={students}
                    notes={sessionNotes}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Pestaña Alumnos: matrícula + grupos de trabajo ── */}
      {tab === "alumnos" && (
        <div>
          <AlumnosTab classGroupId={cls.id} students={students} userId={user.id} />

          <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Grupos de trabajo
              </h2>
              <p className="text-sm text-gray-500">
                Para evaluaciones grupales (Tecnología, proyectos…)
              </p>
            </div>
            <NewGroupButton classGroupId={cls.id} />
          </div>
          {groups.length === 0 ? (
            <div className="card px-6 py-8 text-center text-sm text-gray-400">
              Aún no hay grupos de trabajo en esta clase.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  classGroupId={cls.id}
                  group={g}
                  students={students}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pestaña Calificaciones: el cuaderno es la única superficie ── */}
      {tab === "calificaciones" && gradebook && (
        <div>
          <Gradebook
            classGroupId={cls.id}
            columns={gradebook.columns}
            rows={gradebook.rows}
            groups={groups}
            selectedId={selectedAssessment?.id ?? null}
          />

          {/* Detalle del evaluable abierto desde la cabecera de columna */}
          {selectedAssessment && (
            <>
              <ScrollIntoView watch={selectedAssessment.id} />
              <div className="card mt-6 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {selectedAssessment.title}
                    </h2>
                    <span className="chip bg-gray-100 capitalize text-gray-600">
                      {selectedAssessment.type}
                    </span>
                    {selectedAssessment.isGroup && (
                      <span className="chip bg-violet-50 text-violet-700">
                        Grupal
                      </span>
                    )}
                    {selectedAssessment.term && (
                      <span className="chip bg-sky-50 text-sky-700">
                        {selectedAssessment.term}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {selectedAssessment.date
                      ? formatDateShort(selectedAssessment.date) + " · "
                      : ""}
                    Máx. {selectedAssessment.maxScore}
                    {selectedAssessment.weight != null
                      ? ` · Peso ${selectedAssessment.weight}%`
                      : ""}
                    {selectedAssessment.gradedCount > 0
                      ? ` · ${plural(selectedAssessment.gradedCount, "calificación", "calificaciones")}`
                      : ""}
                  </p>
                  {selectedAssessment.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedAssessment.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ConfirmDeleteButton
                    action={deleteAssessmentAction}
                    fields={{ id: selectedAssessment.id, classGroupId: cls.id }}
                    title="Eliminar evaluable"
                    message={`Se eliminará «${selectedAssessment.title}» y todas sus calificaciones. Esta acción no se puede deshacer.`}
                    successMessage="Evaluable eliminado."
                  />
                  <Link
                    href={tabHref("calificaciones")}
                    scroll={false}
                    className="btn-ghost px-2 py-1"
                    aria-label="Cerrar detalle del evaluable"
                  >
                    <XIcon />
                  </Link>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                {selectedAssessment.isGroup ? (
                  <GroupGradesEditor
                    classGroupId={cls.id}
                    assessmentItemId={selectedAssessment.id}
                    maxScore={selectedAssessment.maxScore}
                    groups={groups.map((g) => ({
                      id: g.id,
                      name: g.name,
                      groupScore:
                        selectedAssessment.groupGrades.find(
                          (gg) => gg.studentGroupId === g.id
                        )?.score ?? null,
                      members: g.memberIds.map((sid) => {
                        const st = students.find((s) => s.id === sid);
                        return {
                          studentId: sid,
                          name: st
                            ? `${st.lastName}, ${st.firstName}`
                            : "(alumno)",
                          score:
                            selectedAssessment.grades.find(
                              (gr) => gr.studentId === sid
                            )?.score ?? null,
                        };
                      }),
                    }))}
                  />
                ) : (
                  <GradesEditor
                    classGroupId={cls.id}
                    assessmentItemId={selectedAssessment.id}
                    maxScore={selectedAssessment.maxScore}
                    rows={students.map((s) => {
                      const g = selectedAssessment.grades.find(
                        (gr) => gr.studentId === s.id
                      );
                      return {
                        studentId: s.id,
                        name: `${s.lastName}, ${s.firstName}`,
                        score: g?.score ?? null,
                        observation: g?.observation ?? null,
                      };
                    })}
                  />
                )}
              </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Pestaña Historial: lista o vista de mes ── */}
      {tab === "historial" && (
        <div>
          <div
            className="mb-4 flex w-fit items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5"
            role="group"
            aria-label="Vista del historial"
          >
            <Link
              href={tabHref("historial")}
              aria-current={vista !== "mes" ? "page" : undefined}
              className={`rounded-md px-3 py-1 text-sm transition ${
                vista !== "mes"
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Lista
            </Link>
            <Link
              href={`${tabHref("historial")}&vista=mes`}
              aria-current={vista === "mes" ? "page" : undefined}
              className={`rounded-md px-3 py-1 text-sm transition ${
                vista === "mes"
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Mes
            </Link>
          </div>

          {vista === "mes" ? (
            monthData && (
              <MonthCalendar
                classGroupId={cls.id}
                year={monthData.year}
                month={monthData.month}
                marks={monthData.marks}
                scheduledDows={new Set(cls.scheduleEntries.map((e) => e.dayOfWeek))}
              />
            )
          ) : history.length === 0 ? (
            <div className="card px-6 py-12 text-center text-gray-400">
              Todavía no hay sesiones guardadas en esta clase.
            </div>
          ) : (
            <ol className="relative ml-3 space-y-6 border-l border-gray-200 pl-6">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white"
                    style={{ background: color }}
                  />
                  <Link
                    href={`/clases/${cls.id}?date=${toDateKey(h.date)}&start=${h.startTime}&end=${h.endTime}`}
                    className={`text-sm font-semibold capitalize hover:text-indigo-600 ${
                      h.cancelled ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {formatDateLong(h.date)} · {h.startTime}–{h.endTime}
                  </Link>
                  {h.cancelled && (
                    <span className="chip ml-2 bg-gray-100 text-gray-500">
                      <BanIcon className="h-3 w-3" /> Cancelada
                    </span>
                  )}
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    {h.deliveredContent && (
                      <p>
                        <span className="font-medium text-emerald-700">Impartido:</span>{" "}
                        {h.deliveredContent}
                      </p>
                    )}
                    {!h.deliveredContent && h.plannedContent && (
                      <p>
                        <span className="font-medium text-indigo-700">Previsto:</span>{" "}
                        {h.plannedContent}
                      </p>
                    )}
                    {h.homework && (
                      <p>
                        <span className="font-medium text-amber-700">Deberes:</span>{" "}
                        {h.homework}
                      </p>
                    )}
                    {h.generalNotes && (
                      <p className="text-gray-500">{h.generalNotes}</p>
                    )}
                    {h.noteCount > 0 && (
                      <p className="text-xs text-gray-400">
                        {plural(h.noteCount, "anotación", "anotaciones")} sobre
                        alumnos
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

    </div>
  );
}

// ── Pestaña Alumnos (server component auxiliar) ────────────
async function AlumnosTab({
  classGroupId,
  students,
  userId,
}: {
  classGroupId: string;
  students: { id: string; firstName: string; lastName: string; email: string | null }[];
  userId: string;
}) {
  const enrolledIds = new Set(students.map((s) => s.id));
  const allStudents = await prisma.student.findMany({
    where: { userId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const available = allStudents.filter((s) => !enrolledIds.has(s.id));

  // Últimas anotaciones por alumno en esta clase.
  const recentNotes = await prisma.studentNote.findMany({
    where: { classGroupId },
    orderBy: { date: "desc" },
    take: 200,
  });
  const noteCount = new Map<string, number>();
  for (const n of recentNotes) {
    noteCount.set(n.studentId, (noteCount.get(n.studentId) ?? 0) + 1);
  }

  // Convivencias pendientes de parte (en todo el curso activo, no solo en
  // esta clase: el límite es del alumno, no de la asignatura).
  const year = await getActiveYear(userId);
  const conductNotes = await prisma.studentNote.findMany({
    where: {
      studentId: { in: [...enrolledIds] },
      type: { in: ["convivencia", "parte"] },
      classGroup: { subject: { academicYearId: year.id } },
    },
    select: { studentId: true, type: true, date: true, createdAt: true },
  });
  const convivencias = pendingConvivenciasByStudent(conductNotes);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {plural(students.length, "alumno matriculado", "alumnos matriculados")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ImportStudentsButton fixedClassId={classGroupId} />
          <EnrollButtons classGroupId={classGroupId} available={available} />
        </div>
      </div>
      {students.length === 0 ? (
        <div className="card px-6 py-12 text-center text-gray-400">
          Matricula alumnos existentes o crea nuevos directamente en esta clase.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Alumno</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Anotaciones</th>
                <th className="px-4 py-2.5">Convivencias</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
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
                  <td className="px-4 py-2.5 text-gray-500">
                    {noteCount.get(s.id) ?? 0}
                  </td>
                  <td className="px-4 py-2.5">
                    <ConvivenciaBadge count={convivencias.get(s.id) ?? 0} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ConfirmDeleteButton
                      action={unenrollStudentAction}
                      fields={{ classGroupId, studentId: s.id }}
                      title="Quitar alumno de la clase"
                      message={`Se quitará a ${s.firstName} ${s.lastName} de esta clase. El alumno y sus datos no se eliminan; podrás volver a matricularlo.`}
                      confirmLabel="Quitar"
                      pendingLabel="Quitando…"
                      successMessage="Alumno quitado de la clase."
                    >
                      Quitar de la clase
                    </ConfirmDeleteButton>
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

// ── Carga de datos auxiliar ────────────────────────────────
async function loadAssessment(classGroupId: string, id: string) {
  const a = await prisma.assessmentItem.findFirst({
    where: { id, classGroupId },
    include: { grades: true, groupGrades: true },
  });
  if (!a) return null;
  return {
    ...a,
    gradedCount: a.grades.filter((g) => g.score != null).length,
  };
}

async function loadHistory(classGroupId: string) {
  const sessions = await prisma.classSession.findMany({
    where: { classGroupId },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: { _count: { select: { studentNotes: true } } },
  });
  return sessions.map((s) => ({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    plannedContent: s.plannedContent,
    deliveredContent: s.deliveredContent,
    homework: s.homework,
    generalNotes: s.generalNotes,
    cancelled: s.cancelled,
    noteCount: s._count.studentNotes,
  }));
}

async function loadMonthMarks(classGroupId: string, year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);

  const [sessions, notes, assessments] = await Promise.all([
    prisma.classSession.findMany({
      where: { classGroupId, date: { gte: from, lt: to } },
    }),
    prisma.studentNote.findMany({
      where: { classGroupId, date: { gte: from, lt: to } },
    }),
    prisma.assessmentItem.findMany({
      where: { classGroupId, date: { gte: from, lt: to } },
    }),
  ]);

  const marks = new Map<string, DayMarks>();
  const get = (d: Date) => {
    const key = toDateKey(d);
    let m = marks.get(key);
    if (!m) {
      m = {};
      marks.set(key, m);
    }
    return m;
  };

  for (const s of sessions) {
    const m = get(s.date);
    if (s.plannedContent || s.deliveredContent || s.generalNotes || s.privateNotes)
      m.hasSession = true;
    if (s.homework) m.hasAssessment = m.hasAssessment ?? false;
  }
  for (const n of notes) {
    const m = get(n.date);
    m.hasNotes = true;
    if (n.type === "incidencia" || n.type === "negativa") m.hasIncident = true;
  }
  for (const a of assessments) {
    if (a.date) get(a.date).hasAssessment = true;
  }
  return marks;
}
