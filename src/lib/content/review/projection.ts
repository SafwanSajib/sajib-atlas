import { isProductionAiEligible, isProductionDeliveryEligible } from "@/lib/content/production/index";
import { projectPilotToAiGrounding, projectPilotToLearnerReferences, projectPilotToSearch } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import type { ProductionRecord } from "@/lib/content/production/index";
import type { ReviewProjection, ReviewQualityDisplayStatus } from "./types";

function isValidSnapshot(record: ProductionRecord, pkg: PilotPackage): boolean {
  const snapshot = record.qualitySnapshot;
  if (!snapshot || snapshot.contentId !== pkg.topic.id || snapshot.contentVersion !== pkg.topic.contentVersion) return false;
  if (snapshot.report.contentId !== snapshot.contentId || snapshot.report.contentVersion !== snapshot.contentVersion) return false;
  if (!snapshot.evaluatorVersion.trim() || Number.isNaN(Date.parse(snapshot.evaluatedAt))) return false;
  return true;
}

function qualityStatus(record: ProductionRecord, pkg: PilotPackage): {
  evaluationStatus: "evaluated" | "not-evaluated";
  status: ReviewQualityDisplayStatus;
  snapshot?: ProductionRecord["qualitySnapshot"];
} {
  if (!isValidSnapshot(record, pkg)) return { evaluationStatus: "not-evaluated", status: "NOT EVALUATED" };
  const snapshot = record.qualitySnapshot;
  if (!snapshot) return { evaluationStatus: "not-evaluated", status: "NOT EVALUATED" };
  return {
    evaluationStatus: "evaluated",
    status: snapshot.report.overall === "pass" ? "PASS" : snapshot.report.overall === "warning" ? "WARNING" : "FAIL",
    snapshot,
  };
}

export function buildReviewProjection(record: ProductionRecord): ReviewProjection {
  const pkg = record.content;
  if (record.content.topic.id !== pkg.topic.id || record.content.topic.contentVersion < 1) {
    throw new Error("Content review: invalid canonical identity");
  }
  const units = pkg.knowledgeUnits
    .map((unit) => ({
      id: unit.id,
      title: unit.title,
      ...(unit.summary !== undefined ? { summary: unit.summary } : {}),
      conceptIds: [...unit.conceptIds],
      objectiveIds: [...unit.objectiveIds],
      audience: unit.audience,
      level: unit.level,
      ...(unit.scope ? { scope: unit.scope } : {}),
      ...(unit.validity ? { validity: unit.validity } : {}),
      ...(unit.extension ? { extension: unit.extension } : {}),
      blocks: [...unit.blocks]
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
        .map((block) => ({
          id: block.id,
          type: block.type,
          order: block.order,
          ...(block.interpretationStatus ? { interpretationStatus: block.interpretationStatus } : {}),
          payload: block.payload,
        })),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const quality = qualityStatus(record, pkg);
  const search = projectPilotToSearch(pkg);
  const ai = projectPilotToAiGrounding(pkg);
  return {
    identity: {
      disciplineId: pkg.disciplineId,
      subjectId: pkg.subjectId,
      ...(pkg.topic.categoryId ? { categoryId: pkg.topic.categoryId } : {}),
      topicId: pkg.topic.id,
      title: pkg.topic.title,
      contentVersion: pkg.topic.contentVersion,
    },
    content: {
      topic: {
        id: pkg.topic.id,
        title: pkg.topic.title,
        summary: pkg.topic.summary,
        audience: pkg.topic.audience,
        level: pkg.topic.level,
        provenanceStatus: pkg.topic.provenanceStatus,
      },
      concepts: [...pkg.concepts].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, title, aliases }) => ({ id, title, aliases: [...aliases] })),
      objectives: [...pkg.objectives].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, verb, statement, level }) => ({ id, verb, statement, level })),
      knowledgeUnits: units,
    },
    evidence: {
      claims: [...pkg.claims].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, statement, kind, interpretationStatus, supportStatus, scope, validity, conflictGroupId }) => ({
        id, statement, kind, interpretationStatus, supportStatus,
        ...(scope ? { scope } : {}),
        ...(validity ? { validity } : {}),
        ...(conflictGroupId ? { conflictGroupId } : {}),
      })),
      sources: [...pkg.sources].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, type, title, publisherOrOrganization, reference, language, publicationDate, accessedDate, scope }) => ({
        id, type, title, publisherOrOrganization, reference, language,
        ...(publicationDate ? { publicationDate } : {}),
        ...(accessedDate ? { accessedDate } : {}),
        ...(scope ? { scope } : {}),
      })),
      sourceReferences: [...pkg.sourceReferences].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, sourceId, supportType, citation, locator, quote }) => ({
        id, sourceId, supportType, citation,
        ...(locator ? { locator } : {}),
        ...(quote ? { quote } : {}),
      })),
    },
    lifecycle: {
      workflowState: record.workflowState,
      contentLifecycle: pkg.topic.lifecycle,
      contentVersion: pkg.topic.contentVersion,
      ...(record.publishedAt ? { publishedAt: record.publishedAt } : {}),
      ...(record.supersedesVersion !== undefined ? { supersedesVersion: record.supersedesVersion } : {}),
      previewable: true,
      deliverable: isProductionDeliveryEligible(record),
      aiGroundable: isProductionAiEligible(record),
      publishable: record.workflowState === "approved" && quality.status !== "FAIL" && quality.evaluationStatus === "evaluated",
    },
    quality,
    integrations: {
      assessment: [...pkg.assessmentAlignments].sort((a, b) => a.id.localeCompare(b.id)).map((alignment) => ({ ...alignment })),
      search: { eligible: quality.status !== "FAIL" && search.length > 0, projectionIds: search.map((item) => item.id) },
      ai: { eligible: isProductionAiEligible(record), groundingSourceIds: ai.map((item) => item.sourceId) },
      learner: { valid: projectPilotToLearnerReferences(pkg).length > 0, referenceIds: [...projectPilotToLearnerReferences(pkg)] },
    },
  };
}
