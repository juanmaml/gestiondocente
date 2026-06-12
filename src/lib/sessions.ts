import { addDays, isoDay, timeToMinutes, toDateKey } from "@/lib/dates";

export type SlotEntry = { dayOfWeek: number; startTime: string; endTime: string };
export type Slot = { dateKey: string; startTime: string; endTime: string };

/**
 * Calcula la franja programada anterior y siguiente respecto a una fecha/hora
 * de referencia, basándose en las entradas de horario de la clase.
 * Escanea hasta 21 días en cada dirección. Los días festivos se saltan.
 */
export function adjacentSlots(
  entries: SlotEntry[],
  refDateKey: string,
  refStart: string | undefined,
  holidays: ReadonlySet<string> = new Set()
): { prev: Slot | null; next: Slot | null } {
  if (entries.length === 0) return { prev: null, next: null };

  const [y, m, d] = refDateKey.split("-").map(Number);
  const ref = new Date(y, m - 1, d);
  const refStartMin = refStart ? timeToMinutes(refStart) : -1;

  let prev: Slot | null = null;
  let next: Slot | null = null;

  for (let offset = -21; offset <= 21; offset++) {
    const date = addDays(ref, offset);
    const dow = isoDay(date);
    const dateKey = toDateKey(date);
    if (offset !== 0 && holidays.has(dateKey)) continue;
    const dayEntries = entries
      .filter((e) => e.dayOfWeek === dow)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    for (const e of dayEntries) {
      const slot: Slot = {
        dateKey,
        startTime: e.startTime,
        endTime: e.endTime,
      };
      const startMin = timeToMinutes(e.startTime);

      const isBefore =
        offset < 0 || (offset === 0 && startMin < refStartMin);
      const isAfter = offset > 0 || (offset === 0 && startMin > refStartMin);

      if (isBefore) prev = slot; // se queda con el más cercano por debajo
      if (isAfter && !next) next = slot; // el primero por encima
    }
  }

  return { prev, next };
}

/**
 * Elige la franja por defecto al abrir una clase sin fecha concreta:
 * la de hoy si existe (y no es festivo), si no la próxima futura, si no la
 * última pasada.
 */
export function defaultSlot(
  entries: SlotEntry[],
  holidays: ReadonlySet<string> = new Set()
): Slot | null {
  if (entries.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const dow = isoDay(today);

  if (!holidays.has(todayKey)) {
    const todayEntries = entries
      .filter((e) => e.dayOfWeek === dow)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (todayEntries.length > 0) {
      return {
        dateKey: todayKey,
        startTime: todayEntries[0].startTime,
        endTime: todayEntries[0].endTime,
      };
    }
  }

  const { prev, next } = adjacentSlots(entries, todayKey, undefined, holidays);
  return next ?? prev;
}
