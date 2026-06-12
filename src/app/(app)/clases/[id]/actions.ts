"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fromDateKey } from "@/lib/dates";

/** Verifica que la clase pertenece al usuario; devuelve la clase o null. */
async function ownClass(userId: string, classGroupId: string) {
  return prisma.classGroup.findFirst({
    where: { id: classGroupId, subject: { userId } },
  });
}

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// ── Sesiones ───────────────────────────────────────────────
export async function saveSessionAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const dateKey = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  if (!(await ownClass(user.id, classGroupId)) || !dateKey || !startTime) {
    throw new Error("Sesión no válida.");
  }

  const date = fromDateKey(dateKey);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const data = {
    plannedContent: str(formData.get("plannedContent")),
    deliveredContent: str(formData.get("deliveredContent")),
    homework: str(formData.get("homework")),
    generalNotes: str(formData.get("generalNotes")),
    privateNotes: str(formData.get("privateNotes")),
  };

  const existing = await prisma.classSession.findFirst({
    where: { classGroupId, startTime, date: { gte: date, lt: dayEnd } },
  });

  if (existing) {
    await prisma.classSession.update({ where: { id: existing.id }, data });
  } else {
    await prisma.classSession.create({
      data: { classGroupId, date, startTime, endTime, ...data },
    });
  }
  revalidatePath(`/clases/${classGroupId}`);
}

// ── Matrículas ─────────────────────────────────────────────
export async function enrollStudentAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!(await ownClass(user.id, classGroupId)) || !studentId) {
    throw new Error("Clase o alumno no válidos.");
  }
  const student = await prisma.student.findFirst({
    where: { id: studentId, userId: user.id },
  });
  if (!student) throw new Error("Alumno no encontrado.");
  await prisma.classEnrollment.upsert({
    where: { classGroupId_studentId: { classGroupId, studentId } },
    update: {},
    create: { classGroupId, studentId },
  });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function createAndEnrollStudentAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!(await ownClass(user.id, classGroupId)) || !firstName || !lastName) {
    throw new Error("Faltan nombre o apellidos.");
  }
  const student = await prisma.student.create({
    data: { userId: user.id, firstName, lastName },
  });
  await prisma.classEnrollment.create({
    data: { classGroupId, studentId: student.id },
  });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function unenrollStudentAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!(await ownClass(user.id, classGroupId))) return;
  await prisma.classEnrollment.deleteMany({ where: { classGroupId, studentId } });
  revalidatePath(`/clases/${classGroupId}`);
}

// ── Anotaciones sobre alumnos ──────────────────────────────
export async function createStudentNoteAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const dateKey = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "general");
  const content = String(formData.get("content") ?? "").trim();
  const sessionId = str(formData.get("sessionId"));
  if (!(await ownClass(user.id, classGroupId)) || !studentId || !content) {
    throw new Error("Anotación no válida.");
  }

  await prisma.studentNote.create({
    data: {
      studentId,
      classGroupId,
      sessionId,
      type,
      content,
      date: dateKey ? fromDateKey(dateKey) : new Date(),
    },
  });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function deleteStudentNoteAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const note = await prisma.studentNote.findFirst({
    where: { id, classGroup: { subject: { userId: user.id } } },
  });
  if (!note) return;
  await prisma.studentNote.delete({ where: { id } });
  revalidatePath(`/clases/${classGroupId}`);
}

// ── Evaluaciones ───────────────────────────────────────────
export async function createAssessmentAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!(await ownClass(user.id, classGroupId)) || !title) {
    throw new Error("Faltan datos del evaluable.");
  }

  const dateKey = str(formData.get("date"));
  await prisma.assessmentItem.create({
    data: {
      classGroupId,
      title,
      type: String(formData.get("type") ?? "tarea"),
      description: str(formData.get("description")),
      maxScore: num(formData.get("maxScore")) ?? 10,
      weight: num(formData.get("weight")),
      term: str(formData.get("term")),
      isGroup: formData.get("isGroup") === "on",
      date: dateKey ? fromDateKey(dateKey) : null,
    },
  });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function deleteAssessmentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const item = await prisma.assessmentItem.findFirst({
    where: { id, classGroup: { subject: { userId: user.id } } },
  });
  if (!item) return;
  await prisma.assessmentItem.delete({ where: { id } });
  revalidatePath(`/clases/${classGroupId}`);
}

/** Guarda todas las notas individuales de un evaluable de golpe. */
export async function saveGradesAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const assessmentItemId = String(formData.get("assessmentItemId") ?? "");
  const item = await prisma.assessmentItem.findFirst({
    where: { id: assessmentItemId, classGroup: { subject: { userId: user.id } } },
  });
  if (!item) throw new Error("Evaluable no encontrado.");

  const studentIds = formData.getAll("studentId").map(String);
  for (const studentId of studentIds) {
    const score = num(formData.get(`score_${studentId}`));
    const observation = str(formData.get(`obs_${studentId}`));
    await prisma.grade.upsert({
      where: { assessmentItemId_studentId: { assessmentItemId, studentId } },
      update: { score, observation },
      create: { assessmentItemId, studentId, score, observation },
    });
  }
  revalidatePath(`/clases/${classGroupId}`);
}

/**
 * Cuaderno del profesor: guarda de golpe toda la rejilla de notas
 * (alumnos × evaluables). Solo actualiza la puntuación; las observaciones se
 * mantienen intactas.
 */
export async function saveGradebookAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  if (!(await ownClass(user.id, classGroupId))) {
    throw new Error("Clase no encontrada.");
  }

  // Solo evaluables y alumnos que pertenecen a esta clase.
  const [assessments, enrollments] = await Promise.all([
    prisma.assessmentItem.findMany({
      where: { classGroupId },
      select: { id: true },
    }),
    prisma.classEnrollment.findMany({
      where: { classGroupId },
      select: { studentId: true },
    }),
  ]);
  const assessmentIds = new Set(assessments.map((a) => a.id));
  const studentIds = new Set(enrollments.map((e) => e.studentId));

  for (const assessmentItemId of assessmentIds) {
    for (const studentId of studentIds) {
      const raw = formData.get(`grade_${assessmentItemId}_${studentId}`);
      if (raw == null) continue; // celda no presente en el formulario
      const score = num(raw);
      await prisma.grade.upsert({
        where: {
          assessmentItemId_studentId: { assessmentItemId, studentId },
        },
        update: { score },
        create: { assessmentItemId, studentId, score },
      });
    }
  }
  revalidatePath(`/clases/${classGroupId}`);
}

// ── Grupos de trabajo ──────────────────────────────────────
export async function createGroupAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!(await ownClass(user.id, classGroupId)) || !name) {
    throw new Error("Falta el nombre del grupo.");
  }
  await prisma.studentGroup.create({
    data: { classGroupId, name, notes: str(formData.get("notes")) },
  });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function deleteGroupAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const group = await prisma.studentGroup.findFirst({
    where: { id, classGroup: { subject: { userId: user.id } } },
  });
  if (!group) return;
  await prisma.studentGroup.delete({ where: { id } });
  revalidatePath(`/clases/${classGroupId}`);
}

export async function setGroupMembersAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const studentGroupId = String(formData.get("studentGroupId") ?? "");
  const group = await prisma.studentGroup.findFirst({
    where: { id: studentGroupId, classGroup: { subject: { userId: user.id } } },
  });
  if (!group) throw new Error("Grupo no encontrado.");
  const studentIds = formData.getAll("memberId").map(String);

  await prisma.groupMembership.deleteMany({ where: { studentGroupId } });
  if (studentIds.length > 0) {
    await prisma.groupMembership.createMany({
      data: studentIds.map((studentId) => ({ studentGroupId, studentId })),
    });
  }
  revalidatePath(`/clases/${classGroupId}`);
}

/**
 * Aplica la nota del grupo a TODOS los miembros, sobreescribiendo cualquier
 * nota individual previa. Es la acción «Aplicar a todo el grupo».
 */
export async function applyGroupGradeToAllAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const assessmentItemId = String(formData.get("assessmentItemId") ?? "");
  const studentGroupId = String(formData.get("studentGroupId") ?? "");

  const item = await prisma.assessmentItem.findFirst({
    where: { id: assessmentItemId, classGroup: { subject: { userId: user.id } } },
  });
  const group = await prisma.studentGroup.findFirst({
    where: { id: studentGroupId, classGroupId },
    include: { memberships: true },
  });
  if (!item || !group) throw new Error("Evaluable o grupo no encontrados.");

  const groupScore = num(formData.get("groupScore"));

  await prisma.groupGrade.upsert({
    where: {
      assessmentItemId_studentGroupId: { assessmentItemId, studentGroupId },
    },
    update: { score: groupScore },
    create: { assessmentItemId, studentGroupId, score: groupScore },
  });

  // Sobreescribe la nota de cada miembro con la del grupo.
  for (const m of group.memberships) {
    await prisma.grade.upsert({
      where: {
        assessmentItemId_studentId: { assessmentItemId, studentId: m.studentId },
      },
      update: { score: groupScore },
      create: { assessmentItemId, studentId: m.studentId, score: groupScore },
    });
  }
  revalidatePath(`/clases/${classGroupId}`);
}

/**
 * Guarda los ajustes individuales de los miembros del grupo. Para cada miembro
 * se usa la nota individual indicada; si se deja vacía, se aplica la nota base
 * del grupo. Es la acción «Guardar ajustes individuales».
 */
export async function saveGroupGradeAction(formData: FormData) {
  const user = await requireUser();
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const assessmentItemId = String(formData.get("assessmentItemId") ?? "");
  const studentGroupId = String(formData.get("studentGroupId") ?? "");

  const item = await prisma.assessmentItem.findFirst({
    where: { id: assessmentItemId, classGroup: { subject: { userId: user.id } } },
  });
  const group = await prisma.studentGroup.findFirst({
    where: { id: studentGroupId, classGroupId },
    include: { memberships: true },
  });
  if (!item || !group) throw new Error("Evaluable o grupo no encontrados.");

  const groupScore = num(formData.get("groupScore"));

  // Nota base del grupo.
  await prisma.groupGrade.upsert({
    where: {
      assessmentItemId_studentGroupId: { assessmentItemId, studentGroupId },
    },
    update: { score: groupScore },
    create: { assessmentItemId, studentGroupId, score: groupScore },
  });

  // Aplica a cada miembro (con posible ajuste individual).
  for (const m of group.memberships) {
    const override = num(formData.get(`member_${m.studentId}`));
    const finalScore = override ?? groupScore;
    await prisma.grade.upsert({
      where: {
        assessmentItemId_studentId: { assessmentItemId, studentId: m.studentId },
      },
      update: { score: finalScore },
      create: {
        assessmentItemId,
        studentId: m.studentId,
        score: finalScore,
      },
    });
  }
  revalidatePath(`/clases/${classGroupId}`);
}
