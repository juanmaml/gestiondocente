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

/** Luminancia relativa WCAG de un color hex. */
function relativeLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const channel = (i: number) => {
    const s = parseInt(c.substring(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

const INK_LUMINANCE = relativeLuminance("#111827");

/**
 * Color de texto legible (tinta/blanco) sobre un fondo hex, con sesgo
 * hacia el blanco: sobre colores saturados medios (esmeralda, naranja,
 * cian) el blanco lee mejor y mantiene coherentes los bloques del
 * calendario, así que se acepta mientras supere 3,5:1 (umbral de texto
 * grande/componentes). Solo cuando el blanco cae por debajo (ámbar,
 * ~2,9:1) y la tinta contrasta más, se cambia a tinta oscura.
 */
export function readableText(hex: string): string {
  const bg = relativeLuminance(hex);
  const contrastInk = (bg + 0.05) / (INK_LUMINANCE + 0.05);
  const contrastWhite = 1.05 / (bg + 0.05);
  if (contrastWhite >= 3.5 || contrastWhite >= contrastInk) return "#ffffff";
  return "#111827";
}
