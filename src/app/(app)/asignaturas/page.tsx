import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import { readableText } from "@/lib/colors";
import { plural } from "@/lib/plural";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NewSubjectButton } from "./SubjectForm";
import { NewClassButton } from "./NewClassButton";
import { deleteSubjectAction, undoDeleteSubjectAction } from "./actions";

export default async function AsignaturasPage() {
  const user = await requireUser();
  const year = await getActiveYear(user.id);

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, academicYearId: year.id, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      classGroups: {
        orderBy: { name: "asc" },
        include: { _count: { select: { enrollments: true } } },
      },
    },
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Asignaturas"
        subtitle={`Curso ${year.name} · ${plural(subjects.length, "asignatura")}`}
      >
        <NewSubjectButton />
      </PageHeader>

      {subjects.length === 0 ? (
        <EmptyState
          title="Todavía no tienes asignaturas"
          hint="Crea tu primera asignatura para empezar a organizar tus clases."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: subject.color,
                  color: readableText(subject.color),
                }}
              >
                <h2 className="text-lg font-semibold">{subject.name}</h2>
                <ConfirmDeleteButton
                  action={deleteSubjectAction}
                  undoAction={undoDeleteSubjectAction}
                  fields={{ id: subject.id }}
                  title="Eliminar asignatura"
                  message={`Se eliminará «${subject.name}» con todas sus clases, sesiones, evaluables y calificaciones.`}
                  successMessage={`Asignatura «${subject.name}» eliminada.`}
                  undoneMessage={`Asignatura «${subject.name}» restaurada.`}
                  className="rounded px-2 py-0.5 text-sm opacity-80 hover:bg-black/10 hover:opacity-100"
                />
              </div>
              <div className="p-4">
                {subject.classGroups.length === 0 ? (
                  <p className="mb-3 text-sm text-gray-400">
                    Sin clases todavía.
                  </p>
                ) : (
                  <ul className="mb-3 divide-y divide-gray-100">
                    {subject.classGroups.map((cls) => (
                      <li key={cls.id}>
                        <Link
                          href={`/clases/${cls.id}`}
                          className="flex items-center justify-between py-2 text-sm hover:text-indigo-600"
                        >
                          <span className="font-medium">{cls.name}</span>
                          <span className="text-xs text-gray-400">
                            {plural(cls._count.enrollments, "alumno")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <NewClassButton subjectId={subject.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
