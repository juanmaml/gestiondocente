"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/components/Modal";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createYearAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Falta el nombre del curso." };

  const duplicate = await prisma.academicYear.findFirst({
    where: { userId: user.id, name },
  });
  if (duplicate) {
    return { error: `Ya existe un curso llamado «${name}».` };
  }

  await prisma.academicYear.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });
  await prisma.academicYear.create({
    data: { userId: user.id, name, isActive: true },
  });
  revalidatePath("/", "layout");
}

export async function setActiveYearAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("yearId") ?? "");
  const year = await prisma.academicYear.findFirst({
    where: { id, userId: user.id },
  });
  if (!year) {
    return { error: "Ese curso ya no existe. Recarga la página." };
  }

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
