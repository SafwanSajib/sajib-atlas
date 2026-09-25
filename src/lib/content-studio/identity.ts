import type { StudioTopicIdentity, StudioTopicIdentityInput } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message: string): never {
  throw new Error(`Content Production Studio: ${message}`);
}

function normalizeSlug(value: string, label: string): string {
  const slug = value.trim().toLowerCase();
  if (!SLUG.test(slug)) fail(`${label} must be a lowercase hyphenated slug`);
  return slug;
}

export function slugFromTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!SLUG.test(slug)) fail("could not derive a topic slug from title");
  return slug;
}

export function resolveStudioIdentity(input: StudioTopicIdentityInput): StudioTopicIdentity {
  if (input === null || typeof input !== "object") fail("identity input is required");
  const title = input.title?.trim() ?? "";
  if (!title) fail("title is required");
  const subjectSlug = normalizeSlug(input.subjectSlug ?? "", "subjectSlug");
  const topicSlug = input.topicSlug?.trim() ? normalizeSlug(input.topicSlug, "topicSlug") : slugFromTitle(title);
  const disciplineSlug = input.disciplineSlug?.trim()
    ? normalizeSlug(input.disciplineSlug, "disciplineSlug")
    : subjectSlug;
  const summary = input.summary?.trim() ?? "";
  return {
    topicId: `topic/${subjectSlug}/${topicSlug}`,
    subjectId: `subject/${subjectSlug}`,
    disciplineId: `discipline/${disciplineSlug}`,
    subjectSlug,
    topicSlug,
    title,
    summary,
  };
}
