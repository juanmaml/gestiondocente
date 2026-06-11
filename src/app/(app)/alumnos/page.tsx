import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { NewStudentButton } from "./StudentForm";
import { deleteStudentAction } from "./actions";

export default async function AlumnosPage() {
  const user = await requireUser();
  const students = await prisma.student.findMany({
    where: { userId: user.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      enrollments: {
        include: { classGroup: { include: { subject: true } } },
      },
    },
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Alumnos"
        subtitle={`${students.length} alumno(s) en total`}
      >
        <NewStudentButton />
      </PageHeader>

      {students.length === 0 ? (
        <EmptyState
          title="Aún no has añadido alumnos"
          hint="Crea alumnos aquí y luego asígnalos a tus clases."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Alumno</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Clases</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {s.lastName}, {s.firstName}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{s.email ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {s.enrollments.length === 0 ? (
                        <span className="text-gray-400">Sin clases</span>
                      ) : (
                        s.enrollments.map((e) => (
                          <span
                            key={e.id}
                            className="chip"
                            style={{
                              background: `${e.classGroup.subject.color}22`,
                              color: e.classGroup.subject.color,
                            }}
                          >
                            {e.classGroup.subject.name} · {e.classGroup.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={deleteStudentAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs text-red-500 hover:underline">
                        Eliminar
                      </button>
                    </form>
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
