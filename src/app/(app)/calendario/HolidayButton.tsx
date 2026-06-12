"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { SunIcon } from "@/components/icons";
import { createHolidayAction } from "./actions";

/** Marca un día como festivo/no lectivo: se refleja en el calendario y la
 *  navegación entre sesiones lo salta. */
export function HolidayButton({ defaultDate }: { defaultDate: string }) {
  return (
    <Modal
      title="Marcar día festivo"
      trigger={(open) => (
        <button className="btn-secondary" onClick={open} title="Añadir festivo">
          <SunIcon /> Festivo
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={createHolidayAction}
          close={close}
          className="space-y-4"
          successMessage="Día festivo guardado."
        >
          <div>
            <label className="label" htmlFor="holiday-date">
              Fecha
            </label>
            <input
              id="holiday-date"
              name="date"
              type="date"
              className="input"
              defaultValue={defaultDate}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="holiday-name">
              Nombre
            </label>
            <input
              id="holiday-name"
              name="name"
              className="input"
              placeholder="Día del centro, puente…"
              autoFocus
              required
            />
          </div>
          <p className="text-xs text-gray-400">
            Las sesiones de ese día no contarán al navegar entre «sesión
            anterior» y «próxima sesión».
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Guardar festivo</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
