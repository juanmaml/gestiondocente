"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fromDateKey } from "@/lib/dates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function createHolidayAction(formData: FormData) {
  const user = await requireUser();
  const dateKey = String(formData.get("date") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!DATE_RE.test(dateKey) || !name) {
    throw new Error("Festivo no válido.");
  }

  await prisma.holiday.upsert({
    where: { userId_date: { userId: user.id, date: fromDateKey(dateKey) } },
    update: { name },
    create: { userId: user.id, date: fromDateKey(dateKey), name },
  });
  // Afecta al calendario y a la navegación de sesiones de todas las clases.
  revalidatePath("/", "layout");
}

export async function deleteHolidayAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const holiday = await prisma.holiday.findFirst({
    where: { id, userId: user.id },
  });
  if (!holiday) throw new Error("Festivo no encontrado.");
  await prisma.holiday.delete({ where: { id } });
  revalidatePath("/", "layout");
}
