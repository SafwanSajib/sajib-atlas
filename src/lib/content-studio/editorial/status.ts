import type { EditorialStatus } from "./types";

export const EDITORIAL_TRANSITIONS: Readonly<Record<EditorialStatus, readonly EditorialStatus[]>> = {
  needs_editing: ["ready_for_review"],
  ready_for_review: ["ready_for_approval", "changes_requested", "needs_editing"],
  ready_for_approval: ["changes_requested", "needs_editing"],
  changes_requested: ["needs_editing"],
};

export function assertEditorialTransition(from: EditorialStatus, to: EditorialStatus): void {
  if (!EDITORIAL_TRANSITIONS[from].includes(to)) {
    throw new Error("Editorial workspace: invalid editorial transition");
  }
}
