"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function createScheduleEntryAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (
    !classGroupId ||
    !(dayOfWeek >= 1 && dayOfWeek <= 7) ||
    !TIME_RE.test(startTime) ||
    !TIME_RE.test(endTime) ||
    startTime >= endTime
  ) {
    return;
  }

  // Verifica propiedad.
  const cls = await prisma.classGroup.findFirst({
    where: { id: classGroupId, subject: { userId: user.id } },
  });
  if (!cls) return;

  await prisma.scheduleEntry.create({
    data: { classGroupId, dayOfWeek, startTime, endTime },
  });
  revalidatePath("/horario");
  revalidatePath("/calendario");
}

export async function deleteScheduleEntryAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const entry = await prisma.scheduleEntry.findFirst({
    where: { id, classGroup: { subject: { userId: user.id } } },
  });
  if (!entry) return;
  await prisma.scheduleEntry.delete({ where: { id } });
  revalidatePath("/horario");
  revalidatePath("/calendario");
}
