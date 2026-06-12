"use client";

import { Modal } from "@/components/Modal";
import { AssessmentForm, type AssessmentDefaults } from "./AssessmentForm";

/** Abre el formulario del evaluable precargado para editarlo. */
export function EditAssessmentButton({
  classGroupId,
  assessment,
}: {
  classGroupId: string;
  assessment: AssessmentDefaults;
}) {
  return (
    <Modal
      title="Editar evaluable"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Editar
        </button>
      )}
    >
      {(close) => (
        <AssessmentForm
          classGroupId={classGroupId}
          close={close}
          assessment={assessment}
        />
      )}
    </Modal>
  );
}
