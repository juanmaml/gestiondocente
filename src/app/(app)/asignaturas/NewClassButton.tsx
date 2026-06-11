"use client";

import { Modal } from "@/components/Modal";
import { createClassAction } from "./actions";

export function NewClassButton({ subjectId }: { subjectId: string }) {
  return (
    <Modal
      title="Nueva clase"
      trigger={(open) => (
        <button
          className="text-sm font-medium text-indigo-600 hover:underline"
          onClick={open}
        >
          + Añadir clase
        </button>
      )}
    >
      {(close) => (
        <form action={createClassAction} className="space-y-4">
          <input type="hidden" name="subjectId" value={subjectId} />
          <div>
            <label className="label" htmlFor="class-name">
              Nombre de la clase
            </label>
            <input
              id="class-name"
              name="name"
              className="input"
              placeholder="1º ESO A"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" onClick={close}>
              Crear clase
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
