import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { NewStudentButton } from "./StudentForm";
import { StudentsTable } from "./StudentsTable";

export default async function AlumnosPage() {
  const user = await requireUser();
  const year = await getActiveYear(user.id);
  const students = await prisma.student.findMany({
    where: { userId: user.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      // Solo las matrículas del curso activo: mezclar cursos confunde.
      enrollments: {
        where: { classGroup: { subject: { academicYearId: year.id } } },
        include: { classGroup: { include: { subject: true } } },
      },
    },
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Alumnos"
        subtitle={`${students.length} alumno(s) en total · Curso ${year.name}`}
      >
        <NewStudentButton />
      </PageHeader>

      {students.length === 0 ? (
        <EmptyState
          title="Aún no has añadido alumnos"
          hint="Crea alumnos aquí y luego asígnalos a tus clases."
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
