import { STUDIO_STORAGE_KEY } from "./types";
import type { StudioKeyValueStore, StudioPersistedDraft } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function defaultStore(): StudioKeyValueStore | undefined {
  try {
    const storage = (globalThis as { localStorage?: StudioKeyValueStore }).localStorage;
    return storage;
  } catch {
    return undefined;
  }
}

export function loadStudioDrafts(store: StudioKeyValueStore | undefined = defaultStore()): readonly StudioPersistedDraft[] {
  if (!store) return [];
  let raw: string | null = null;
  try {
    raw = store.getItem(STUDIO_STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StudioPersistedDraft => {
      return isRecord(item) && typeof item.savedAt === "string" && isRecord(item.identity) && isRecord(item.record);
    });
  } catch {
    return [];
  }
}

export function saveStudioDraft(draft: StudioPersistedDraft, store: StudioKeyValueStore | undefined = defaultStore()): readonly StudioPersistedDraft[] {
  const next = [draft, ...loadStudioDrafts(store).filter((item) => item.identity.topicId !== draft.identity.topicId)];
  try {
    store?.setItem(STUDIO_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or disabled storage — in-memory result still returns.
  }
  return next;
}
