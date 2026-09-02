import { isAssessmentKind, parseAssessmentSetId } from "./identity";
import type { AssessmentSet } from "./types";

function fail(message: string): never {
  throw new Error(`Assessment set catalog: ${message}`);
}

const ALLOWED_PAYLOAD_FIELDS = ["sections.mcqPractice"] as const;

export function validateAssessmentSetStructure(
  sets: readonly {
    id: string;
    topicId: string;
    kind: string;
    title: string;
    payload: { module: string; field: string };
  }[],
): AssessmentSet[] {
  const ids = new Set<string>();
  const topicKind = new Set<string>();
  const valid: AssessmentSet[] = [];

  for (const set of sets) {
    if (!set.id?.trim()) fail("empty assessment set id");
    if (!set.topicId?.trim()) fail(`empty topicId for ${set.id}`);
    if (!set.title?.trim()) fail(`empty title for ${set.id}`);
    if (!isAssessmentKind(set.kind)) fail(`invalid assessment kind ${set.kind} on ${set.id}`);

    const parsed = parseAssessmentSetId(set.id);
    if (!parsed) fail(`malformed assessment set id ${set.id}`);
    if (parsed.topicId !== set.topicId) {
      fail(`assessment set ${set.id} topicId does not match id`);
    }
    if (parsed.kind !== set.kind) {
      fail(`assessment set ${set.id} kind does not match id`);
    }

    const expectedId = `${set.topicId}/${set.kind}`;
    if (set.id !== expectedId) fail(`assessment set id must equal topicId/kind: ${set.id}`);

    const pair = `${set.topicId}::${set.kind}`;
    if (topicKind.has(pair)) fail(`duplicate ${set.kind} on topic ${set.topicId}`);
    topicKind.add(pair);

    if (ids.has(set.id)) fail(`duplicate assessment set id ${set.id}`);
    ids.add(set.id);

    if (!set.payload?.module?.trim()) fail(`empty payload module on ${set.id}`);
    if (set.payload.module !== "geography-data" && set.payload.module !== "knowledge-data") {
      fail(`invalid payload module ${set.payload.module} on ${set.id}`);
    }
    let allowedField = false;
    for (const field of ALLOWED_PAYLOAD_FIELDS) {
      if (field === set.payload.field) allowedField = true;
    }
    if (!allowedField) fail(`invalid payload field ${set.payload.field} on ${set.id}`);
    if (set.kind === "mcq-practice" && set.payload.field !== "sections.mcqPractice") {
      fail(`mcq-practice payload field must be sections.mcqPractice on ${set.id}`);
    }
    if (set.kind === "mcq-practice" && set.payload.module !== "geography-data") {
      fail(`mcq-practice payload module must be geography-data on ${set.id}`);
    }

    valid.push({
      id: set.id,
      topicId: set.topicId,
      kind: set.kind,
      title: set.title,
      payload: {
        module: set.payload.module === "knowledge-data" ? "knowledge-data" : "geography-data",
        field: "sections.mcqPractice",
      },
    });
  }

  return valid;
}

type TopicAssessmentRefs = {
  id: string;
  assessmentSetIds?: readonly string[];
};

export function assertAssessmentSetReferences(
  sets: readonly AssessmentSet[],
  topics: readonly TopicAssessmentRefs[],
): void {
  const topicIds = new Set(topics.map((topic) => topic.id));
  const setsById = new Map(sets.map((item) => [item.id, item]));
  const setIdsByTopic = new Map<string, string[]>();

  for (const set of sets) {
    if (!topicIds.has(set.topicId)) {
      fail(`assessment set ${set.id} references unknown topic ${set.topicId}`);
    }
    const group = setIdsByTopic.get(set.topicId);
    if (group) group.push(set.id);
    else setIdsByTopic.set(set.topicId, [set.id]);
  }

  for (const topic of topics) {
    const listed = topic.assessmentSetIds ?? [];
    const seen = new Set<string>();
    for (const setId of listed) {
      if (!setId?.trim()) fail(`empty assessmentSetId on topic ${topic.id}`);
      if (seen.has(setId)) fail(`duplicate assessmentSetId ${setId} on topic ${topic.id}`);
      seen.add(setId);
      const set = setsById.get(setId);
      if (!set) fail(`topic ${topic.id} references missing assessment set ${setId}`);
      if (set.topicId !== topic.id) {
        fail(`topic ${topic.id} lists assessment set ${setId} owned by ${set.topicId}`);
      }
    }

    const catalogIds = setIdsByTopic.get(topic.id) ?? [];
    if (listed.length !== catalogIds.length) {
      fail(
        `topic ${topic.id} assessmentSetIds length ${listed.length} does not match catalog ${catalogIds.length}`,
      );
    }
    for (const setId of catalogIds) {
      if (!seen.has(setId)) {
        fail(`topic ${topic.id} is missing catalog assessment set ${setId}`);
      }
    }
  }
}
