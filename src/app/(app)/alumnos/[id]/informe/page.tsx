import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import { formatDateLong, formatDateShort } from "@/lib/dates";
import {
  CONVIVENCIA_LIMIT,
  pendingConvivencias,
} from "@/lib/convivencia";
import { PrintButton } from "@/components/PrintButton";

const NOTE_LABELS: Record<string, string> = {
  positiva: "Positiva",
  negativa: "Negativa",
  incidencia: "Incidencia",
  convivencia: "Convivencia",
  parte: "Parte",
  general: "General",
};

/** Media sobre 10 normalizando cada nota por su puntuación máxima. */
function average(
  grades: { score: number | null; maxScore: number }[]
): number | null {
  const vals = grades
    .filter((g) => g.score != null && g.maxScore > 0)
    .map((g) => (g.score! / g.maxScore) * 10);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Informe imprimible del alumno (tutorías, reuniones con familias):
 * datos del curso activo con calificaciones y anotaciones.
 */
export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const year = await getActiveYear(user.id);
  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, userId: user.id },
  });
  if (!student) notFound();

  const [enrollments, grades, notes] = await Promise.all([
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
  ]);

  const globalAvg = average(
    grades.map((g) => ({ score: g.score, maxScore: g.assessmentItem.maxScore }))
  );
  const pendingConv = pendingConvivencias(notes);

  const gradesByClass = new Map<string, typeof grades>();
  for (const g of grades) {
    const key = g.assessmentItem.classGroupId;
    const list = gradesByClass.get(key) ?? [];
    list.push(g);
    gradesByClass.set(key, list);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 print:max-w-none print:p-0">
      {/* Controles (no se imprimen) */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link
          href={`/alumnos/${student.id}`}
          className="text-sm text-gray-400 hover:text-indigo-600"
        >
          ← Volver al perfil
        </Link>
        <PrintButton />
      </div>

      {/* Cabecera del informe */}
      <div className="mb-6 border-b-2 border-gray-900 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Informe de seguimiento — {student.firstName} {student.lastName}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Curso {year.name}
          {student.email ? ` · ${student.email}` : ""} · Generado el{" "}
          {formatDateLong(new Date())}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Clases:{" "}
          {enrollments.length === 0
            ? "sin matrículas este curso"
            : enrollments
                .map((e) => `${e.classGroup.subject.name} (${e.classGroup.name})`)
                .join(" · ")}
        </p>
      </div>

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-gray-300 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Media global
          </p>
          <p className="text-xl font-bold text-gray-900">
            {globalAvg == null ? "—" : globalAvg.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-300 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Anotaciones
          </p>
          <p className="text-xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="rounded-lg border border-gray-300 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Convivencias sin parte
          </p>
          <p
            className={`text-xl font-bold ${
              pendingConv >= CONVIVENCIA_LIMIT ? "text-red-600" : "text-gray-900"
            }`}
          >
            {pendingConv}
            {pendingConv >= CONVIVENCIA_LIMIT ? " ⚠" : ""}
          </p>
        </div>
      </div>

      {/* Calificaciones por clase */}
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Calificaciones
      </h2>
      {enrollments.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">Sin matrículas este curso.</p>
      ) : (
        enrollments.map((e) => {
          const cls = e.classGroup;
          const classGrades = (gradesByClass.get(cls.id) ?? [])
            .slice()
            .sort(
              (a, b) =>
                (b.assessmentItem.date?.getTime() ?? 0) -
                (a.assessmentItem.date?.getTime() ?? 0)
            );
          const classAvg = average(
            classGrades.map((g) => ({
              score: g.score,
              maxScore: g.assessmentItem.maxScore,
            }))
          );
          return (
            <div key={cls.id} className="mb-5 break-inside-avoid">
              <h3 className="mb-1 font-semibold text-gray-800">
                {cls.subject.name} · {cls.name}
                <span className="ml-2 font-normal text-gray-500">
                  Media: {classAvg == null ? "—" : classAvg.toFixed(2)}
                </span>
              </h3>
              {classGrades.length === 0 ? (
                <p className="text-sm text-gray-500">Sin calificaciones.</p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-400 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-1 pr-3">Evaluable</th>
                      <th className="py-1 pr-3">Fecha</th>
                      <th className="py-1 pr-3 text-right">Nota</th>
                      <th className="py-1">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classGrades.map((g) => (
                      <tr key={g.id} className="border-b border-gray-200">
                        <td className="py-1 pr-3 text-gray-900">
                          {g.assessmentItem.title}
                          {g.assessmentItem.term
                            ? ` (${g.assessmentItem.term})`
                            : ""}
                        </td>
                        <td className="py-1 pr-3 text-gray-600">
                          {g.assessmentItem.date
                            ? formatDateShort(g.assessmentItem.date)
                            : "—"}
                        </td>
                        <td className="py-1 pr-3 text-right font-medium text-gray-900">
                          {g.score == null
                            ? "—"
                            : `${g.score}/${g.assessmentItem.maxScore}`}
                        </td>
                        <td className="py-1 text-gray-600">
                          {g.observation ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}

      {/* Anotaciones */}
      <h2 className="mb-2 mt-6 text-lg font-semibold text-gray-900">
        Anotaciones del curso
      </h2>
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">Sin anotaciones este curso.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-400 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-1 pr-3">Fecha</th>
              <th className="py-1 pr-3">Tipo</th>
              <th className="py-1 pr-3">Clase</th>
              <th className="py-1">Anotación</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.id} className="break-inside-avoid border-b border-gray-200">
                <td className="py-1 pr-3 whitespace-nowrap text-gray-600">
                  {formatDateShort(n.date)}
                </td>
                <td className="py-1 pr-3 font-medium text-gray-900">
                  {NOTE_LABELS[n.type] ?? n.type}
                </td>
                <td className="py-1 pr-3 text-gray-600">
                  {n.classGroup.subject.name} · {n.classGroup.name}
                </td>
                <td className="py-1 text-gray-700">{n.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-8 text-xs text-gray-400">
        Documento generado con Gestión Docente para uso interno del
        profesorado.
      </p>
    </div>
  );
}
