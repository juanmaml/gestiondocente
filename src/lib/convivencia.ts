// Lógica de "Convivencias": anotaciones de conducta que, al acumularse,
// obligan a tramitar un parte disciplinario.

/** Número de convivencias a partir del cual corresponde poner un parte. */
export const CONVIVENCIA_LIMIT = 3;

type ConductNote = { type: string; date: Date; createdAt: Date };

/**
 * Convivencias acumuladas desde el último parte (en orden cronológico).
 * Registrar una anotación de tipo "parte" pone el contador a cero.
 */
export function pendingConvivencias(notes: ConductNote[]): number {
  const sorted = [...notes].sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
  let count = 0;
  for (const n of sorted) {
    if (n.type === "parte") count = 0;
    else if (n.type === "convivencia") count++;
  }
  return count;
}

/**
 * Cuenta las convivencias pendientes por alumno a partir de una lista plana
 * de anotaciones de conducta de varios alumnos.
 */
export function pendingConvivenciasByStudent(
  notes: (ConductNote & { studentId: string })[]
): Map<string, number> {
  const byStudent = new Map<string, ConductNote[]>();
  for (const n of notes) {
    const list = byStudent.get(n.studentId) ?? [];
    list.push(n);
    byStudent.set(n.studentId, list);
  }
  const result = new Map<string, number>();
  for (const [studentId, list] of byStudent) {
    result.set(studentId, pendingConvivencias(list));
  }
  return result;
}
