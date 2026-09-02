import { searchTopics } from "@/lib/search-data";
import type { AnalyticsEvent } from "./types";
import { validateAnalyticsEvent } from "./validate";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Analytics event verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Analytics event verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
}

export function runAnalyticsEventVerification(): string[] {
  const passed: string[] = [];

  const completed = validateAnalyticsEvent({
    eventId: "evt_sample_topic_completed",
    type: "topic_completed",
    entity: { type: "topic", id: "geography/earths-rotation" },
    occurredAt: "2026-09-02T12:00:00.000Z",
    context: { topicId: "geography/earths-rotation", surface: "study" },
  });
  assert(completed.eventId !== completed.entity.id, "eventId is distinct from topic id");
  assert(completed.type === "topic_completed", "topic_completed is a valid type");
  assert(completed.entity.id === "geography/earths-rotation", "entity uses canonical topic id");
  assert(completed.occurredAt.includes("T"), "occurredAt is a datetime, not a publication date");
  assertJsonSafe(completed, "topic_completed event");
  passed.push("topic_completed references canonical topic identity");

  const viewed = validateAnalyticsEvent({
    eventId: "evt_sample_topic_viewed",
    type: "topic_viewed",
    entity: { type: "topic", id: "geography/earths-rotation" },
    occurredAt: "2026-09-02T12:00:00Z",
    context: { surface: "study" },
  });
  assert(viewed.occurredAt === "2026-09-02T12:00:00Z", "datetime without millis is accepted");
  passed.push("topic_viewed is valid for an existing study topic");

  const started = validateAnalyticsEvent({
    eventId: "evt_sample_assessment_started",
    type: "assessment_started",
    entity: { type: "assessment_set", id: "geography/earths-rotation/mcq-practice" },
    occurredAt: "2026-09-02T12:05:00.000Z",
    context: {
      topicId: "geography/earths-rotation",
      assessmentSetId: "geography/earths-rotation/mcq-practice",
      surface: "practice",
    },
  });
  assert(!("questions" in started), "assessment event does not embed questions");
  assert(!("answer" in started), "assessment event does not embed answers");
  const completedSet = validateAnalyticsEvent({
    eventId: "evt_sample_assessment_completed",
    type: "assessment_completed",
    entity: { type: "assessment_set", id: "geography/earths-rotation/mcq-practice" },
    occurredAt: "2026-09-02T12:10:00.000Z",
    metadata: { questionCount: 5 },
  });
  assert(completedSet.metadata?.questionCount === 5, "primitive metadata is allowed");
  passed.push("assessment events reference assessment-set identity only");

  const revision = validateAnalyticsEvent({
    eventId: "evt_sample_revision_opened",
    type: "revision_opened",
    entity: { type: "topic", id: "geography/earths-rotation" },
    occurredAt: "2026-09-02T12:15:00.000Z",
    context: { surface: "revision" },
  });
  assert(revision.context?.surface === "revision", "revision surface is valid");
  passed.push("revision_opened references a canonical topic");

  expectThrow("empty eventId", () =>
    validateAnalyticsEvent({ ...completed, eventId: "  " }),
  );
  expectThrow("eventId equals entity id", () =>
    validateAnalyticsEvent({ ...completed, eventId: "geography/earths-rotation" }),
  );
  expectThrow("invalid type", () =>
    validateAnalyticsEvent({ ...completed, type: "dashboard_opened" }),
  );
  expectThrow("wrong entity type", () =>
    validateAnalyticsEvent({
      ...completed,
      entity: { type: "assessment_set", id: "geography/earths-rotation/mcq-practice" },
    }),
  );
  expectThrow("unknown topic", () =>
    validateAnalyticsEvent({
      ...completed,
      entity: { type: "topic", id: "geography/missing" },
    }),
  );
  expectThrow("date-only timestamp", () =>
    validateAnalyticsEvent({ ...completed, occurredAt: "2026-09-02" }),
  );
  expectThrow("PII metadata key", () =>
    validateAnalyticsEvent({ ...completed, metadata: { email: "user@example.com" } }),
  );
  expectThrow("token metadata key", () =>
    validateAnalyticsEvent({ ...completed, metadata: { accessToken: "abc" } }),
  );
  expectThrow("mismatched assessment context", () =>
    validateAnalyticsEvent({
      ...started,
      context: {
        topicId: "geography/seasons",
        assessmentSetId: "geography/earths-rotation/mcq-practice",
      },
    }),
  );
  passed.push("validation rejects invalid identity, timestamps, PII, and mismatched refs");

  const keys = Object.keys(completed);
  assert(!keys.includes("password"), "contract has no password field");
  assert(!keys.includes("ip"), "contract has no ip field");
  assert(!keys.includes("email"), "contract has no email field");
  assert(!("Date" in completed), "contract is not a Date");
  passed.push("privacy-sensitive fields are absent from the contract");

  const hits = searchTopics("rotation");
  assert(
    hits.some((item) => item.id === "geography/earths-rotation"),
    "search still matches Earth's Rotation",
  );
  passed.push("search remains unchanged");

  const sample: AnalyticsEvent = completed;
  assert(typeof sample.occurredAt === "string", "occurredAt is a string primitive");
  passed.push("analytics contract remains collection-free");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-events.ts");

if (executedFromCli) {
  const passed = runAnalyticsEventVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ANALYTICS_EVENT_VERIFICATION: PASS");
}
