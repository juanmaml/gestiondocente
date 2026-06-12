/**
 * Contador en castellano: «1 alumno», «3 alumnos». El plural por defecto
 * añade una ese; para otras terminaciones se pasa explícito
 * (p. ej. plural(n, "anotación", "anotaciones")).
 */
export function plural(
  n: number,
  singular: string,
  pluralForm = `${singular}s`
): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
