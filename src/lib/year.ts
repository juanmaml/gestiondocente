import { prisma } from "@/lib/prisma";

/** Nombre por defecto del curso académico según la fecha (sept-ago). */
function defaultYearName(d = new Date()): string {
  const y = d.getFullYear();
  // El curso empieza en septiembre.
  return d.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/**
 * Devuelve el curso académico activo del usuario, creando uno por defecto
 * si todavía no existe ninguno.
 */
export async function getActiveYear(userId: string) {
  let year = await prisma.academicYear.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (year) return year;

  year = await prisma.academicYear.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (year) return year;

  return prisma.academicYear.create({
    data: { userId, name: defaultYearName(), isActive: true },
  });
}

export async function listYears(userId: string) {
  return prisma.academicYear.findMany({
    where: { userId },
    orderBy: { name: "desc" },
  });
}
