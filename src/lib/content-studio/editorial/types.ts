import type { ProductionQualitySnapshot, ProductionRecord } from "@/lib/content/production/types";
import type { ReviewProjection } from "@/lib/content/review/types";
import type { BatchItemState } from "../batch-engine/types";

export const EDITORIAL_SCHEMA_VERSION = "studio-editorial-draft/v1";

export const EDITORIAL_LIMITS = {
  operators: 1,
  recordsPerBatchItem: 1,
  maxJsonBytes: 1_048_576,
  maxChanges: 200,
  maxNotes: 50,
  lock: "revision-compare-and-swap",
} as const;

export type EditorialStatus =
  | "needs_editing"
  | "ready_for_review"
  | "changes_requested"
  | "ready_for_approval";

export type EditorialNote = {
  noteId: string;
  body: string;
  createdAt: string;
};

export type EditorialChange = {
  revision: number;
  at: string;
  path: string;
  previousValue: string;
  newValue: string;
  reason?: string;
  actorLabel?: string;
};

export type EditorialDraftRecord = {
  schemaVersion: typeof EDITORIAL_SCHEMA_VERSION;
  batchId: string;
  itemId: string;
  editorialStatus: EditorialStatus;
  revision: number;
  updatedAt: string;
  sourceCompletedAt: string;
  contentVersion: number;
  production: ProductionRecord;
  notes: readonly EditorialNote[];
  changes: readonly EditorialChange[];
};

export type EditorialDraftStore = {
  load(batchId: string, itemId: string): EditorialDraftRecord | null;
  save(record: EditorialDraftRecord, expectedRevision: number): void;
  list(): readonly EditorialDraftRecord[];
};

export type EditorialWorkspaceView = {
  persisted: boolean;
  expectedRevision: number;
  revision: number;
  editorialStatus: EditorialStatus;
  production: ProductionRecord;
  qualitySnapshot?: ProductionQualitySnapshot;
  projection?: ReviewProjection;
  notes: readonly EditorialNote[];
  changes: readonly EditorialChange[];
  lanes: readonly string[];
  canonical: false;
  publishable: false;
  batchId: string;
  itemId: string;
  updatedAt: string;
  sourceCompletedAt: string;
  contentVersion: number;
  generationState: BatchItemState;
  batchNumber: string;
  subjectId: string;
  topicTitle: string;
};
