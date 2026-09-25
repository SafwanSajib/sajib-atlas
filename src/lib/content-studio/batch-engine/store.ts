import type { ProductionRecord } from "@/lib/content/production/types";
import { scrubStored } from "./sanitize";
import type { BatchJobRecord, BatchJobStore } from "./types";
import { assertBatchJob } from "./validate";

export function scrubBatchJobPreservingDrafts(record: BatchJobRecord): BatchJobRecord {
  const drafts = new Map<string, ProductionRecord>();
  const stripped: BatchJobRecord = {
    ...record,
    items: record.items.map((item) => {
      if (!item.result?.draft) return item;
      drafts.set(item.itemId, structuredClone(item.result.draft));
      const result = { ...item.result };
      delete result.draft;
      return { ...item, result };
    }),
  };
  const scrubbed = scrubStored(stripped);
  return {
    ...scrubbed,
    items: scrubbed.items.map((item) => {
      const draft = drafts.get(item.itemId);
      if (!draft || !item.result) return item;
      return { ...item, result: { ...item.result, draft } };
    }),
  };
}

function clone(record: BatchJobRecord): BatchJobRecord {
  return assertBatchJob(scrubBatchJobPreservingDrafts(record));
}

export function createMemoryBatchJobStore(): BatchJobStore {
  const records = new Map<string, BatchJobRecord>();
  return {
    load(batchId) {
      const found = records.get(batchId);
      return found ? clone(found) : null;
    },
    save(record) {
      records.set(record.batchId, clone(record));
    },
    list() {
      return [...records.values()].map((record) => clone(record)).sort((left, right) => left.batchId.localeCompare(right.batchId));
    },
  };
}
