import { contentManifest } from "@/lib/content/manifest";
import { assessmentSetId, isAssessmentKind, parseAssessmentSetId } from "./identity";
import type { AssessmentSet } from "./types";
import { assertAssessmentSetReferences, validateAssessmentSetStructure } from "./validate";

/**
 * Assessment set registry (Phase 1D).
 *
 * Identity only. MCQ arrays remain in geography-data.ts.
 * This module does not import React, learner state, or geography-data.ts.
 */

export type { AssessmentSet };

function assessmentSetFromTopicId(topicId: string, kind: AssessmentSet["kind"]): AssessmentSet {
  return {
    id: assessmentSetId(topicId, kind),
    topicId,
    kind,
    title: "MCQ Practice",
    payload: {
      module: "geography-data",
      field: "sections.mcqPractice",
    },
  };
}

function setsFromManifest(): AssessmentSet[] {
  const sets: AssessmentSet[] = [];
  for (const topic of contentManifest) {
    for (const setId of topic.assessmentSetIds) {
      const parsed = parseAssessmentSetId(setId);
      if (!parsed || !isAssessmentKind(parsed.kind)) {
        throw new Error(`Assessment set catalog: malformed assessmentSetId ${setId}`);
      }
      sets.push(assessmentSetFromTopicId(parsed.topicId, parsed.kind));
    }
  }
  return sets;
}

export const assessmentSets: readonly AssessmentSet[] = validateAssessmentSetStructure(
  setsFromManifest(),
);

assertAssessmentSetReferences(assessmentSets, contentManifest);

export const assessmentSetsById: Readonly<Record<string, AssessmentSet>> = Object.fromEntries(
  assessmentSets.map((item) => [item.id, item]),
);

const groupedByTopicId: Record<string, AssessmentSet[]> = {};
for (const item of assessmentSets) {
  const group = groupedByTopicId[item.topicId];
  if (group) group.push(item);
  else groupedByTopicId[item.topicId] = [item];
}

export const assessmentSetsByTopicId: Readonly<Record<string, readonly AssessmentSet[]>> =
  groupedByTopicId;

export function getAssessmentSet(id: string): AssessmentSet | undefined {
  return assessmentSetsById[id];
}

export function getAssessmentSetsByTopicId(topicId: string): readonly AssessmentSet[] {
  return assessmentSetsByTopicId[topicId] ?? [];
}
