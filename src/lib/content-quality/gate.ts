import { projectPilotToAiGrounding, projectPilotToSearch } from "@/lib/content/pilot/index";
import type { PilotPackage } from "@/lib/content/pilot/index";
import { validateAi, validateAssessment, validateBlocks, validateClaimsAndProvenance, validateIdentity, validateKnowledgeUnits, validateLearner, validateObjectives, validateOptionalEnrichment, validateSearch, validateStructureWithPilotRules, validateTimeScope, validateUniversalCore, validateVersionLifecycle } from "./validators";
import type { ContentQualityReport, QualityDimension, QualityIssue, QualityStatus } from "./types";

type Validator = { dimension: QualityDimension; run: (pkg: PilotPackage) => QualityIssue[] };
const validators: readonly Validator[] = [
  { dimension: "identity-structure", run: validateIdentity },
  { dimension: "identity-structure", run: validateStructureWithPilotRules },
  { dimension: "knowledge-unit", run: validateKnowledgeUnits },
  { dimension: "content-block", run: validateBlocks },
  { dimension: "objective", run: validateObjectives },
  { dimension: "claim", run: validateClaimsAndProvenance },
  { dimension: "provenance", run: validateClaimsAndProvenance },
  { dimension: "classification", run: validateClaimsAndProvenance },
  { dimension: "time-scope", run: validateTimeScope },
  { dimension: "version-lifecycle", run: validateVersionLifecycle },
  { dimension: "assessment-alignment", run: validateAssessment },
  { dimension: "search-eligibility", run: validateSearch },
  { dimension: "ai-grounding", run: validateAi },
  { dimension: "learner-compatibility", run: validateLearner },
  { dimension: "universal-core", run: validateUniversalCore },
  { dimension: "publication-readiness", run: validateOptionalEnrichment },
];

function statusFor(issues: readonly QualityIssue[]): QualityStatus {
  if (issues.some((item) => item.severity === "blocker")) return "blocked";
  if (issues.length > 0) return "warning";
  return "pass";
}

export function validateContentQuality(pkg: PilotPackage): ContentQualityReport {
  const dimensions = validators.map(({ dimension, run }) => {
    const issues = run(pkg);
    return { dimension, issues, status: statusFor(issues) };
  });
  const allIssues = dimensions.flatMap((item) => item.issues);
  const overall = statusFor(allIssues);
  const readiness = dimensions.find((item) => item.dimension === "publication-readiness");
  if (overall === "blocked" && readiness) {
    readiness.issues = [...readiness.issues, { code: "publication-readiness.blocked", severity: "blocker", path: "package", message: "One or more mandatory machine-verifiable dimensions are blocked." }];
    readiness.status = "blocked";
  }
  return {
    contentId: pkg.topic.id,
    contentVersion: pkg.topic.contentVersion,
    overall,
    dimensions,
  };
}

export function isAiGroundingEligible(report: ContentQualityReport, pkg: PilotPackage): boolean {
  return report.overall !== "blocked" && pkg.topic.lifecycle === "published" && projectPilotToAiGrounding(pkg).length > 0;
}

export function isSearchEligible(report: ContentQualityReport, pkg: PilotPackage): boolean {
  return report.overall !== "blocked" && projectPilotToSearch(pkg).length > 0;
}
