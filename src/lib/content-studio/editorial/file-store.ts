import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EditorialDraftRecord, EditorialDraftStore } from "./types";
import { EDITORIAL_LIMITS, EDITORIAL_SCHEMA_VERSION } from "./types";

function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}

function isEnoent(error: unknown): boolean {
  return error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT";
}

function relativePath(batchId: string, itemId: string): string {
  const match = /^studio-batch\/([0-9]{3,4})\/item\/([0-9]{3})\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(itemId);
  if (!match || batchId !== `studio-batch/${match[1]}`) fail("persistence failure");
  return join(match[1], `${match[2]}--${match[3]}.json`);
}

// Best-effort temp write, unlink, then rename. Not crash-atomic on Windows.
function replaceFile(destination: string, contents: string): void {
  const temporary = `${destination}.${process.pid}.tmp`;
  writeFileSync(temporary, contents, "utf8");
  rmSync(destination, { force: true });
  renameSync(temporary, destination);
}

export function createFileEditorialDraftStore(directory: string): EditorialDraftStore {
  let chain: Promise<void> = Promise.resolve();

  function read(batchId: string, itemId: string): EditorialDraftRecord | null {
    const path = join(directory, relativePath(batchId, itemId));
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch (error) {
      if (isEnoent(error)) return null;
      fail("persistence failure");
    }
    let parsed: EditorialDraftRecord;
    try {
      parsed = JSON.parse(raw) as EditorialDraftRecord;
    } catch {
      fail("persistence failure");
    }
    if (parsed.schemaVersion !== EDITORIAL_SCHEMA_VERSION) fail("persistence failure");
    return parsed;
  }

  function write(record: EditorialDraftRecord, expectedRevision: number): void {
    const current = read(record.batchId, record.itemId);
    const currentRevision = current ? current.revision : 0;
    if (expectedRevision !== currentRevision || record.revision !== expectedRevision + 1) fail("stale edit");
    const payload = JSON.stringify(record);
    if (Buffer.byteLength(payload, "utf8") > EDITORIAL_LIMITS.maxJsonBytes) fail("persistence failure");
    const path = join(directory, relativePath(record.batchId, record.itemId));
    mkdirSync(dirname(path), { recursive: true });
    replaceFile(path, payload);
  }

  return {
    load(batchId, itemId) {
      return read(batchId, itemId);
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
      let batchNumbers: string[] = [];
      try {
        batchNumbers = readdirSync(directory);
      } catch (error) {
        if (isEnoent(error)) return [];
        fail("persistence failure");
      }
      const records: EditorialDraftRecord[] = [];
      for (const batchNumber of batchNumbers) {
        if (!/^[0-9]{3,4}$/.test(batchNumber)) continue;
        const folder = join(directory, batchNumber);
        let names: string[] = [];
        try {
          names = readdirSync(folder);
        } catch (error) {
          if (isEnoent(error)) continue;
          fail("persistence failure");
        }
        for (const name of names) {
          if (!/^[0-9]{3}--[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name)) continue;
          const parsed = JSON.parse(readFileSync(join(folder, name), "utf8")) as EditorialDraftRecord;
          if (parsed.schemaVersion !== EDITORIAL_SCHEMA_VERSION) fail("persistence failure");
          records.push(parsed);
        }
      }
      return records.sort((left, right) => left.batchId.localeCompare(right.batchId) || left.itemId.localeCompare(right.itemId));
    },
  };
}
