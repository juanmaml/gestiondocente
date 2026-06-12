import { CONVIVENCIA_LIMIT } from "@/lib/convivencia";
import { WarningIcon } from "./icons";

const COLOR = "#c026d3"; // fucsia: color del tipo de anotación "convivencia"

/**
 * Acumulado de convivencias sin parte de un alumno. A partir del límite se
 * resalta en sólido: toca tramitar un parte.
 */
export function ConvivenciaBadge({ count }: { count: number }) {
  if (count <= 0) return <span className="text-gray-300">—</span>;
  if (count >= CONVIVENCIA_LIMIT) {
    return (
      <span
        className="chip font-semibold"
        style={{ background: COLOR, color: "#fff" }}
        title={`${count} convivencias desde el último parte: corresponde tramitar un parte`}
      >
        <WarningIcon className="h-3 w-3" /> {count} · parte pendiente
      </span>
    );
  }
  return (
    <span
      className="chip"
      style={{ background: `${COLOR}22`, color: COLOR }}
      title={`${count} convivencia(s) desde el último parte`}
    >
      {count} de {CONVIVENCIA_LIMIT}
    </span>
  );
}
