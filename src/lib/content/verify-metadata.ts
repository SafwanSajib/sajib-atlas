import { searchTopics } from "@/lib/search-data";
import { contentManifest, requireCanonicalTopic } from "./manifest";
import { INITIAL_CONTENT_VERSION } from "./metadata";
import { getContentProvenance } from "./sources";
import { validateContentMetadata } from "./validate";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Content metadata verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Content metadata verification failed: expected throw (${label})`);
}

export function runContentMetadataVerification(): string[] {
  const passed: string[] = [];
  const rotation = requireCanonicalTopic("geography/earths-rotation");
  const meta = rotation.contentMetadata;

  assert(rotation.id === "geography/earths-rotation", "topic id does not include version");
  assert(meta.version === INITIAL_CONTENT_VERSION, "initial Geography version is 1");
  assert(meta.lifecycle === "published", "live Geography content is published");
  assert(meta.sourceId === "module/geography-data", "Geography provenance is the payload module");
  assert(meta.updatedAt === undefined, "updatedAt is unknown, not invented");
  assert(
    !("sections" in meta) && !("mcqPractice" in meta),
    "content metadata does not carry payload",
  );
  passed.push("Earth's Rotation metadata is versioned, published, and payload-free");

  const provenance = getContentProvenance(meta.sourceId ?? "");
  assert(provenance?.kind === "repository-module", "provenance kind is repository-module");
  assert(provenance?.title === "src/lib/geography-data.ts", "provenance title is the module path");
  assert(provenance?.reference === undefined, "no invented citation reference");
  assert(provenance?.publisher === undefined, "no invented publisher");
  passed.push("Geography provenance is repository-module, not a citation");

  const bcs = requireCanonicalTopic("bcs/english");
  assert(bcs.contentMetadata.version === 1, "BCS stub version is 1");
  assert(bcs.contentMetadata.lifecycle === "published", "live BCS catalog stubs are published");
  assert(
    bcs.contentMetadata.sourceId === "module/knowledge-data",
    "BCS provenance is knowledge-data",
  );
  assert(bcs.contentStatus === "partial", "contentStatus remains payload completeness");
  passed.push("lifecycle is independent of contentStatus");

  for (const topic of contentManifest) {
    assert(topic.id === `${topic.subjectId}/${topic.slug}`, `topic id stable for ${topic.id}`);
    assert(
      Number.isInteger(topic.contentMetadata.version) && topic.contentMetadata.version >= 1,
      `version is a positive integer on ${topic.id}`,
    );
    assert(
      topic.contentMetadata.lifecycle === "published",
      `live catalog topic ${topic.id} is published`,
    );
  }
  passed.push("every catalog topic has explicit version 1 and published lifecycle");

  const valid = {
    version: 1,
    lifecycle: "published",
    sourceId: "module/geography-data",
  };
  expectThrow("version 0", () => validateContentMetadata({ ...valid, version: 0 }, rotation.id));
  expectThrow("negative version", () =>
    validateContentMetadata({ ...valid, version: -1 }, rotation.id),
  );
  expectThrow("non-integer version", () =>
    validateContentMetadata({ ...valid, version: 1.5 }, rotation.id),
  );
  expectThrow("invalid lifecycle", () =>
    validateContentMetadata({ ...valid, lifecycle: "live" }, rotation.id),
  );
  expectThrow("empty sourceId", () =>
    validateContentMetadata({ ...valid, sourceId: "  " }, rotation.id),
  );
  expectThrow("unknown sourceId", () =>
    validateContentMetadata({ ...valid, sourceId: "web/wikipedia" }, rotation.id),
  );
  expectThrow("empty updatedAt", () =>
    validateContentMetadata({ ...valid, updatedAt: "" }, rotation.id),
  );
  expectThrow("invalid updatedAt", () =>
    validateContentMetadata({ ...valid, updatedAt: "2026-13-40" }, rotation.id),
  );
  validateContentMetadata({ ...valid, updatedAt: "2026-09-02" }, rotation.id);
  validateContentMetadata({ version: 2, lifecycle: "draft" }, rotation.id);
  passed.push("metadata validation rejects invalid version, lifecycle, source, and dates");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === "geography/earths-rotation"),
    "search still matches Earth's Rotation by title/slug",
  );
  assert(
    hits.every((item) => item.title.toLowerCase().includes("rotation") || item.slug.includes("rotation")),
    "search does not rank or match on provenance metadata",
  );
  passed.push("search remains title/slug substring match");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-metadata.ts");

if (executedFromCli) {
  const passed = runContentMetadataVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("CONTENT_METADATA_VERIFICATION: PASS");
}
