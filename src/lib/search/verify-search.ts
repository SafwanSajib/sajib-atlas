import { readFileSync } from "node:fs";
import { searchTopics } from "@/lib/search-data";
import {
  SEARCH_DEFAULT_LIMIT,
  SEARCH_FORBIDDEN_RESULT_KEYS,
  SEARCH_MAX_LIMIT,
  SEARCH_RANK_WEIGHTS,
  SEARCH_SCHEMA_VERSION,
  buildSearchIndex,
  normalizeSearchQuery,
  searchIndex,
  searchKnowledge,
  type SearchDocument,
  type SearchKnowledgeResult,
  type SearchResponse,
} from "./index";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Search verification failed: ${message}`);
}

function expectSuccess(result: SearchKnowledgeResult, message: string): SearchResponse {
  assert(result.ok, `${message}: expected success`);
  return result.data;
}

function expectFailure(result: SearchKnowledgeResult, code: string, message: string): void {
  assert(!result.ok, `${message}: expected failure`);
  if (result.ok) return;
  assert(result.error.code === code, `${message}: expected ${code}, got ${result.error.code}`);
}

function importedModules(source: string): string[] {
  const imports: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    imports.push(match[1]);
    match = re.exec(source);
  }
  return imports;
}

function collectKeys(value: unknown, keys: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
}

const ROTATION_TOPIC = "geography/earths-rotation";
const ROTATION_CONCEPT = "geography/earths-rotation/rotation";
const ROTATION_SET = "geography/earths-rotation/mcq-practice";

export function runSearchVerification(): string[] {
  const passed: string[] = [];
  const index = searchIndex;
  assert(index.schemaVersion === SEARCH_SCHEMA_VERSION, "schema version is 1");
  assert(JSON.stringify(buildSearchIndex()) === JSON.stringify(index), "index generation is deterministic");

  const byKind = {
    subject: index.documents.filter((item) => item.kind === "subject"),
    category: index.documents.filter((item) => item.kind === "category"),
    topic: index.documents.filter((item) => item.kind === "topic"),
    concept: index.documents.filter((item) => item.kind === "concept"),
    assessment_set: index.documents.filter((item) => item.kind === "assessment_set"),
  };
  assert(byKind.subject.length >= 1, "subject documents exist");
  assert(byKind.category.length >= 1, "category documents exist");
  assert(byKind.topic.length >= 1, "topic documents exist");
  assert(byKind.concept.length >= 1, "concept documents exist");
  assert(byKind.assessment_set.length >= 1, "assessment set documents exist");
  passed.push("canonical documents are generated for all supported kinds");

  const ids = index.documents.map((item) => item.id);
  assert(new Set(ids).size === ids.length, "search document ids are unique");
  const geography = index.documents.find((item) => item.id === "geography" && item.kind === "subject");
  const category = index.documents.find((item) => item.id === "geography/physical-geography" && item.kind === "category");
  const topic = index.documents.find((item) => item.id === ROTATION_TOPIC && item.kind === "topic");
  const concept = index.documents.find((item) => item.id === ROTATION_CONCEPT && item.kind === "concept");
  const assessment = index.documents.find((item) => item.id === ROTATION_SET && item.kind === "assessment_set");
  assert(geography?.title === "Geography", "subject id is canonical");
  assert(category?.title === "Physical Geography", "category id is canonical");
  assert(topic?.title === "Earth's Rotation", "topic id is canonical");
  assert(topic?.href === "/geography/earths-rotation", "topic href is canonical");
  assert(concept?.topicId === ROTATION_TOPIC && concept?.conceptId === ROTATION_CONCEPT, "concept keeps parent topic");
  assert(assessment?.assessmentSetId === ROTATION_SET && assessment?.topicId === ROTATION_TOPIC, "assessment set identity is canonical");
  assert(!("payload" in (assessment ?? {})), "assessment documents omit payload");
  passed.push("canonical IDs are preserved");

  assert(normalizeSearchQuery("  Earth's   Rotation  ") === "earth's rotation", "whitespace and case normalize");
  assert(normalizeSearchQuery("") === "", "empty query normalizes to empty");
  assert(normalizeSearchQuery("\t\n") === "", "whitespace-only query is empty");
  const firstNorm = normalizeSearchQuery("  Rotation ");
  const secondNorm = normalizeSearchQuery("  Rotation ");
  assert(firstNorm === secondNorm && firstNorm === "rotation", "normalization is deterministic");
  passed.push("query normalization is deterministic");

  const rotation = expectSuccess(searchKnowledge("rotation", { limit: 25 }), "rotation query");
  const rotationTopic = rotation.results.find((item) => item.id === ROTATION_TOPIC && item.kind === "topic");
  const rotationConcept = rotation.results.find((item) => item.id === ROTATION_CONCEPT && item.kind === "concept");
  assert(rotationTopic !== undefined, "Earth's Rotation topic is returned for rotation");
  assert(rotationConcept !== undefined, "Rotation concept is returned");
  assert(rotationConcept?.score === SEARCH_RANK_WEIGHTS.titleExact, "exact title uses titleExact weight");
  assert(rotationTopic?.score === SEARCH_RANK_WEIGHTS.titleContains, "title contains uses titleContains weight");
  assert(rotation.results[0]?.id === ROTATION_CONCEPT, "exact title match outranks weaker matches");
  passed.push("exact title match outranks weaker matches");

  const prefix = expectSuccess(searchKnowledge("earth's r", { limit: 25 }), "prefix query");
  const prefixHits = prefix.results.filter((item) => item.score === SEARCH_RANK_WEIGHTS.titlePrefix);
  assert(prefixHits.some((item) => item.id === ROTATION_TOPIC), "Earth's Rotation is a title prefix of earth's r");
  assert(prefixHits.some((item) => item.id === "geography/earths-revolution"), "Earth's Revolution is a title prefix");
  for (let i = 1; i < prefixHits.length; i += 1) {
    assert(prefixHits[i - 1]!.id < prefixHits[i]!.id, "same-score prefix hits tie-break by id");
  }
  passed.push("title-prefix behavior is deterministic");

  const keyword = expectSuccess(searchKnowledge("mcq-practice", { limit: 100 }), "keyword query");
  const keywordHit = keyword.results.find((item) => item.id === ROTATION_SET);
  assert(keywordHit !== undefined, "assessment set matches mcq-practice");
  assert(keywordHit?.matchedFields.includes("keywords"), "keyword field is recorded");
  assert(keywordHit?.score === SEARCH_RANK_WEIGHTS.keyword, "keyword match uses keyword weight");
  const summary = expectSuccess(searchKnowledge("earths-rotation", { limit: 25 }), "identifier/searchText query");
  assert(
    summary.results.some((item) => item.id === ROTATION_TOPIC && item.matchedFields.includes("identifier")),
    "canonical identifier matching works",
  );
  passed.push("keyword/summary matching works");

  const tied = prefixHits.map((item) => item.id);
  const tiedAgain = expectSuccess(searchKnowledge("earth's r", { limit: 25 }), "prefix again").results
    .filter((item) => item.score === SEARCH_RANK_WEIGHTS.titlePrefix)
    .map((item) => item.id);
  assert(JSON.stringify(tied) === JSON.stringify(tiedAgain), "tie-breaking is stable");
  passed.push("tie-breaking is deterministic");

  const limited = expectSuccess(searchKnowledge("geography", { limit: 2 }), "limit 2");
  assert(limited.results.length === 2, "limit truncates results");
  assert(limited.total > 2, "total is the unbounded match count");
  assert(limited.limit === 2, "limit is echoed");
  const defaulted = expectSuccess(searchKnowledge("geography"), "default limit");
  assert(defaulted.limit === SEARCH_DEFAULT_LIMIT, "default limit is 25");
  assert(defaulted.results.length <= SEARCH_DEFAULT_LIMIT, "default limit is applied");
  expectFailure(searchKnowledge("geography", { limit: 0 }), "validation_failure", "limit 0");
  expectFailure(searchKnowledge("geography", { limit: SEARCH_MAX_LIMIT + 1 }), "validation_failure", "limit too large");
  expectFailure(searchKnowledge("geography", { limit: 1.5 }), "validation_failure", "non-integer limit");
  passed.push("limit works and invalid limits fail deterministically");

  const empty = expectSuccess(searchKnowledge(""), "empty query");
  const blank = expectSuccess(searchKnowledge("   "), "blank query");
  assert(empty.results.length === 0 && empty.total === 0, "empty query returns no results");
  assert(blank.results.length === 0 && blank.total === 0, "whitespace query returns no results");
  assert(empty.query === "" && blank.query === "", "empty queries normalize to empty");
  passed.push("empty query returns no results");

  const encoded = JSON.stringify(rotation);
  assert(JSON.stringify(JSON.parse(encoded)) === encoded, "search response JSON round-trip");
  const documentJson = JSON.stringify(topic);
  assert(JSON.stringify(JSON.parse(documentJson)) === documentJson, "search document JSON round-trip");
  passed.push("results are JSON-safe");

  const allKeys = new Set<string>();
  collectKeys(rotation.results, allKeys);
  collectKeys(index.documents, allKeys);
  for (const forbidden of SEARCH_FORBIDDEN_RESULT_KEYS) {
    assert(!allKeys.has(forbidden), `search output must not contain ${forbidden}`);
  }
  assert(!allKeys.has("contentSource"), "search documents omit contentSource");
  const assessmentResults = expectSuccess(searchKnowledge("mcq practice", { limit: 25 }), "assessment title");
  for (const item of assessmentResults.results) {
    assert(item.kind !== "assessment_set" || !("payload" in item), "assessment results remain answer-free");
    assert(!("answer" in item) && !("explanation" in item), "results omit answers and explanations");
  }
  passed.push("internal payload/answer fields are not leaked");

  const runtime = [
    "src/lib/search/types.ts",
    "src/lib/search/normalize.ts",
    "src/lib/search/documents.ts",
    "src/lib/search/collection.ts",
    "src/lib/search/match.ts",
    "src/lib/search/rank.ts",
    "src/lib/search/retrieve.ts",
    "src/lib/search/index.ts",
  ];
  for (const path of runtime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("geography-data"), `${path} does not import Geography payload`);
      assert(specifier !== "react" && specifier !== "react-dom", `${path} has no React`);
      assert(!specifier.includes("lib/analytics"), `${path} has no analytics`);
      assert(!specifier.includes("lib/entitlement"), `${path} has no entitlement`);
      assert(!specifier.includes("lib/commerce"), `${path} has no commerce`);
      assert(!specifier.includes("lib/learner"), `${path} has no learner`);
      assert(!specifier.includes("store/learner"), `${path} has no learner store`);
      assert(!specifier.includes("lib/topic-engine"), `${path} does not import Topic Engine`);
      assert(!specifier.includes("openai") && !specifier.includes("OpenAI"), `${path} has no AI`);
    }
    assert(!source.includes("Date.now"), `${path} does not use Date.now`);
    assert(!source.includes("Math.random"), `${path} does not use Math.random`);
    assert(!source.includes("localStorage"), `${path} does not access localStorage`);
    assert(!source.includes("window."), `${path} has no window`);
    assert(!source.includes("fetch("), `${path} has no fetch`);
    assert(!source.includes("elasticsearch") && !source.includes("algolia"), `${path} has no search provider`);
  }
  passed.push("Geography payload is not scanned at query time");
  passed.push("search remains independent of learner, analytics, entitlement, commerce, AI, and database");

  const again = expectSuccess(searchKnowledge("rotation", { limit: 25 }), "repeat rotation");
  assert(JSON.stringify(again) === JSON.stringify(rotation), "repeated identical queries return identical results");
  passed.push("repeated identical queries return identical results");

  const legacy = searchTopics("rotation");
  assert(
    legacy.some((item) => item.id === ROTATION_TOPIC),
    "existing searchTopics still matches Earth's Rotation",
  );
  assert(searchTopics("").length === 0, "existing empty searchTopics remains empty");
  passed.push("existing searchTopics behavior remains compatible");

  const kinds = new Set(index.documents.map((item: SearchDocument) => item.kind));
  assert(!kinds.has("question" as SearchDocument["kind"]), "no question-level search documents");
  passed.push("no question-level search documents");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-search.ts");

if (executedFromCli) {
  const passed = runSearchVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("SEARCH_VERIFICATION: PASS");
}
