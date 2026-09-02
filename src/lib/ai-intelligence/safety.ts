/**
 * Safety checks for AI contracts. Architectural boundary, not a moderator.
 */

import { AI_FORBIDDEN_KEYS } from "./types";

const FORBIDDEN_KEY_SET = new Set<string>(AI_FORBIDDEN_KEYS);

const FORBIDDEN_PATH_FRAGMENTS = [
  "geography-data.ts",
  "src/lib/",
  "node_modules/",
  "localStorage",
  "sajib_atlas_learner_state",
];

export function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== "object") return keys;
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

export function findForbiddenKeys(value: unknown): string[] {
  const keys = collectKeys(value);
  const found: string[] = [];
  for (const key of FORBIDDEN_KEY_SET) {
    if (keys.has(key)) found.push(key);
  }
  return found;
}

function collectStrings(value: unknown, strings: string[] = []): string[] {
  if (typeof value === "string") {
    strings.push(value);
    return strings;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, strings);
    return strings;
  }
  if (value === null || typeof value !== "object") return strings;
  for (const nested of Object.values(value)) collectStrings(nested, strings);
  return strings;
}

export function findForbiddenPathFragments(value: unknown): string[] {
  const found: string[] = [];
  for (const text of collectStrings(value)) {
    const lower = text.toLowerCase();
    for (const fragment of FORBIDDEN_PATH_FRAGMENTS) {
      if (lower.includes(fragment.toLowerCase()) && !found.includes(fragment)) {
        found.push(fragment);
      }
    }
  }
  return found;
}

export function assertAiSafeSurface(value: unknown, label: string): string | undefined {
  const keys = findForbiddenKeys(value);
  if (keys.length > 0) return `${label} contains forbidden field: ${keys[0]}`;
  const paths = findForbiddenPathFragments(value);
  if (paths.length > 0) return `${label} contains internal path fragment: ${paths[0]}`;
  return undefined;
}
