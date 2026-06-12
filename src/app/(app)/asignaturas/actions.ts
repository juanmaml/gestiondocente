"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";

export async function createSubjectAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3b82f6");
  if (!name) throw new Error("Falta el nombre de la asignatura.");

  const year = await getActiveYear(user.id);
  await prisma.subject.create({
    data: { userId: user.id, academicYearId: year.id, name, color },
  });
  revalidatePath("/asignaturas");
}

export async function updateSubjectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3b82f6");
  if (!id || !name) throw new Error("Falta el nombre de la asignatura.");

  await prisma.subject.updateMany({
    where: { id, userId: user.id },
    data: { name, color },
  });
  revalidatePath("/asignaturas");
}

export async function deleteSubjectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.subject.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/asignaturas");
}

export async function createClassAction(formData: FormData) {
  const user = await requireUser();
  const subjectId = String(formData.get("subjectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!subjectId || !name) throw new Error("Falta el nombre de la clase.");

  // Verifica propiedad de la asignatura.
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: user.id },
  });
  if (!subject) throw new Error("Asignatura no encontrada.");

  await prisma.classGroup.create({ data: { subjectId, name } });
  revalidatePath("/asignaturas");
}

export async function deleteClassAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const cls = await prisma.classGroup.findFirst({
    where: { id, subject: { userId: user.id } },
  });
  if (!cls) return;
  await prisma.classGroup.delete({ where: { id } });
  revalidatePath("/asignaturas");
}
