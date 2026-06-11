"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function createStudentAction(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  if (!firstName || !lastName) return;

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
  if (!id || !firstName || !lastName) return;

  await prisma.student.updateMany({
    where: { id, userId: user.id },
    data: { firstName, lastName, email },
  });
  revalidatePath("/alumnos");
}

export async function deleteStudentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.student.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/alumnos");
}
