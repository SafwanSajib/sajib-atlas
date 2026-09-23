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
} from "@/lib/content/pilot/index";

const topicId = "topic/geography/atmosphere";
const subjectId = "subject/geography";
const version = 1;

const sources: readonly PilotSource[] = [
  {
    id: "source/geography-atmosphere/noaa-layers",
    type: "government",
    title: "The Layers of the Atmosphere",
    publisherOrOrganization: "National Oceanic and Atmospheric Administration",
    reference: "https://www.noaa.gov/jetstream/layers-of-atmosphere",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-atmosphere/met-office-atmosphere",
    type: "government",
    title: "Atmosphere and Weather",
    publisherOrOrganization: "UK Met Office",
    reference: "https://weather.metoffice.gov.uk/learn-about/weather/atmosphere",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-atmosphere/wmo-science",
    type: "international-organization",
    title: "WMO Activities",
    publisherOrOrganization: "World Meteorological Organization",
    reference: "https://wmo.int/activities",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-atmosphere/ucar-composition",
    type: "university",
    title: "The Composition of Earth's Atmosphere",
    publisherOrOrganization: "University Corporation for Atmospheric Research",
    reference: "https://scied.ucar.edu/learning-zone/atmosphere/composition-atmosphere",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-atmosphere/noaa-pressure",
    type: "government",
    title: "JetStream: Air Pressure",
    publisherOrOrganization: "National Oceanic and Atmospheric Administration",
    reference: "https://www.noaa.gov/jetstream/atmosphere/air-pressure",
    language: "en",
    accessedDate: "2026-09-03",
  },
];

const sourceReferences: readonly PilotSourceReference[] = [
  { id: "ref/geography-atmosphere/noaa-layers", sourceId: sources[0].id, supportType: "direct", citation: "NOAA, The Layers of the Atmosphere", locator: "Atmospheric layer overview" },
  { id: "ref/geography-atmosphere/met-office-atmosphere", sourceId: sources[1].id, supportType: "direct", citation: "UK Met Office, Atmosphere and Weather", locator: "Atmospheric layers and weather" },
  { id: "ref/geography-atmosphere/wmo-science", sourceId: sources[2].id, supportType: "contextual", citation: "World Meteorological Organization, Activities", locator: "Weather, climate, and atmospheric science services" },
  { id: "ref/geography-atmosphere/ucar-composition", sourceId: sources[3].id, supportType: "direct", citation: "UCAR Center for Science Education, The Composition of Earth's Atmosphere", locator: "Composition overview" },
  { id: "ref/geography-atmosphere/noaa-pressure", sourceId: sources[4].id, supportType: "direct", citation: "NOAA JetStream, Air Pressure", locator: "Pressure and altitude" },
];

const claims: readonly PilotClaim[] = [
  {
    id: "claim/geography-atmosphere/meaning",
    statement: "The atmosphere is the envelope of gases surrounding Earth and it supports life, weather, and the exchange of energy between Earth and space.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-atmosphere/composition",
    statement: "Dry air near Earth's surface is composed mainly of nitrogen and oxygen, with smaller amounts of argon, carbon dioxide, and other gases; water vapour varies by place and time.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[1].id, sourceReferences[3].id],
  },
  {
    id: "claim/geography-atmosphere/variable-gases",
    statement: "Water vapour and some trace gases vary more across location and time than the major, relatively stable components of dry air.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[1].id, sourceReferences[3].id],
  },
  {
    id: "claim/geography-atmosphere/layers",
    statement: "The atmosphere is commonly divided into the troposphere, stratosphere, mesosphere, thermosphere, and exosphere by changes in physical properties such as temperature.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-atmosphere/troposphere",
    statement: "Most weather occurs in the troposphere, the lowest major atmospheric layer, where temperature generally decreases with increasing altitude.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-atmosphere/stratosphere",
    statement: "The stratosphere lies above the troposphere and its temperature generally increases with altitude because ozone absorbs ultraviolet radiation.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-atmosphere/pressure",
    statement: "Atmospheric pressure is the force per unit area exerted by the weight of air, and it generally decreases with altitude because less air lies above.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[4].id],
  },
  {
    id: "claim/geography-atmosphere/circulation",
    statement: "Unequal heating of Earth's surface creates temperature and pressure differences that help drive atmospheric movement and circulation.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[2].id, sourceReferences[4].id],
  },
];

const concepts: readonly PilotConcept[] = [
  { id: "concept/geography-atmosphere/meaning", title: "Meaning and significance of the atmosphere", aliases: ["air envelope", "atmospheric environment"], knowledgeUnitIds: ["unit/geography-atmosphere/meaning"] },
  { id: "concept/geography-atmosphere/composition", title: "Atmospheric composition", aliases: ["nitrogen", "oxygen", "trace gases", "water vapour"], knowledgeUnitIds: ["unit/geography-atmosphere/composition", "unit/geography-atmosphere/variable-gases"] },
  { id: "concept/geography-atmosphere/layers", title: "Vertical structure and layers", aliases: ["troposphere", "stratosphere", "mesosphere", "thermosphere", "exosphere"], knowledgeUnitIds: ["unit/geography-atmosphere/layers", "unit/geography-atmosphere/troposphere-stratosphere"] },
  { id: "concept/geography-atmosphere/temperature", title: "Temperature variation and atmospheric processes", aliases: ["lapse rate", "ozone absorption", "weather"], knowledgeUnitIds: ["unit/geography-atmosphere/troposphere-stratosphere"] },
  { id: "concept/geography-atmosphere/pressure-circulation", title: "Atmospheric pressure and circulation basics", aliases: ["air pressure", "pressure gradient", "atmospheric circulation"], knowledgeUnitIds: ["unit/geography-atmosphere/pressure", "unit/geography-atmosphere/circulation"] },
];

const objectives: readonly PilotObjective[] = [
  { id: "objective/geography-atmosphere/explain-meaning", verb: "explain", statement: "Explain what the atmosphere is and why it matters for life, weather, and Earth's energy system.", level: "foundational" },
  { id: "objective/geography-atmosphere/describe-composition", verb: "explain", statement: "Describe the major and variable components of the atmosphere without treating composition values as immutable constants.", level: "foundational" },
  { id: "objective/geography-atmosphere/classify-layers", verb: "distinguish", statement: "Distinguish the principal atmospheric layers by their order and characteristic temperature patterns.", level: "foundational" },
  { id: "objective/geography-atmosphere/interpret-temperature", verb: "analyze", statement: "Analyze how altitude and radiation absorption relate to temperature variation in the troposphere and stratosphere.", level: "intermediate" },
  { id: "objective/geography-atmosphere/apply-pressure", verb: "apply", statement: "Apply the relationship between air-column weight, altitude, pressure differences, and basic atmospheric circulation.", level: "intermediate" },
];

const block = (
  id: string,
  type: PilotContentBlock["type"],
  order: number,
  payload: PilotContentBlock["payload"],
  claimIds: readonly string[],
): PilotContentBlock => ({ id, type, order, payload, claimIds });

const unit = (
  id: string,
  title: string,
  conceptIds: readonly string[],
  objectiveIds: readonly string[],
  blocks: readonly PilotContentBlock[],
  claimIds: readonly string[],
  sourceReferenceIds: readonly string[],
): PilotKnowledgeUnit => ({
  id,
  title,
  summary: `A canonical explanation of ${title.toLowerCase()} within the Earth's atmosphere.`,
  conceptIds,
  objectiveIds,
  blocks,
  contentVersion: version,
  lifecycle: "published",
  claimIds,
  sourceReferenceIds,
  audience: "general learner",
  level: "foundational",
});

const knowledgeUnits: readonly PilotKnowledgeUnit[] = [
  unit("unit/geography-atmosphere/meaning", "Meaning and significance of the atmosphere", ["concept/geography-atmosphere/meaning"], ["objective/geography-atmosphere/explain-meaning"], [
    block("block/geography-atmosphere/meaning-definition", "definition", 1, { text: "The atmosphere is the gaseous envelope held around Earth by gravity." }, ["claim/geography-atmosphere/meaning"]),
    block("block/geography-atmosphere/meaning-significance", "explanation", 2, { text: "It supplies gases used by living systems, provides the setting for weather, and participates in Earth's energy exchange." }, ["claim/geography-atmosphere/meaning"]),
  ], ["claim/geography-atmosphere/meaning"], ["ref/geography-atmosphere/noaa-layers", "ref/geography-atmosphere/met-office-atmosphere"]),
  unit("unit/geography-atmosphere/composition", "Major composition of the atmosphere", ["concept/geography-atmosphere/composition"], ["objective/geography-atmosphere/describe-composition"], [
    block("block/geography-atmosphere/composition-definition", "definition", 1, { text: "Atmospheric composition describes the gases present in a specified air sample and scope." }, ["claim/geography-atmosphere/composition"]),
    block("block/geography-atmosphere/composition-comparison", "comparison", 2, { dimensions: ["major gases", "trace gases"], values: ["nitrogen and oxygen dominate dry air near the surface", "argon, carbon dioxide, and other gases occur in smaller proportions"] }, ["claim/geography-atmosphere/composition"]),
    block("block/geography-atmosphere/composition-misconception", "misconception", 3, { misconception: "Atmospheric composition is not identical at every place and moment.", correction: "Separate relatively stable major components from variable water vapour and other trace constituents." }, ["claim/geography-atmosphere/variable-gases"]),
  ], ["claim/geography-atmosphere/composition", "claim/geography-atmosphere/variable-gases"], ["ref/geography-atmosphere/met-office-atmosphere", "ref/geography-atmosphere/ucar-composition"]),
  unit("unit/geography-atmosphere/variable-gases", "Variable gases and atmospheric change", ["concept/geography-atmosphere/composition"], ["objective/geography-atmosphere/describe-composition"], [
    block("block/geography-atmosphere/variable-explanation", "explanation", 1, { text: "Water vapour changes with temperature, surface conditions, and weather, so composition statements need a defined sample and context." }, ["claim/geography-atmosphere/variable-gases"]),
    block("block/geography-atmosphere/variable-example", "example", 2, { examples: ["humid tropical air", "dry polar air"], boundary: "Examples illustrate variability; they are not universal composition measurements." }, ["claim/geography-atmosphere/variable-gases"]),
  ], ["claim/geography-atmosphere/variable-gases"], ["ref/geography-atmosphere/ucar-composition", "ref/geography-atmosphere/met-office-atmosphere"]),
  unit("unit/geography-atmosphere/layers", "Classification of atmospheric layers", ["concept/geography-atmosphere/layers"], ["objective/geography-atmosphere/classify-layers"], [
    block("block/geography-atmosphere/layers-classification", "explanation", 1, { categories: ["troposphere", "stratosphere", "mesosphere", "thermosphere", "exosphere"], rule: "Layers are ordered vertically and commonly distinguished by changes in temperature and other physical properties." }, ["claim/geography-atmosphere/layers"]),
    block("block/geography-atmosphere/layers-comparison", "comparison", 2, { dimensions: ["lower atmosphere", "upper atmosphere"], values: ["troposphere and stratosphere are the first two major layers above Earth's surface", "mesosphere, thermosphere, and exosphere extend progressively higher"] }, ["claim/geography-atmosphere/layers"]),
  ], ["claim/geography-atmosphere/layers"], ["ref/geography-atmosphere/noaa-layers", "ref/geography-atmosphere/met-office-atmosphere"]),
  unit("unit/geography-atmosphere/troposphere-stratosphere", "Temperature patterns in the troposphere and stratosphere", ["concept/geography-atmosphere/layers", "concept/geography-atmosphere/temperature"], ["objective/geography-atmosphere/classify-layers", "objective/geography-atmosphere/interpret-temperature"], [
    block("block/geography-atmosphere/troposphere-process", "mechanism-process", 1, { process: "The surface warms air from below; rising air expands in lower pressure and generally cools with altitude.", result: "Temperature generally decreases upward through the troposphere." }, ["claim/geography-atmosphere/troposphere"]),
    block("block/geography-atmosphere/stratosphere-cause-effect", "cause-effect", 2, { cause: "Ozone absorbs incoming ultraviolet radiation.", effect: "Temperature generally increases with altitude through the stratosphere." }, ["claim/geography-atmosphere/stratosphere"]),
    block("block/geography-atmosphere/layer-misconception", "misconception", 3, { misconception: "Temperature changes in the atmosphere do not follow one single direction at every height.", correction: "Use the layer-specific pattern: generally decreasing in the troposphere and increasing in the stratosphere." }, ["claim/geography-atmosphere/troposphere", "claim/geography-atmosphere/stratosphere"]),
  ], ["claim/geography-atmosphere/troposphere", "claim/geography-atmosphere/stratosphere"], ["ref/geography-atmosphere/noaa-layers", "ref/geography-atmosphere/met-office-atmosphere"]),
  unit("unit/geography-atmosphere/pressure", "Atmospheric pressure and altitude", ["concept/geography-atmosphere/pressure-circulation"], ["objective/geography-atmosphere/apply-pressure"], [
    block("block/geography-atmosphere/pressure-definition", "definition", 1, { text: "Atmospheric pressure is the force per unit area exerted by the air above a location." }, ["claim/geography-atmosphere/pressure"]),
    block("block/geography-atmosphere/pressure-rule", "explanation", 2, { rule: "Pressure generally decreases as altitude increases because the overlying air column becomes smaller." }, ["claim/geography-atmosphere/pressure"]),
    block("block/geography-atmosphere/pressure-misconception", "misconception", 3, { misconception: "Higher elevation does not mean greater atmospheric pressure.", correction: "At higher altitude, less air lies above the location, so pressure is generally lower." }, ["claim/geography-atmosphere/pressure"]),
  ], ["claim/geography-atmosphere/pressure"], ["ref/geography-atmosphere/noaa-pressure"]),
  unit("unit/geography-atmosphere/circulation", "Pressure differences and circulation basics", ["concept/geography-atmosphere/pressure-circulation"], ["objective/geography-atmosphere/apply-pressure"], [
    block("block/geography-atmosphere/circulation-cause-effect", "cause-effect", 1, { cause: "Unequal heating creates temperature and pressure differences.", effect: "Air moves and helps form atmospheric circulation." }, ["claim/geography-atmosphere/circulation"]),
    block("block/geography-atmosphere/circulation-boundary", "exception", 2, { text: "This unit introduces circulation as a pressure-and-heating relationship; it does not develop global circulation cells, Coriolis dynamics, or climate classification." }, ["claim/geography-atmosphere/circulation"]),
  ], ["claim/geography-atmosphere/circulation"], ["ref/geography-atmosphere/wmo-science", "ref/geography-atmosphere/noaa-pressure"]),
];

const topic: PilotTopic = {
  id: topicId,
  disciplineId: "discipline/geography",
  subjectId,
  title: "Atmosphere",
  summary: "A bounded foundation in atmospheric meaning, composition, vertical layers, temperature patterns, pressure, and circulation.",
  contentVersion: version,
  lifecycle: "published",
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  objectiveIds: objectives.map((item) => item.id),
  assessmentAlignmentIds: ["alignment/geography-atmosphere/foundations"],
  audience: "general learner",
  level: "foundational",
  provenanceStatus: "corroborated",
};

const assessmentAlignments: readonly PilotAssessmentAlignment[] = [{
  id: "alignment/geography-atmosphere/foundations",
  objectiveIds: objectives.map((item) => item.id),
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  assessmentSetId: "pilot/geography/atmosphere",
  contentVersion: version,
}];

export const geographyAtmosphereProductionPackage: PilotPackage = {
  disciplineId: "discipline/geography",
  subjectId,
  topic,
  concepts,
  objectives,
  knowledgeUnits,
  claims,
  sources,
  sourceReferences,
  assessmentAlignments,
};
