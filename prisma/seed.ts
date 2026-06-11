// Seed de demostración: docente demo con asignaturas, clases, alumnos,
// horario, sesiones, anotaciones, evaluaciones y grupos.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function lastMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return d;
}

async function main() {
  const email = "demo@docente.es";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed ya aplicado (demo@docente.es existe). Saltando.");
    return;
  }

  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.create({
    data: { email, name: "Docente Demo", passwordHash },
  });

  const year = await prisma.academicYear.create({
    data: { userId: user.id, name: "2025-2026", isActive: true },
  });

  const mates = await prisma.subject.create({
    data: {
      userId: user.id,
      academicYearId: year.id,
      name: "Matemáticas",
      color: "#4f46e5",
    },
  });
  const tecno = await prisma.subject.create({
    data: {
      userId: user.id,
      academicYearId: year.id,
      name: "Tecnología",
      color: "#059669",
    },
  });

  const eso1A = await prisma.classGroup.create({
    data: { subjectId: mates.id, name: "1º ESO A" },
  });
  const eso2B = await prisma.classGroup.create({
    data: { subjectId: mates.id, name: "2º ESO B" },
  });
  const eso3A = await prisma.classGroup.create({
    data: { subjectId: tecno.id, name: "3º ESO A" },
  });

  // Alumnos
  const names: [string, string][] = [
    ["Lucía", "García Pérez"],
    ["Hugo", "Martínez López"],
    ["Martina", "Sánchez Ruiz"],
    ["Daniel", "Fernández Gómez"],
    ["Sofía", "López Díaz"],
    ["Pablo", "González Moreno"],
    ["Carla", "Rodríguez Jiménez"],
    ["Álvaro", "Hernández Muñoz"],
    ["Valeria", "Díaz Álvarez"],
    ["Mario", "Romero Navarro"],
    ["Julia", "Torres Domínguez"],
    ["Adrián", "Ramírez Gil"],
  ];
  const students = [];
  for (const [firstName, lastName] of names) {
    students.push(
      await prisma.student.create({
        data: { userId: user.id, firstName, lastName },
      })
    );
  }

  // Matrículas: 8 primeros en 1º ESO A, 6 últimos en 3º ESO A, 4 del medio en 2º ESO B
  for (const s of students.slice(0, 8)) {
    await prisma.classEnrollment.create({
      data: { classGroupId: eso1A.id, studentId: s.id },
    });
  }
  for (const s of students.slice(4, 8)) {
    await prisma.classEnrollment.create({
      data: { classGroupId: eso2B.id, studentId: s.id },
    });
  }
  for (const s of students.slice(6)) {
    await prisma.classEnrollment.create({
      data: { classGroupId: eso3A.id, studentId: s.id },
    });
  }

  // Horario semanal
  const schedule: [string, number, string, string][] = [
    [eso1A.id, 1, "09:00", "10:00"],
    [eso1A.id, 3, "11:30", "12:30"],
    [eso1A.id, 5, "09:00", "10:00"],
    [eso2B.id, 1, "10:00", "11:00"],
    [eso2B.id, 4, "12:30", "13:30"],
    [eso3A.id, 2, "09:00", "11:00"],
    [eso3A.id, 4, "09:00", "10:00"],
  ];
  for (const [classGroupId, dayOfWeek, startTime, endTime] of schedule) {
    await prisma.scheduleEntry.create({
      data: { classGroupId, dayOfWeek, startTime, endTime },
    });
  }

  // Sesiones de ejemplo (lunes de esta semana, 1º ESO A)
  const monday = lastMonday();
  const session = await prisma.classSession.create({
    data: {
      classGroupId: eso1A.id,
      date: monday,
      startTime: "09:00",
      endTime: "10:00",
      plannedContent: "Fracciones equivalentes. Ejercicios 1-5 pág. 42.",
      deliveredContent:
        "Fracciones equivalentes con material manipulativo. Solo dio tiempo a ejercicios 1-3.",
      homework: "Terminar ejercicios 4 y 5 de la página 42.",
      generalNotes: "Grupo participativo. Repasar simplificación el próximo día.",
      privateNotes: "Preparar actividad de refuerzo para Daniel y Pablo.",
    },
  });

  await prisma.studentNote.create({
    data: {
      studentId: students[0].id,
      classGroupId: eso1A.id,
      sessionId: session.id,
      date: monday,
      type: "positiva",
      content: "Salió a la pizarra y explicó muy bien las fracciones equivalentes.",
    },
  });
  await prisma.studentNote.create({
    data: {
      studentId: students[3].id,
      classGroupId: eso1A.id,
      sessionId: session.id,
      date: monday,
      type: "incidencia",
      content: "No trajo el material por segunda vez esta semana.",
    },
  });

  // Evaluables
  const examen = await prisma.assessmentItem.create({
    data: {
      classGroupId: eso1A.id,
      title: "Examen Tema 3: Fracciones",
      type: "examen",
      date: monday,
      maxScore: 10,
      weight: 40,
      term: "2ª eval",
      isGroup: false,
    },
  });
  const scores = [7.5, 8, 5.25, 4, 9, 6, 7, 8.5];
  for (let i = 0; i < 8; i++) {
    await prisma.grade.create({
      data: {
        assessmentItemId: examen.id,
        studentId: students[i].id,
        score: scores[i],
        observation: i === 3 ? "Necesita refuerzo en operaciones" : null,
      },
    });
  }

  // Trabajo grupal en Tecnología
  const proyecto = await prisma.assessmentItem.create({
    data: {
      classGroupId: eso3A.id,
      title: "Proyecto: Puente de palillos",
      type: "trabajo",
      maxScore: 10,
      weight: 30,
      term: "2ª eval",
      isGroup: true,
    },
  });

  const grupo1 = await prisma.studentGroup.create({
    data: {
      classGroupId: eso3A.id,
      name: "Grupo 1",
      notes: "Trabajan bien juntos.",
    },
  });
  const grupo2 = await prisma.studentGroup.create({
    data: { classGroupId: eso3A.id, name: "Grupo 2" },
  });

  const g1members = students.slice(6, 9);
  const g2members = students.slice(9);
  for (const s of g1members) {
    await prisma.groupMembership.create({
      data: { studentGroupId: grupo1.id, studentId: s.id },
    });
  }
  for (const s of g2members) {
    await prisma.groupMembership.create({
      data: { studentGroupId: grupo2.id, studentId: s.id },
    });
  }

  // Nota grupal con ajuste individual
  await prisma.groupGrade.create({
    data: { assessmentItemId: proyecto.id, studentGroupId: grupo1.id, score: 8.5 },
  });
  for (const [i, s] of g1members.entries()) {
    await prisma.grade.create({
      data: {
        assessmentItemId: proyecto.id,
        studentId: s.id,
        score: i === 2 ? 7 : 8.5, // ajuste individual al tercero
        observation: i === 2 ? "Participó menos en la construcción" : null,
      },
    });
  }

  console.log("Seed completado.");
  console.log("Usuario demo: demo@docente.es / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
