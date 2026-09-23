import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scrubBatchJobPreservingDrafts } from "./store";
import type { BatchJobRecord, BatchJobStore } from "./types";
import { assertBatchJob } from "./validate";

function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

function fileName(record: BatchJobRecord): string {
  return `${record.batchNumber}.json`;
}

function replaceFile(destination: string, contents: string): void {
  const temporary = `${destination}.${process.pid}.tmp`;
  writeFileSync(temporary, contents, "utf8");
  rmSync(destination, { force: true });
  renameSync(temporary, destination);
}

/**
 * Local JSON files. This is durable across process restarts and is not a worker.
 * Callers must tick the batch; opening the directory does not execute it.
 */
export function createFileBatchJobStore(directory: string): BatchJobStore {
  if (!directory.trim()) fail("batch directory is required");
  return {
    load(batchId) {
      const match = /^studio-batch\/([0-9]{3,4})$/.exec(batchId);
      if (!match) return null;
      const path = join(directory, `${match[1]}.json`);
      let raw: string;
      try {
        raw = readFileSync(path, "utf8");
      } catch (error) {
        if (isRecord(error) && error.code === "ENOENT") return null;
        fail("batch file is unreadable");
      }
      try {
        return assertBatchJob(JSON.parse(raw));
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Batch production:")) throw error;
        fail("batch file is unreadable");
      }
    },
    save(record) {
      const checked = assertBatchJob(scrubBatchJobPreservingDrafts(record));
      mkdirSync(directory, { recursive: true });
      replaceFile(join(directory, fileName(checked)), `${JSON.stringify(checked, null, 2)}\n`);
    },
    list() {
      let names: string[] = [];
      try {
        names = readdirSync(directory);
      } catch (error) {
        if (isRecord(error) && error.code === "ENOENT") return [];
        fail("batch directory is unreadable");
      }
      return names
        .filter((name) => /^[0-9]{3,4}\.json$/.test(name))
        .map((name) => assertBatchJob(JSON.parse(readFileSync(join(directory, name), "utf8"))))
        .sort((left, right) => left.batchId.localeCompare(right.batchId));
    },
  };
}

function isRecord(value: unknown): value is { code?: string } {
  return value !== null && typeof value === "object";
}
