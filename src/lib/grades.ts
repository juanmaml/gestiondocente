/**
 * Cálculo de medias de calificaciones.
 *
 * Regla de ponderación: la media de una clase se pondera por el campo
 * «Peso %» de cada evaluable SOLO cuando todos los evaluables del conjunto
 * tienen peso definido. Si ninguno lo tiene (o solo algunos), se usa la
 * media simple y se informa de cuántos evaluables quedan sin peso, para que
 * la ponderación nunca se active ni desactive en silencio.
 *
 * La media global de un alumno es la media simple de sus medias por clase:
 * así los pesos de una asignatura no afectan a las demás y cada clase
 * cuenta igual.
 */

export type GradeForAverage = {
  score: number | null;
  maxScore: number;
  /** Peso en % (0-100); null si el evaluable no tiene peso asignado. */
  weight: number | null;
};

export type AverageResult = {
  /** Media sobre 10, o null si no hay ninguna nota. */
  value: number | null;
  /** true si se aplicó la ponderación por peso. */
  weighted: boolean;
  /**
   * Evaluables sin peso cuando otros sí lo tienen (estado mixto que
   * desactiva la ponderación). 0 si todos o ninguno tienen peso.
   */
  unweightedCount: number;
};

/** Nota normalizada a base 10 según la puntuación máxima del evaluable. */
export function normalizedScore(
  score: number | null,
  maxScore: number
): number | null {
  if (score == null || !maxScore || maxScore <= 0) return null;
  return (score / maxScore) * 10;
}

/**
 * Media de un conjunto de evaluables de una clase. Acepta evaluables sin
 * nota (score null): no entran en la media pero sí cuentan para decidir si
 * la ponderación está activa, de modo que todos los alumnos de un mismo
 * cuaderno compartan la misma regla.
 */
export function classAverage(items: GradeForAverage[]): AverageResult {
  const graded = items.filter(
    (i) => i.score != null && i.maxScore > 0
  );
  if (graded.length === 0) {
    return { value: null, weighted: false, unweightedCount: 0 };
  }

  const allWeighted =
    items.length > 0 && items.every((i) => i.weight != null);
  const totalWeight = graded.reduce((sum, i) => sum + (i.weight ?? 0), 0);

  if (allWeighted && totalWeight > 0) {
    const sum = graded.reduce(
      (acc, i) => acc + normalizedScore(i.score, i.maxScore)! * i.weight!,
      0
    );
    return { value: sum / totalWeight, weighted: true, unweightedCount: 0 };
  }

  const vals = graded.map((i) => normalizedScore(i.score, i.maxScore)!);
  const someWeighted = items.some((i) => i.weight != null);
  return {
    value: vals.reduce((a, b) => a + b, 0) / vals.length,
    weighted: false,
    unweightedCount: someWeighted
      ? items.filter((i) => i.weight == null).length
      : 0,
  };
}

/** Media simple de un conjunto de medias (ignora las clases sin notas). */
export function averageOfAverages(
  values: (number | null)[]
): number | null {
  const vals = values.filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
