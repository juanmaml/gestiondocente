// Parser de listas de alumnos pegadas desde Excel o texto plano.
// Se usa tanto en el cliente (previsualización) como en el servidor (importación).

export type ParsedStudent = {
  firstName: string;
  lastName: string;
  email: string | null;
};

/**
 * Interpreta una línea por alumno:
 * - "Apellidos, Nombre"  → forma recomendada (la habitual en los listados).
 * - "Nombre Apellidos…"  → sin coma: la primera palabra es el nombre.
 * - El email es opcional, separado por tabulador o punto y coma
 *   (p. ej. al pegar dos columnas desde Excel).
 */
export function parseStudentList(text: string): ParsedStudent[] {
  const students: ParsedStudent[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Separa un posible email (columna con @) del nombre.
    let namePart = line;
    let email: string | null = null;
    const cells = line.split(/[\t;]+/).map((c) => c.trim()).filter(Boolean);
    if (cells.length > 1) {
      const emailCell = cells.find((c) => c.includes("@"));
      if (emailCell) {
        email = emailCell;
        namePart = cells.filter((c) => c !== emailCell).join(" ").trim();
      } else {
        namePart = cells.join(" ").trim();
      }
    }

    let firstName = "";
    let lastName = "";
    const commaIdx = namePart.indexOf(",");
    if (commaIdx >= 0) {
      lastName = namePart.slice(0, commaIdx).trim();
      firstName = namePart.slice(commaIdx + 1).trim();
    } else {
      const words = namePart.split(/\s+/).filter(Boolean);
      firstName = words[0] ?? "";
      lastName = words.slice(1).join(" ");
    }

    if (!firstName) continue;
    if (!lastName) lastName = "—";
    students.push({ firstName, lastName, email });
  }
  return students;
}
