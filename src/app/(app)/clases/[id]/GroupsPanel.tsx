"use client";

import { Modal } from "@/components/Modal";
import {
  createGroupAction,
  deleteGroupAction,
  setGroupMembersAction,
} from "./actions";

type Student = { id: string; firstName: string; lastName: string };
type Group = {
  id: string;
  name: string;
  notes: string | null;
  memberIds: string[];
  memberNames: string[];
};

export function NewGroupButton({ classGroupId }: { classGroupId: string }) {
  return (
    <Modal
      title="Nuevo grupo de trabajo"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          + Nuevo grupo
        </button>
      )}
    >
      {(close) => (
        <form action={createGroupAction} className="space-y-4">
          <input type="hidden" name="classGroupId" value={classGroupId} />
          <div>
            <label className="label" htmlFor="g-name">
              Nombre del grupo
            </label>
            <input
              id="g-name"
              name="name"
              className="input"
              placeholder="Grupo 1"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="g-notes">
              Anotaciones (opcional)
            </label>
            <textarea
              id="g-notes"
              name="notes"
              rows={2}
              className="input resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" onClick={close}>
              Crear grupo
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function GroupCard({
  classGroupId,
  group,
  students,
}: {
  classGroupId: string;
  group: Group;
  students: Student[];
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{group.name}</h3>
        <form action={deleteGroupAction}>
          <input type="hidden" name="id" value={group.id} />
          <input type="hidden" name="classGroupId" value={classGroupId} />
          <button className="text-xs text-red-500 hover:underline">
            Eliminar
          </button>
        </form>
      </div>

      {group.notes && (
        <p className="mb-2 text-sm text-gray-500">{group.notes}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {group.memberNames.length === 0 ? (
          <span className="text-sm text-gray-400">Sin integrantes</span>
        ) : (
          group.memberNames.map((n) => (
            <span key={n} className="chip bg-indigo-50 text-indigo-700">
              {n}
            </span>
          ))
        )}
      </div>

      <Modal
        title={`Integrantes de ${group.name}`}
        trigger={(open) => (
          <button
            className="text-sm font-medium text-indigo-600 hover:underline"
            onClick={open}
          >
            Editar integrantes
          </button>
        )}
      >
        {(close) => (
          <form action={setGroupMembersAction} className="space-y-3">
            <input type="hidden" name="classGroupId" value={classGroupId} />
            <input type="hidden" name="studentGroupId" value={group.id} />
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No hay alumnos matriculados en la clase.
                </p>
              ) : (
                students.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="memberId"
                      value={s.id}
                      defaultChecked={group.memberIds.includes(s.id)}
                      className="h-4 w-4"
                    />
                    {s.lastName}, {s.firstName}
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" onClick={close}>
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
