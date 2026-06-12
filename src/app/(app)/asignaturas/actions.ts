"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveYear } from "@/lib/year";
import type { ActionResult } from "@/components/Modal";

/**
 * Margen antes de purgar definitivamente una asignatura borrada en suave.
 * El «Deshacer» del toast dura 10 s; la hora extra es red de seguridad
 * invisible (la purga es oportunista, al volver a borrar o crear).
 */
const PURGE_AFTER_MS = 60 * 60 * 1000;

async function purgeDeletedSubjects(userId: string) {
  await prisma.subject.deleteMany({
    where: { userId, deletedAt: { lt: new Date(Date.now() - PURGE_AFTER_MS) } },
  });
}

export async function createSubjectAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3b82f6");
  if (!name) return { error: "Falta el nombre de la asignatura." };

  const year = await getActiveYear(user.id);
  const duplicate = await prisma.subject.findFirst({
    where: { userId: user.id, academicYearId: year.id, name, deletedAt: null },
  });
  if (duplicate) {
    return {
      error: `Ya existe una asignatura llamada «${name}» en el curso ${year.name}.`,
    };
  }

  await purgeDeletedSubjects(user.id);
  await prisma.subject.create({
    data: { userId: user.id, academicYearId: year.id, name, color },
  });
  revalidatePath("/asignaturas");
}

export async function updateSubjectAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3b82f6");
  if (!id || !name) return { error: "Falta el nombre de la asignatura." };

  const duplicate = await prisma.subject.findFirst({
    where: {
      userId: user.id,
      name,
      deletedAt: null,
      id: { not: id },
      academicYear: { isActive: true },
    },
  });
  if (duplicate) {
    return { error: `Ya existe otra asignatura llamada «${name}».` };
  }

  await prisma.subject.updateMany({
    where: { id, userId: user.id },
    data: { name, color },
  });
  revalidatePath("/asignaturas");
}

/**
 * Borrado suave: marca la asignatura como eliminada para que el toast pueda
 * ofrecer «Deshacer». La purga definitiva llega pasado PURGE_AFTER_MS.
 */
export async function deleteSubjectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.subject.updateMany({
    where: { id, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await purgeDeletedSubjects(user.id);
  revalidatePath("/", "layout");
}

/** Revierte un borrado suave aún no purgado. */
export async function undoDeleteSubjectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { count } = await prisma.subject.updateMany({
    where: { id, userId: user.id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (count === 0) throw new Error("La asignatura ya no se puede restaurar.");
  revalidatePath("/", "layout");
}

export async function createClassAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const subjectId = String(formData.get("subjectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!subjectId || !name) return { error: "Falta el nombre de la clase." };

  // Verifica propiedad de la asignatura.
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: user.id, deletedAt: null },
  });
  if (!subject) return { error: "Asignatura no encontrada." };

  const duplicate = await prisma.classGroup.findFirst({
    where: { subjectId, name },
  });
  if (duplicate) {
    return {
      error: `Ya existe una clase llamada «${name}» en ${subject.name}.`,
    };
  }

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
