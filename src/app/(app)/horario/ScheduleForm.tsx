"use client";

import { Modal, ModalForm, ModalSubmit } from "@/components/Modal";
import { WEEKDAYS } from "@/lib/dates";
import { createScheduleEntryAction } from "./actions";

type ClassOption = { id: string; label: string };

export function NewScheduleButton({ classes }: { classes: ClassOption[] }) {
  return (
    <Modal
      title="Añadir franja al horario"
      trigger={(open) => (
        <button className="btn-primary" onClick={open} disabled={classes.length === 0}>
          + Añadir franja
        </button>
      )}
    >
      {(close) => (
        <ModalForm
          action={createScheduleEntryAction}
          close={close}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="classGroupId">
              Clase
            </label>
            <select id="classGroupId" name="classGroupId" className="input" required>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dayOfWeek">
              Día
            </label>
            <select id="dayOfWeek" name="dayOfWeek" className="input" required>
              {WEEKDAYS.slice(0, 5).map((d) => (
                <option key={d.value} value={d.value}>
                  {d.long}
                </option>
              ))}
              {WEEKDAYS.slice(5).map((d) => (
                <option key={d.value} value={d.value}>
                  {d.long}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="startTime">
                Inicio
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                className="input"
                defaultValue="09:00"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="endTime">
                Fin
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                className="input"
                defaultValue="10:00"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <ModalSubmit>Añadir</ModalSubmit>
          </div>
        </ModalForm>
      )}
    </Modal>
  );
}
