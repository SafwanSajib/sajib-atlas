import type { EditorialDraftRecord, EditorialDraftStore } from "./types";

function clone(record: EditorialDraftRecord): EditorialDraftRecord {
  return structuredClone(record);
}

function keyOf(batchId: string, itemId: string): string {
  return `${batchId}\n${itemId}`;
}

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

export function createMemoryEditorialDraftStore(): EditorialDraftStore {
  const records = new Map<string, EditorialDraftRecord>();
  let chain: Promise<void> = Promise.resolve();

  function write(record: EditorialDraftRecord, expectedRevision: number): void {
    const key = keyOf(record.batchId, record.itemId);
    const current = records.get(key);
    const currentRevision = current ? current.revision : 0;
    if (expectedRevision !== currentRevision || record.revision !== expectedRevision + 1) {
      fail("stale edit");
    }
    records.set(key, clone(record));
  }

  return {
    load(batchId, itemId) {
      const found = records.get(keyOf(batchId, itemId));
      return found ? clone(found) : null;
    },
    save(record, expectedRevision) {
      let failure: unknown;
      let executed = false;
      const run = () => {
        if (executed) return;
        executed = true;
        try {
          write(record, expectedRevision);
        } catch (error) {
          failure = error;
        }
      };
      chain = chain.then(run, run);
      run();
      if (failure) throw failure;
    },
    list() {
      return [...records.values()]
        .map((record) => clone(record))
        .sort((left, right) => left.batchId.localeCompare(right.batchId) || left.itemId.localeCompare(right.itemId));
    },
  };
}
