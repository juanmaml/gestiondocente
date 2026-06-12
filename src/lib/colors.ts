export const SUBJECT_COLORS = [
  "#4f46e5", // indigo
  "#0891b2", // cyan
  "#059669", // emerald
  "#ca8a04", // amber
  "#dc2626", // red
  "#db2777", // pink
  "#7c3aed", // violet
  "#ea580c", // orange
  "#0d9488", // teal
  "#475569", // slate
];

/** Nombre legible de cada color de asignatura (para lectores de pantalla). */
export const SUBJECT_COLOR_NAMES: Record<string, string> = {
  "#4f46e5": "índigo",
  "#0891b2": "cian",
  "#059669": "esmeralda",
  "#ca8a04": "ámbar",
  "#dc2626": "rojo",
  "#db2777": "rosa",
  "#7c3aed": "violeta",
  "#ea580c": "naranja",
  "#0d9488": "verde azulado",
  "#475569": "gris pizarra",
};

/** Color de texto legible (negro/blanco) sobre un color de fondo hex. */
export function readableText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}
