"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createYearAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre del curso.");

  await prisma.academicYear.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });
  await prisma.academicYear.create({
    data: { userId: user.id, name, isActive: true },
  });
  revalidatePath("/", "layout");
}

export async function setActiveYearAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("yearId") ?? "");
  const year = await prisma.academicYear.findFirst({
    where: { id, userId: user.id },
  });
  if (!year) throw new Error("Curso no encontrado.");

  await prisma.academicYear.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });
  await prisma.academicYear.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath("/", "layout");
}
