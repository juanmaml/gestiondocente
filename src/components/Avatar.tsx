import { SUBJECT_COLORS, readableText } from "@/lib/colors";

/** Color estable derivado del nombre, para que cada alumno conserve el suyo. */
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

function initials(name: string): string {
  const parts = name
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Círculo con las iniciales del alumno; agiliza el escaneo visual de listas. */
export function Avatar({
  name,
  className = "h-8 w-8 text-xs",
}: {
  name: string;
  className?: string;
}) {
  const color = colorFor(name);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${className}`}
      style={{ background: color, color: readableText(color) }}
    >
      {initials(name)}
    </span>
  );
}
