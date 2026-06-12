"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseStudentList } from "@/lib/students";

export async function createStudentAction(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  if (!firstName || !lastName) throw new Error("Faltan nombre o apellidos.");

  await prisma.student.create({
    data: { userId: user.id, firstName, lastName, email },
  });
  revalidatePath("/alumnos");
}

export async function updateStudentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  if (!id || !firstName || !lastName) throw new Error("Faltan nombre o apellidos.");

  await prisma.student.updateMany({
    where: { id, userId: user.id },
    data: { firstName, lastName, email },
  });
  revalidatePath("/alumnos");
  revalidatePath(`/alumnos/${id}`);
}

/**
 * Importa alumnos en bloque desde texto pegado (una línea por alumno) y,
 * opcionalmente, los matricula en una clase. Devuelve cuántos se crearon.
 */
export async function importStudentsAction(
  formData: FormData
): Promise<{ created: number; enrolled: boolean }> {
  const user = await requireUser();
  const text = String(formData.get("list") ?? "");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const parsed = parseStudentList(text);
  if (parsed.length === 0) {
    throw new Error("No se encontró ningún alumno en el texto.");
  }

  let cls = null;
  if (classGroupId) {
    cls = await prisma.classGroup.findFirst({
      where: { id: classGroupId, subject: { userId: user.id } },
    });
    if (!cls) throw new Error("Clase no encontrada.");
  }

  for (const p of parsed) {
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
      },
    });
    if (cls) {
      await prisma.classEnrollment.create({
        data: { classGroupId: cls.id, studentId: student.id },
      });
    }
  }

  revalidatePath("/alumnos");
  if (cls) revalidatePath(`/clases/${cls.id}`);
  return { created: parsed.length, enrolled: !!cls };
}

export async function deleteStudentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.student.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/alumnos");
}
