import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import { readableText } from "@/lib/colors";
import { formatDateShort } from "@/lib/dates";
import {
  CONVIVENCIA_LIMIT,
  pendingConvivencias,
} from "@/lib/convivencia";
import { Avatar } from "@/components/Avatar";
import { ConvivenciaBadge } from "@/components/ConvivenciaBadge";
import { ChevronLeftIcon, PrinterIcon } from "@/components/icons";
import { NOTE_TYPES, noteMeta } from "@/lib/noteTypes";
import { plural } from "@/lib/plural";
import { averageOfAverages, classAverage } from "@/lib/grades";
import { EditStudentButton } from "./EditStudentButton";

/** Color de la media: rojo <5, ámbar <7, verde a partir de 7. */
function avgColor(avg: number | null): string {
  if (avg == null) return "#9ca3af";
  if (avg < 5) return "#dc2626";
  if (avg < 7) return "#d97706";
  return "#059669";
}

/** Datos mínimos para la media: nota, máximo y peso del evaluable. */
function forAverage(grades: { score: number | null; assessmentItem: { maxScore: number; weight: number | null } }[]) {
  return grades.map((g) => ({
    score: g.score,
    maxScore: g.assessmentItem.maxScore,
    weight: g.assessmentItem.weight,
  }));
}

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const user = await requireUser();
  const year = await getActiveYear(user.id);
  const { id } = await params;
  const sp = await searchParams;

  const student = await prisma.student.findFirst({
    where: { id, userId: user.id },
  });
  if (!student) notFound();

  // Datos del curso activo: matrículas, notas, anotaciones y grupos.
  const [enrollments, grades, notes, memberships] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: {
        studentId: id,
        classGroup: { subject: { academicYearId: year.id } },
      },
      include: { classGroup: { include: { subject: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.grade.findMany({
      where: {
        studentId: id,
        assessmentItem: {
          classGroup: { subject: { academicYearId: year.id } },
        },
      },
      include: { assessmentItem: true },
    }),
    prisma.studentNote.findMany({
      where: {
        studentId: id,
        classGroup: { subject: { academicYearId: year.id } },
      },
      include: { classGroup: { include: { subject: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.groupMembership.findMany({
      where: {
        studentId: id,
        studentGroup: {
          classGroup: { subject: { academicYearId: year.id } },
        },
      },
      include: { studentGroup: true },
    }),
  ]);

  // ── Medias por clase y global ────────────────────────────
  // La global es la media de las medias por clase: cada clase cuenta igual
  // y los pesos de una asignatura no afectan a las demás.
  const gradesByClass = new Map<string, typeof grades>();
  for (const g of grades) {
    const key = g.assessmentItem.classGroupId;
    const list = gradesByClass.get(key) ?? [];
    list.push(g);
    gradesByClass.set(key, list);
  }
  const classAvgById = new Map(
    [...gradesByClass].map(([classId, list]) => [
      classId,
      classAverage(forAverage(list)),
    ])
  );
  const globalAvg = averageOfAverages(
    [...classAvgById.values()].map((r) => r.value)
  );
  const gradedCount = grades.filter((g) => g.score != null).length;
  const noteCounts: Record<string, number> = {
    positiva: 0,
    negativa: 0,
    incidencia: 0,
    convivencia: 0,
    parte: 0,
    general: 0,
  };
  for (const n of notes) {
    noteCounts[n.type] = (noteCounts[n.type] ?? 0) + 1;
  }
  const pendingConv = pendingConvivencias(notes);

  // ── Datos por clase ──────────────────────────────────────
  const groupsByClass = new Map<string, string[]>();
  for (const m of memberships) {
    const key = m.studentGroup.classGroupId;
    const list = groupsByClass.get(key) ?? [];
    list.push(m.studentGroup.name);
    groupsByClass.set(key, list);
  }

  // ── Filtro de anotaciones ────────────────────────────────
  const tipo = NOTE_TYPES.some((t) => t.value === sp.tipo) ? sp.tipo : undefined;
  const visibleNotes = tipo ? notes.filter((n) => n.type === tipo) : notes;

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="mb-5">
        <Link
          href="/alumnos"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> Volver a alumnos
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar
              name={`${student.firstName} ${student.lastName}`}
              className="mt-0.5 h-14 w-14 text-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {student.email ?? "Sin email"} · Curso {year.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {enrollments.length === 0 ? (
                  <span className="text-sm text-gray-400">
                    Sin clases este curso
                  </span>
                ) : (
                  enrollments.map((e) => (
                    <Link
                      key={e.id}
                      href={`/clases/${e.classGroup.id}`}
                      className="chip transition hover:brightness-95"
                      style={{
                        background: e.classGroup.subject.color,
                        color: readableText(e.classGroup.subject.color),
                      }}
                    >
                      {e.classGroup.subject.name} · {e.classGroup.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/alumnos/${student.id}/informe`}
              className="btn-secondary"
              title="Informe imprimible para tutorías o reuniones con familias"
            >
              <PrinterIcon /> Informe
            </Link>
            <EditStudentButton
              student={{
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
              }}
            />
          </div>
        </div>
      </div>

      {/* Aviso de convivencias acumuladas */}
      {pendingConv > 0 && (
        <div
          className={`mb-5 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            pendingConv >= CONVIVENCIA_LIMIT
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <ConvivenciaBadge count={pendingConv} />
          {pendingConv >= CONVIVENCIA_LIMIT ? (
            <span>
              Acumula {pendingConv} convivencias desde el último parte:
              <strong> corresponde tramitar un parte</strong>. Cuando lo hagas,
              regístralo como anotación de tipo «Parte» para reiniciar el
              contador.
            </span>
          ) : (
            <span>
              Lleva {plural(pendingConv, "convivencia")} de {CONVIVENCIA_LIMIT}{" "}
              desde el último parte.
            </span>
          )}
        </div>
      )}

      {/* Resumen del curso en una línea: la jerarquía es del nombre */}
      <p className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
        <span title="Media de sus clases del curso, normalizada sobre 10">
          Media global:{" "}
          <strong style={{ color: avgColor(globalAvg) }}>
            {globalAvg == null ? "—" : globalAvg.toFixed(2)}
          </strong>
        </span>
        <span aria-hidden="true" className="text-gray-300">
          ·
        </span>
        <span>
          {plural(gradedCount, "evaluable calificado", "evaluables calificados")}
        </span>
        <span aria-hidden="true" className="text-gray-300">
          ·
        </span>
        <span>
          {plural(notes.length, "anotación", "anotaciones")}
          {notes.length > 0 &&
            ` (${plural(noteCounts.positiva, "positiva")} · ${plural(
              noteCounts.negativa,
              "negativa"
            )} · ${plural(noteCounts.incidencia, "incidencia")})`}
        </span>
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Calificaciones por clase */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Calificaciones por clase
          </h2>
          {enrollments.length === 0 ? (
            <div className="card px-6 py-10 text-center text-gray-400">
              Este alumno no está matriculado en ninguna clase del curso
              activo.
            </div>
          ) : (
            enrollments.map((e) => {
              const cls = e.classGroup;
              const color = cls.subject.color;
              const classGrades = (gradesByClass.get(cls.id) ?? [])
                .slice()
                .sort((a, b) => {
                  const da = a.assessmentItem.date?.getTime() ?? 0;
                  const db = b.assessmentItem.date?.getTime() ?? 0;
                  return db - da;
                });
              const classAvgResult = classAvgById.get(cls.id);
              const classAvg = classAvgResult?.value ?? null;
              const groups = groupsByClass.get(cls.id) ?? [];

              return (
                <div key={cls.id} className="card overflow-hidden">
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                    style={{ background: color, color: readableText(color) }}
                  >
                    <Link
                      href={`/clases/${cls.id}`}
                      className="font-semibold hover:underline"
                    >
                      {cls.subject.name} · {cls.name}
                    </Link>
                    <span className="text-sm">
                      {classAvgResult?.weighted ? "Media ponderada:" : "Media:"}{" "}
                      <strong>
                        {classAvg == null ? "—" : classAvg.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                  <div className="p-4">
                    {groups.length > 0 && (
                      <p className="mb-3 text-sm text-gray-500">
                        Grupos de trabajo:{" "}
                        {groups.map((g) => (
                          <span
                            key={g}
                            className="chip mr-1 bg-violet-50 text-violet-700"
                          >
                            {g}
                          </span>
                        ))}
                      </p>
                    )}
                    {classGrades.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        Sin calificaciones todavía.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                              <th className="py-1.5 pr-3">Evaluable</th>
                              <th className="py-1.5 pr-3">Tipo</th>
                              <th className="py-1.5 pr-3">Fecha</th>
                              <th className="py-1.5 pr-3 text-right">Nota</th>
                              <th className="py-1.5">Observación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {classGrades.map((g) => {
                              const item = g.assessmentItem;
                              const norm =
                                g.score != null && item.maxScore > 0
                                  ? (g.score / item.maxScore) * 10
                                  : null;
                              return (
                                <tr key={g.id}>
                                  <td className="py-1.5 pr-3 font-medium text-gray-900">
                                    {item.title}
                                    {item.term && (
                                      <span className="chip ml-1.5 bg-sky-50 text-sky-700">
                                        {item.term}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 pr-3 capitalize text-gray-500">
                                    {item.type}
                                    {item.isGroup ? " (grupal)" : ""}
                                  </td>
                                  <td className="py-1.5 pr-3 text-gray-500">
                                    {item.date
                                      ? formatDateShort(item.date)
                                      : "—"}
                                  </td>
                                  <td className="py-1.5 pr-3 text-right">
                                    {g.score == null ? (
                                      <span className="text-gray-300">
                                        sin nota
                                      </span>
                                    ) : (
                                      <span
                                        className="font-semibold"
                                        style={{ color: avgColor(norm) }}
                                      >
                                        {g.score}
                                        <span className="font-normal text-gray-400">
                                          /{item.maxScore}
                                        </span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 text-gray-500">
                                    {g.observation ?? ""}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Historial de anotaciones */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Anotaciones
            </h2>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/alumnos/${student.id}`}
                className={`chip ${
                  !tipo
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </Link>
              {NOTE_TYPES.map((t) => (
                <Link
                  key={t.value}
                  href={`/alumnos/${student.id}?tipo=${t.value}`}
                  className="chip transition hover:brightness-95"
                  style={
                    tipo === t.value
                      ? { background: t.color, color: "#fff" }
                      : { background: `${t.color}22`, color: t.color }
                  }
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
          {visibleNotes.length === 0 ? (
            <div className="card px-6 py-10 text-center text-sm text-gray-400">
              {tipo
                ? "Sin anotaciones de este tipo."
                : "Sin anotaciones este curso."}
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleNotes.map((n) => {
                const meta = noteMeta(n.type);
                return (
                  <li key={n.id} className="card p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span
                        className="chip"
                        style={{
                          background: `${meta.color}22`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span>{formatDateShort(n.date)}</span>
                      <span>·</span>
                      <Link
                        href={`/clases/${n.classGroup.id}`}
                        className="hover:text-indigo-600"
                      >
                        {n.classGroup.subject.name} · {n.classGroup.name}
                      </Link>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-700">{n.content}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
