"use client";

import { useTransition } from "react";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toaster";
import { BanIcon } from "@/components/icons";
import { setSessionCancelledAction } from "./actions";

/** Marca/desmarca la sesión mostrada como cancelada (excursión, huelga…). */
export function CancelSessionButton({
  classGroupId,
  date,
  startTime,
  endTime,
  cancelled,
}: {
  classGroupId: string;
  date: string;
  startTime: string;
  endTime: string;
  cancelled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    const formData = new FormData();
    formData.set("classGroupId", classGroupId);
    formData.set("date", date);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    formData.set("cancelled", String(!cancelled));
    startTransition(async () => {
      try {
        await setSessionCancelledAction(formData);
        toast.success(
          cancelled ? "Sesión restaurada." : "Sesión marcada como cancelada."
        );
      } catch {
        toast.error("No se pudo actualizar la sesión.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cancelled ? "btn-primary" : "btn-secondary"}
      title={
        cancelled
          ? "Volver a contar esta sesión como impartida"
          : "Marcar como no impartida (excursión, huelga…)"
      }
    >
      {pending && <Spinner className="h-4 w-4" />}
      {!pending && !cancelled && <BanIcon />}
      {cancelled ? "Restaurar sesión" : "Cancelar sesión"}
    </button>
  );
}
