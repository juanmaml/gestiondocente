/**
 * Tipos de anotación sobre alumnos: etiqueta y color en un único sitio.
 * El color acompaña siempre a la etiqueta de texto (nunca es el único
 * canal de información).
 */
export const NOTE_TYPES = [
  { value: "positiva", label: "Positiva", color: "#059669" },
  { value: "negativa", label: "Negativa", color: "#dc2626" },
  { value: "incidencia", label: "Incidencia", color: "#ea580c" },
  { value: "convivencia", label: "Convivencia", color: "#c026d3" },
  { value: "parte", label: "Parte", color: "#0f766e" },
  { value: "general", label: "General", color: "#6b7280" },
];

/** Metadatos de un tipo de anotación; «general» si el tipo es desconocido. */
export function noteMeta(type: string) {
  return (
    NOTE_TYPES.find((t) => t.value === type) ??
    NOTE_TYPES[NOTE_TYPES.length - 1]
  );
}

/** Etiqueta legible por tipo (informes, tablas). */
export const NOTE_LABELS: Record<string, string> = Object.fromEntries(
  NOTE_TYPES.map((t) => [t.value, t.label])
);
