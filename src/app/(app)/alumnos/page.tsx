import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import {
  CONVIVENCIA_LIMIT,
  pendingConvivenciasByStudent,
} from "@/lib/convivencia";
import {
  averageOfAverages,
  classAverage,
  type GradeForAverage,
} from "@/lib/grades";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { WarningIcon } from "@/components/icons";
import { plural } from "@/lib/plural";
import { ConvivenciaBadge } from "@/components/ConvivenciaBadge";
import { NewStudentButton } from "./StudentForm";
import { ImportStudentsButton } from "./ImportStudentsButton";
import { StudentsTable } from "./StudentsTable";

const NEGATIVE_LIMIT = 3; // negativas+incidencias a partir de las que se avisa

export default async function AlumnosPage() {
  const user = await requireUser();
  const year = await getActiveYear(user.id);
  const [students, subjects, grades, conductNotes] = await Promise.all([
    prisma.student.findMany({
      where: { userId: user.id },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        // Solo las matrículas del curso activo: mezclar cursos confunde.
        enrollments: {
          where: { classGroup: { subject: { academicYearId: year.id } } },
          include: { classGroup: { include: { subject: true } } },
        },
      },
    }),
    prisma.subject.findMany({
      where: { userId: user.id, academicYearId: year.id, deletedAt: null },
      orderBy: { name: "asc" },
      include: { classGroups: { orderBy: { name: "asc" } } },
    }),
    prisma.grade.findMany({
      where: {
        student: { userId: user.id },
        assessmentItem: {
          classGroup: { subject: { academicYearId: year.id } },
        },
      },
      select: {
        studentId: true,
        score: true,
        assessmentItem: {
          select: { maxScore: true, weight: true, classGroupId: true },
        },
      },
    }),
    prisma.studentNote.findMany({
      where: {
        student: { userId: user.id },
        classGroup: { subject: { academicYearId: year.id } },
        type: { in: ["negativa", "incidencia", "convivencia", "parte"] },
      },
      select: { studentId: true, type: true, date: true, createdAt: true },
    }),
  ]);

  const classOptions = subjects.flatMap((s) =>
    s.classGroups.map((c) => ({ id: c.id, label: `${s.name} · ${c.name}` }))
  );

  // ── Alumnos que requieren atención ───────────────────────
  // Media por alumno con la misma regla que el resto de la app: ponderada
  // dentro de cada clase si procede, y media de medias entre clases.
  const avgByStudent = new Map<string, number>();
  {
    const byStudentClass = new Map<string, GradeForAverage[]>();
    for (const g of grades) {
      const key = `${g.studentId}|${g.assessmentItem.classGroupId}`;
      const list = byStudentClass.get(key) ?? [];
      list.push({
        score: g.score,
        maxScore: g.assessmentItem.maxScore,
        weight: g.assessmentItem.weight,
      });
      byStudentClass.set(key, list);
    }
    const classAvgs = new Map<string, (number | null)[]>();
    for (const [key, list] of byStudentClass) {
      const studentId = key.slice(0, key.indexOf("|"));
      const acc = classAvgs.get(studentId) ?? [];
      acc.push(classAverage(list).value);
      classAvgs.set(studentId, acc);
    }
    for (const [id, vals] of classAvgs) {
      const avg = averageOfAverages(vals);
      if (avg != null) avgByStudent.set(id, avg);
    }
  }
  const negativesByStudent = new Map<string, number>();
  for (const n of conductNotes) {
    if (n.type === "negativa" || n.type === "incidencia") {
      negativesByStudent.set(
        n.studentId,
        (negativesByStudent.get(n.studentId) ?? 0) + 1
      );
    }
  }
  const convivencias = pendingConvivenciasByStudent(conductNotes);

  const atRisk = students
    .map((s) => {
      const avg = avgByStudent.get(s.id) ?? null;
      const negatives = negativesByStudent.get(s.id) ?? 0;
      const pending = convivencias.get(s.id) ?? 0;
      return { student: s, avg, negatives, pending };
    })
    .filter(
      (r) =>
        (r.avg != null && r.avg < 5) ||
        r.negatives >= NEGATIVE_LIMIT ||
        r.pending >= CONVIVENCIA_LIMIT
    )
    // Los partes pendientes primero, luego por media ascendente.
    .sort(
      (a, b) =>
        Number(b.pending >= CONVIVENCIA_LIMIT) -
          Number(a.pending >= CONVIVENCIA_LIMIT) ||
        (a.avg ?? 11) - (b.avg ?? 11)
    );

  return (
    <div className="p-6">
      <PageHeader
        title="Alumnos"
        subtitle={`${plural(students.length, "alumno")} en total · Curso ${year.name}`}
      >
        <ImportStudentsButton classes={classOptions} />
        <NewStudentButton />
      </PageHeader>

      {atRisk.length > 0 && (
        <details className="card group mb-6 overflow-hidden border-amber-200">
          <summary className="flex cursor-pointer select-none items-center justify-between bg-amber-50 px-4 py-2.5 transition hover:bg-amber-50/70 [&::-webkit-details-marker]:hidden">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
              <WarningIcon /> Requieren atención ({atRisk.length})
            </h2>
            <span
              aria-hidden="true"
              className="text-xs text-amber-700 transition-transform group-open:rotate-180"
            >
              ▼
            </span>
          </summary>
          <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto border-t border-amber-200">
            {atRisk.map(({ student: s, avg, negatives, pending }) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 px-4 py-2.5"
              >
                <Link
                  href={`/alumnos/${s.id}`}
                  className="flex items-center gap-2.5 font-medium text-gray-900 hover:text-indigo-600"
                >
                  <Avatar name={`${s.firstName} ${s.lastName}`} className="h-7 w-7 text-[10px]" />
                  <span className="hover:underline">
                    {s.lastName}, {s.firstName}
                  </span>
                </Link>
                <span className="flex flex-wrap items-center gap-1.5 text-xs">
                  {pending >= CONVIVENCIA_LIMIT && (
                    <ConvivenciaBadge count={pending} />
                  )}
                  {avg != null && avg < 5 && (
                    <span className="chip bg-red-50 font-semibold text-red-600">
                      Media {avg.toFixed(2)}
                    </span>
                  )}
                  {negatives >= NEGATIVE_LIMIT && (
                    <span className="chip bg-amber-50 text-amber-800">
                      {negatives} negativas/incidencias
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {students.length === 0 ? (
        <EmptyState
          title="Aún no has añadido alumnos"
          hint="Crea alumnos aquí o importa una lista pegada desde Excel."
        />
      ) : (
        <StudentsTable
          students={students.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            chips: s.enrollments.map((e) => ({
              id: e.id,
              label: `${e.classGroup.subject.name} · ${e.classGroup.name}`,
              color: e.classGroup.subject.color,
            })),
          }))}
        />
      )}
    </div>
  );
}
