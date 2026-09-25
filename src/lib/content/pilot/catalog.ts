import type {
  PilotAssessmentAlignment,
  PilotClaim,
  PilotConcept,
  PilotContentBlock,
  PilotKnowledgeUnit,
  PilotObjective,
  PilotPackage,
  PilotSource,
  PilotSourceReference,
  PilotTopic,
} from "./types";

const source = (
  id: string,
  type: PilotSource["type"],
  title: string,
  publisherOrOrganization: string,
  reference: string,
  publicationDate?: string,
): PilotSource => ({
  id,
  type,
  title,
  publisherOrOrganization,
  reference,
  language: "en",
  ...(publicationDate ? { publicationDate } : {}),
  accessedDate: "2026-09-03",
});

const block = (
  id: string,
  type: PilotContentBlock["type"],
  order: number,
  payload: PilotContentBlock["payload"],
  claimIds?: readonly string[],
  interpretationStatus?: PilotContentBlock["interpretationStatus"],
): PilotContentBlock => ({
  id,
  type,
  order,
  payload,
  ...(claimIds ? { claimIds } : {}),
  ...(interpretationStatus ? { interpretationStatus } : {}),
});

const unit = (
  id: string,
  title: string,
  conceptIds: readonly string[],
  objectiveIds: readonly string[],
  blocks: readonly PilotContentBlock[],
  sourceReferenceIds: readonly string[],
  claimIds: readonly string[] = [],
  extension?: PilotKnowledgeUnit["extension"],
): PilotKnowledgeUnit => ({
  id,
  title,
  summary: `A reusable explanation of ${title.toLowerCase()}.`,
  conceptIds,
  objectiveIds,
  blocks,
  contentVersion: 1,
  lifecycle: "published",
  claimIds,
  sourceReferenceIds,
  audience: "general learner",
  level: "foundational",
  ...(extension ? { extension } : {}),
});

const geographySources: readonly PilotSource[] = [
  source("source/geography/usgs-water-cycle", "government", "The Water Cycle", "U.S. Geological Survey", "https://www.usgs.gov/special-topics/water-science-school/water-cycle"),
  source("source/geography/noaa-water-cycle", "government", "The Water Cycle", "National Oceanic and Atmospheric Administration", "https://www.noaa.gov/education/resource-collections/freshwater/water-cycle"),
  source("source/geography/unesco-water", "international-organization", "The United Nations World Water Development Report", "UNESCO", "https://www.unesco.org/reports/wwdr"),
];

const geographyReferences: readonly PilotSourceReference[] = [
  { id: "ref/geography/usgs-water-cycle", sourceId: geographySources[0].id, supportType: "direct", citation: "U.S. Geological Survey, The Water Cycle", locator: "Water cycle overview" },
  { id: "ref/geography/noaa-water-cycle", sourceId: geographySources[1].id, supportType: "direct", citation: "NOAA, The Water Cycle", locator: "Freshwater resource collection" },
  { id: "ref/geography/unesco-water", sourceId: geographySources[2].id, supportType: "contextual", citation: "UNESCO, World Water Development Report", locator: "Water resources context" },
];

const geographyClaims: readonly PilotClaim[] = [
  {
    id: "claim/geography-cycle",
    statement: "Water moves between the atmosphere, land, surface water, and groundwater through linked processes.",
    kind: "definition",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: ["ref/geography/usgs-water-cycle", "ref/geography/noaa-water-cycle"],
  },
];

const geographyConcepts: readonly PilotConcept[] = [
  { id: "concept/geography/evaporation", title: "Evaporation", aliases: ["vaporization"], knowledgeUnitIds: ["unit/geography/evaporation"] },
  { id: "concept/geography/condensation", title: "Condensation", aliases: ["cloud formation"], knowledgeUnitIds: ["unit/geography/condensation"] },
  { id: "concept/geography/precipitation", title: "Precipitation", aliases: ["rainfall"], knowledgeUnitIds: ["unit/geography/precipitation"] },
  { id: "concept/geography/runoff-infiltration", title: "Runoff and infiltration", aliases: ["surface flow", "percolation"], knowledgeUnitIds: ["unit/geography/runoff-infiltration"] },
];

const geographyObjectives: readonly PilotObjective[] = [
  { id: "objective/geography/explain-cycle", verb: "explain", statement: "Explain how water moves through the main parts of the water cycle.", level: "foundational" },
  { id: "objective/geography/distinguish-processes", verb: "distinguish", statement: "Distinguish evaporation, condensation, precipitation, runoff, and infiltration.", level: "foundational" },
];

const geographyUnits: readonly PilotKnowledgeUnit[] = [
  unit("unit/geography/evaporation", "Evaporation", ["concept/geography/evaporation"], ["objective/geography/distinguish-processes"], [block("block/geography/evaporation-definition", "definition", 1, { text: "Evaporation is the change of liquid water into water vapour at a surface." })], ["ref/geography/usgs-water-cycle"], ["claim/geography-cycle"], { namespace: "geography", spatialScope: "global" }),
  unit("unit/geography/condensation", "Condensation", ["concept/geography/condensation"], ["objective/geography/distinguish-processes"], [block("block/geography/condensation-explanation", "explanation", 1, { text: "Condensation forms when water vapour cools and changes into liquid droplets." })], ["ref/geography/noaa-water-cycle"], ["claim/geography-cycle"], { namespace: "geography", spatialScope: "global" }),
  unit("unit/geography/precipitation", "Precipitation", ["concept/geography/precipitation"], ["objective/geography/distinguish-processes"], [block("block/geography/precipitation-process", "mechanism-process", 1, { stages: ["droplets or ice crystals grow", "gravity overcomes uplift", "water reaches the surface"] }, ["claim/geography-cycle"])], ["ref/geography/usgs-water-cycle"], ["claim/geography-cycle"], { namespace: "geography", spatialScope: "global" }),
  unit("unit/geography/runoff-infiltration", "Runoff and infiltration", ["concept/geography/runoff-infiltration"], ["objective/geography/explain-cycle"], [block("block/geography/runoff-comparison", "comparison", 1, { dimensions: ["path", "storage", "surface condition"], values: ["runoff flows over land", "infiltration enters soil", "both return water to connected stores"] })], ["ref/geography/unesco-water"], ["claim/geography-cycle"], { namespace: "geography", spatialScope: "global" }),
];

const geographyAlignments: readonly PilotAssessmentAlignment[] = [
  { id: "alignment/geography/water-cycle", objectiveIds: geographyObjectives.map((item) => item.id), conceptIds: geographyConcepts.map((item) => item.id), knowledgeUnitIds: geographyUnits.map((item) => item.id), assessmentSetId: "pilot/geography/water-cycle", contentVersion: 1 },
];

const englishSources: readonly PilotSource[] = [
  source("source/english/cambridge-grammar", "reference-editorial", "Cambridge Dictionary Grammar", "Cambridge University Press & Assessment", "https://dictionary.cambridge.org/grammar/british-grammar/"),
  source("source/english/british-council", "reference-editorial", "English Grammar", "British Council", "https://learnenglish.britishcouncil.org/grammar"),
  source("source/english/chicago-manual", "textbook", "The Chicago Manual of Style", "University of Chicago Press", "https://www.chicagomanualofstyle.org/home.html"),
];

const englishReferences: readonly PilotSourceReference[] = [
  { id: "ref/english/cambridge-grammar", sourceId: englishSources[0].id, supportType: "direct", citation: "Cambridge Dictionary Grammar, subject-verb agreement" },
  { id: "ref/english/british-council", sourceId: englishSources[1].id, supportType: "direct", citation: "British Council LearnEnglish Grammar" },
  { id: "ref/english/chicago-manual", sourceId: englishSources[2].id, supportType: "contextual", citation: "The Chicago Manual of Style, agreement conventions" },
];

const englishConcepts: readonly PilotConcept[] = [
  { id: "concept/english/subject", title: "Subject", aliases: ["grammatical subject"], knowledgeUnitIds: ["unit/english/subject-verb-agreement"] },
  { id: "concept/english/verb-agreement", title: "Subject-verb agreement", aliases: ["concord"], knowledgeUnitIds: ["unit/english/subject-verb-agreement"] },
  { id: "concept/english/indefinite-pronouns", title: "Indefinite pronouns", aliases: ["each", "everyone"], knowledgeUnitIds: ["unit/english/indefinite-pronouns"] },
  { id: "concept/english/collective-nouns", title: "Collective nouns", aliases: ["committee", "team"], knowledgeUnitIds: ["unit/english/collective-nouns"] },
];

const englishObjectives: readonly PilotObjective[] = [
  { id: "objective/english/apply-agreement", verb: "apply", statement: "Apply subject-verb agreement in standard academic sentences.", level: "foundational" },
  { id: "objective/english/distinguish-conventions", verb: "distinguish", statement: "Distinguish singular agreement from register-dependent collective-noun conventions.", level: "intermediate" },
];

const englishUnits: readonly PilotKnowledgeUnit[] = [
  unit("unit/english/subject-verb-agreement", "Subject-verb agreement", ["concept/english/subject", "concept/english/verb-agreement"], ["objective/english/apply-agreement"], [block("block/english/agreement-rule", "formula-rule", 1, { expression: "singular subject -> singular verb", conditions: ["identify the grammatical subject before choosing the verb"] })], ["ref/english/cambridge-grammar"]),
  unit("unit/english/indefinite-pronouns", "Indefinite pronouns", ["concept/english/indefinite-pronouns"], ["objective/english/apply-agreement"], [block("block/english/indefinite-rule", "formula-rule", 1, { expression: "each/everyone -> singular verb", conditions: ["the pronoun is the subject"] }), block("block/english/indefinite-example", "example", 2, { examples: ["Everyone is ready.", "Each answer matters."] }, undefined, "illustrative")], ["ref/english/cambridge-grammar", "ref/english/british-council"]),
  unit("unit/english/collective-nouns", "Collective nouns and register", ["concept/english/collective-nouns"], ["objective/english/distinguish-conventions"], [block("block/english/collective-comparison", "comparison", 1, { dimensions: ["collective noun", "singular convention", "plural convention"], values: ["team", "the team is", "the team are in some British usage"] }, undefined, "interpretation")], ["ref/english/chicago-manual", "ref/english/cambridge-grammar"]),
  unit("unit/english/agreement-misconception", "Agreement misconception", ["concept/english/verb-agreement"], ["objective/english/apply-agreement"], [block("block/english/agreement-misconception", "misconception", 1, { misconception: "The nearest noun always controls the verb.", correction: "Agreement follows the grammatical subject, not simply the nearest noun." })], ["ref/english/british-council"]),
];

const englishAlignments: readonly PilotAssessmentAlignment[] = [
  { id: "alignment/english/agreement", objectiveIds: englishObjectives.map((item) => item.id), conceptIds: englishConcepts.map((item) => item.id), knowledgeUnitIds: englishUnits.map((item) => item.id), assessmentSetId: "pilot/english/subject-verb-agreement", contentVersion: 1 },
];

const historySources: readonly PilotSource[] = [
  source("source/history/un-declaration", "international-organization", "Universal Declaration of Human Rights", "United Nations", "https://www.un.org/en/about-us/universal-declaration-of-human-rights", "1948-12-10"),
  source("source/history/un-history", "international-organization", "History of the Universal Declaration of Human Rights", "United Nations", "https://www.un.org/en/about-us/udhr/history-of-the-declaration", "1948-12-10"),
  source("source/history/ohchr-udhr", "international-organization", "Universal Declaration of Human Rights", "Office of the United Nations High Commissioner for Human Rights", "https://www.ohchr.org/en/human-rights/universal-declaration/translations/english", "1948-12-10"),
];

const historyReferences: readonly PilotSourceReference[] = [
  { id: "ref/history/un-declaration", sourceId: historySources[0].id, supportType: "direct", citation: "United Nations, Universal Declaration of Human Rights", locator: "Adoption date and text" },
  { id: "ref/history/un-history", sourceId: historySources[1].id, supportType: "direct", citation: "United Nations, History of the Declaration" },
  { id: "ref/history/ohchr-udhr", sourceId: historySources[2].id, supportType: "direct", citation: "OHCHR, Universal Declaration of Human Rights" },
];

const historyClaims: readonly PilotClaim[] = [
  { id: "claim/history/adoption", statement: "The Universal Declaration of Human Rights was adopted by the United Nations General Assembly on 10 December 1948.", kind: "historical", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: ["ref/history/un-declaration", "ref/history/un-history"], validity: { effectiveFrom: "1948-12-10" } },
  { id: "claim/history/significance", statement: "The Declaration is commonly interpreted as a foundational international statement of human rights after the Second World War.", kind: "interpretive", interpretationStatus: "interpretation", supportStatus: "synthesized", sourceReferenceIds: ["ref/history/un-history", "ref/history/ohchr-udhr"], conflictGroupId: "conflict/history/significance"},
];

const historyConcepts: readonly PilotConcept[] = [
  { id: "concept/history/postwar-context", title: "Post-war context", aliases: ["1940s context"], knowledgeUnitIds: ["unit/history/postwar-context"] },
  { id: "concept/history/drafting", title: "Drafting and adoption", aliases: ["General Assembly adoption"], knowledgeUnitIds: ["unit/history/drafting"] },
  { id: "concept/history/rights-principle", title: "Universal rights principle", aliases: ["human rights"], knowledgeUnitIds: ["unit/history/rights-principle"] },
  { id: "concept/history/interpretation", title: "Historical interpretation", aliases: ["significance"], knowledgeUnitIds: ["unit/history/interpretation"] },
];

const historyObjectives: readonly PilotObjective[] = [
  { id: "objective/history/analyze-event", verb: "analyze", statement: "Analyze the chronology and context of the Declaration's adoption.", level: "intermediate" },
  { id: "objective/history/distinguish-fact-interpretation", verb: "distinguish", statement: "Distinguish the documented adoption fact from later interpretations of significance.", level: "intermediate" },
];

const historyUnits: readonly PilotKnowledgeUnit[] = [
  unit("unit/history/postwar-context", "Post-war context", ["concept/history/postwar-context"], ["objective/history/analyze-event"], [block("block/history/context", "cause-effect", 1, { causes: ["world war and documented rights abuses"], effects: ["international discussion of a shared rights statement"] }, ["claim/history/significance"], "interpretation")], ["ref/history/un-history"], ["claim/history/significance"], { namespace: "history", actors: ["international-community"] }),
  unit("unit/history/drafting", "Drafting and adoption", ["concept/history/drafting"], ["objective/history/analyze-event"], [block("block/history/chronology", "chronology", 1, { events: ["drafting", "international consultation", "General Assembly adoption on 10 December 1948"] }, ["claim/history/adoption"], "fact")], ["ref/history/un-declaration", "ref/history/un-history"], ["claim/history/adoption"], { namespace: "history", actors: ["United Nations General Assembly"] }),
  unit("unit/history/rights-principle", "Universal rights principle", ["concept/history/rights-principle"], ["objective/history/analyze-event"], [block("block/history/principle", "definition", 1, { text: "A universal-rights principle states that rights belong to people without restricting them to one nationality." }, ["claim/history/adoption"])], ["ref/history/un-declaration"], ["claim/history/adoption"]),
  unit("unit/history/interpretation", "Interpretation and significance", ["concept/history/interpretation"], ["objective/history/distinguish-fact-interpretation"], [block("block/history/interpretation", "explanation", 1, { text: "Later historians and institutions may interpret the Declaration's significance differently; this unit labels that analysis rather than presenting it as the adoption fact." }, ["claim/history/significance"], "interpretation")], ["ref/history/un-history", "ref/history/ohchr-udhr"], ["claim/history/significance"], { namespace: "history", interpretationScope: "postwar-international-order" }),
];

const historyAlignments: readonly PilotAssessmentAlignment[] = [
  { id: "alignment/history/udhr", objectiveIds: historyObjectives.map((item) => item.id), conceptIds: historyConcepts.map((item) => item.id), knowledgeUnitIds: historyUnits.map((item) => item.id), assessmentSetId: "pilot/history/udhr-adoption", contentVersion: 1 },
];

const topic = (
  id: string,
  disciplineId: string,
  subjectId: string,
  title: string,
  summary: string,
  concepts: readonly PilotConcept[],
  units: readonly PilotKnowledgeUnit[],
  objectives: readonly PilotObjective[],
  alignments: readonly PilotAssessmentAlignment[],
  provenanceStatus: PilotTopic["provenanceStatus"],
): PilotTopic => ({
  id,
  disciplineId,
  subjectId,
  title,
  summary,
  contentVersion: 1,
  lifecycle: "published",
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: units.map((item) => item.id),
  objectiveIds: objectives.map((item) => item.id),
  assessmentAlignmentIds: alignments.map((item) => item.id),
  audience: "general learner",
  level: "foundational",
  provenanceStatus,
});

export const pilotPackages: readonly PilotPackage[] = [
  {
    disciplineId: "discipline/geography",
    subjectId: "subject/geography",
    topic: topic("topic/geography/water-cycle", "discipline/geography", "subject/geography", "The Water Cycle", "How water moves through connected stores and processes.", geographyConcepts, geographyUnits, geographyObjectives, geographyAlignments, "corroborated"),
    concepts: geographyConcepts,
    objectives: geographyObjectives,
    knowledgeUnits: geographyUnits,
    claims: geographyClaims,
    sources: geographySources,
    sourceReferences: geographyReferences,
    assessmentAlignments: geographyAlignments,
  },
  {
    disciplineId: "discipline/language",
    subjectId: "subject/english",
    topic: topic("topic/english/subject-verb-agreement", "discipline/language", "subject/english", "Subject-Verb Agreement", "A grammar rule, its common cases, and register-sensitive variation.", englishConcepts, englishUnits, englishObjectives, englishAlignments, "corroborated"),
    concepts: englishConcepts,
    objectives: englishObjectives,
    knowledgeUnits: englishUnits,
    claims: [],
    sources: englishSources,
    sourceReferences: englishReferences,
    assessmentAlignments: englishAlignments,
  },
  {
    disciplineId: "discipline/history", subjectId: "subject/history",
    topic: topic("topic/history/udhr-adoption", "discipline/history", "subject/history", "Adoption of the Universal Declaration of Human Rights", "A bounded historical event with chronology, evidence, and labeled interpretation.", historyConcepts, historyUnits, historyObjectives, historyAlignments, "corroborated"),
    concepts: historyConcepts,
    objectives: historyObjectives,
    knowledgeUnits: historyUnits,
    claims: historyClaims,
    sources: historySources,
    sourceReferences: historyReferences,
    assessmentAlignments: historyAlignments,
  },
];

export const pilotPackagesByTopicId: Readonly<Record<string, PilotPackage>> = Object.fromEntries(
  pilotPackages.map((item) => [item.topic.id, item]),
);
