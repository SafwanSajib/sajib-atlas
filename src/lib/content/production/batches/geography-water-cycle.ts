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

const topicId = "topic/geography/water-cycle";
const subjectId = "subject/geography";
const version = 1;

const sources: readonly PilotSource[] = [
  {
    id: "source/geography-production/usgs-cycle",
    type: "government",
    title: "The Water Cycle",
    publisherOrOrganization: "U.S. Geological Survey",
    reference: "https://www.usgs.gov/special-topics/water-science-school/water-cycle",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-production/noaa-cycle",
    type: "government",
    title: "The Water Cycle",
    publisherOrOrganization: "National Oceanic and Atmospheric Administration",
    reference: "https://www.noaa.gov/education/resource-collections/freshwater/water-cycle",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-production/usgs-groundwater",
    type: "government",
    title: "Groundwater Flow",
    publisherOrOrganization: "U.S. Geological Survey",
    reference: "https://www.usgs.gov/special-topics/water-science-school/science/groundwater-storage-and-water-cycle",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-production/ipcc-water",
    type: "international-organization",
    title: "Climate Change 2022: Impacts, Adaptation and Vulnerability",
    publisherOrOrganization: "Intergovernmental Panel on Climate Change",
    reference: "https://www.ipcc.ch/report/ar6/wg2/",
    language: "en",
    accessedDate: "2026-09-03",
  },
];

const sourceReferences: readonly PilotSourceReference[] = [
  { id: "ref/geography-production/usgs-cycle", sourceId: sources[0].id, supportType: "direct", citation: "U.S. Geological Survey, The Water Cycle", locator: "Water cycle overview" },
  { id: "ref/geography-production/noaa-cycle", sourceId: sources[1].id, supportType: "direct", citation: "NOAA, The Water Cycle", locator: "Freshwater resource collection" },
  { id: "ref/geography-production/usgs-groundwater", sourceId: sources[2].id, supportType: "direct", citation: "U.S. Geological Survey, Groundwater Flow", locator: "Groundwater movement" },
  { id: "ref/geography-production/ipcc-water", sourceId: sources[3].id, supportType: "contextual", citation: "IPCC, Climate Change 2022: Impacts, Adaptation and Vulnerability", locator: "Water-cycle impacts and adaptation" },
];

const claims: readonly PilotClaim[] = [
  {
    id: "claim/geography-production/cycle-system",
    statement: "The hydrologic cycle describes continuous water movement among the atmosphere, land, surface water, and groundwater.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-production/evaporation",
    statement: "Evaporation changes liquid water at a surface into water vapour, transferring water to the atmosphere.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id],
  },
  {
    id: "claim/geography-production/evapotranspiration",
    statement: "Evapotranspiration combines evaporation from surfaces with transpiration, the release of water vapour by plants.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-production/condensation",
    statement: "Condensation changes water vapour into liquid water or ice when air reaches conditions that allow water to form droplets or crystals.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-production/precipitation",
    statement: "Precipitation returns water from clouds to Earth’s surface in forms such as rain, snow, sleet, or hail.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-production/infiltration-recharge",
    statement: "Infiltration is water entering soil, while percolation is its downward movement through soil and rock; together these processes can contribute to groundwater recharge.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[2].id],
  },
  {
    id: "claim/geography-production/runoff",
    statement: "Runoff is water flowing across the land surface when precipitation or snowmelt exceeds infiltration or follows an impermeable path.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-production/human-influence",
    statement: "Land-use change and climate change can alter the timing, amount, or pathways of water moving through parts of the hydrologic cycle.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[3].id],
  },
];

const concepts: readonly PilotConcept[] = [
  { id: "concept/geography-production/hydrologic-cycle", title: "Hydrologic cycle", aliases: ["water cycle"], knowledgeUnitIds: ["unit/geography-production/cycle-system"] },
  { id: "concept/geography-production/atmospheric-transfer", title: "Atmospheric water transfer", aliases: ["evapotranspiration", "condensation", "precipitation"], knowledgeUnitIds: ["unit/geography-production/evapotranspiration", "unit/geography-production/condensation-precipitation"] },
  { id: "concept/geography-production/groundwater", title: "Groundwater recharge and flow", aliases: ["infiltration", "percolation"], knowledgeUnitIds: ["unit/geography-production/infiltration-recharge", "unit/geography-production/storage-flow"] },
  { id: "concept/geography-production/surface-flow", title: "Surface runoff", aliases: ["overland flow"], knowledgeUnitIds: ["unit/geography-production/runoff"] },
  { id: "concept/geography-production/water-storage", title: "Water storage", aliases: ["reservoirs", "water stores"], knowledgeUnitIds: ["unit/geography-production/storage-flow"] },
];

const objectives: readonly PilotObjective[] = [
  { id: "objective/geography-production/trace-cycle", verb: "explain", statement: "Explain how water can be traced through atmospheric, terrestrial, surface-water, and groundwater stores using the processes that connect them.", level: "foundational" },
  { id: "objective/geography-production/distinguish-processes", verb: "distinguish", statement: "Distinguish evaporation, transpiration, infiltration, percolation, runoff, and groundwater flow by their pathways.", level: "foundational" },
  { id: "objective/geography-production/explain-storage", verb: "explain", statement: "Explain why oceans, ice, soil, lakes, rivers, vegetation, and aquifers act as stores rather than single-direction steps.", level: "foundational" },
  { id: "objective/geography-production/apply-change", verb: "apply", statement: "Apply the water-cycle model to reason about how land-use or climate changes can modify water pathways.", level: "intermediate" },
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
  summary: `A canonical explanation of ${title.toLowerCase()} within the hydrologic cycle.`,
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
  unit(
    "unit/geography-production/cycle-system",
    "The hydrologic cycle as a connected system",
    ["concept/geography-production/hydrologic-cycle", "concept/geography-production/water-storage"],
    ["objective/geography-production/trace-cycle", "objective/geography-production/explain-storage"],
    [
      block("block/geography-production/cycle-definition", "definition", 1, { text: "The hydrologic cycle is the continuous movement and storage of water among the atmosphere, land, surface water, organisms, and groundwater." }, ["claim/geography-production/cycle-system"]),
      block("block/geography-production/cycle-process", "mechanism-process", 2, { stages: ["energy moves water into the atmosphere", "water vapour condenses and is transported", "precipitation returns water to land or water bodies", "infiltration, runoff, and groundwater flow redistribute it"] }, ["claim/geography-production/cycle-system"]),
    ],
    ["claim/geography-production/cycle-system"],
    ["ref/geography-production/usgs-cycle", "ref/geography-production/noaa-cycle"],
  ),
  unit(
    "unit/geography-production/evapotranspiration",
    "Evaporation and transpiration",
    ["concept/geography-production/atmospheric-transfer"],
    ["objective/geography-production/distinguish-processes", "objective/geography-production/trace-cycle"],
    [
      block("block/geography-production/evaporation-explanation", "explanation", 1, { text: "Evaporation is surface transfer: energy enables liquid water from oceans, lakes, soil, or other wet surfaces to become vapour." }, ["claim/geography-production/evaporation"]),
      block("block/geography-production/transpiration-comparison", "comparison", 2, { dimensions: ["source", "pathway"], values: ["evaporation leaves exposed liquid or wet surfaces", "transpiration releases water vapour through plant tissues and leaves"] }, ["claim/geography-production/evapotranspiration"]),
      block("block/geography-production/evapotranspiration-synthesis", "explanation", 3, { text: "Evapotranspiration is a useful combined term when both direct surface evaporation and plant transpiration contribute to atmospheric moisture." }, ["claim/geography-production/evapotranspiration"]),
    ],
    ["claim/geography-production/evaporation", "claim/geography-production/evapotranspiration"],
    ["ref/geography-production/usgs-cycle", "ref/geography-production/noaa-cycle"],
  ),
  unit(
    "unit/geography-production/condensation-precipitation",
    "Condensation, clouds, and precipitation",
    ["concept/geography-production/atmospheric-transfer"],
    ["objective/geography-production/trace-cycle", "objective/geography-production/distinguish-processes"],
    [
      block("block/geography-production/condensation-process", "mechanism-process", 1, { stages: ["water vapour cools or meets suitable atmospheric conditions", "droplets or ice crystals form", "cloud particles may grow and be transported"] }, ["claim/geography-production/condensation"]),
      block("block/geography-production/precipitation-definition", "definition", 2, { text: "Precipitation is water that falls from the atmosphere to Earth’s surface as liquid or solid material." }, ["claim/geography-production/precipitation"]),
      block("block/geography-production/precipitation-sequence", "cause-effect", 3, { cause: "cloud particles become sufficiently large or heavy", effect: "gravity draws precipitation toward the surface" }, ["claim/geography-production/precipitation"]),
    ],
    ["claim/geography-production/condensation", "claim/geography-production/precipitation"],
    ["ref/geography-production/usgs-cycle", "ref/geography-production/noaa-cycle"],
  ),
  unit(
    "unit/geography-production/infiltration-recharge",
    "Infiltration, percolation, and groundwater recharge",
    ["concept/geography-production/groundwater"],
    ["objective/geography-production/distinguish-processes", "objective/geography-production/trace-cycle"],
    [
      block("block/geography-production/infiltration-distinction", "comparison", 1, { dimensions: ["meaning", "direction"], values: ["infiltration is entry from the surface into soil", "percolation is downward movement through soil and rock"] }, ["claim/geography-production/infiltration-recharge"]),
      block("block/geography-production/recharge-process", "mechanism-process", 2, { stages: ["water enters the soil", "some is held or used by organisms", "some moves downward through connected pores", "water reaching a saturated zone contributes to recharge"] }, ["claim/geography-production/infiltration-recharge"]),
    ],
    ["claim/geography-production/infiltration-recharge"],
    ["ref/geography-production/usgs-groundwater"],
  ),
  unit(
    "unit/geography-production/runoff",
    "Runoff and surface-water movement",
    ["concept/geography-production/surface-flow"],
    ["objective/geography-production/distinguish-processes", "objective/geography-production/trace-cycle"],
    [
      block("block/geography-production/runoff-definition", "definition", 1, { text: "Runoff is water moving over the land surface toward channels, lakes, wetlands, or the ocean." }, ["claim/geography-production/runoff"]),
      block("block/geography-production/runoff-cause-effect", "cause-effect", 2, { causes: ["rainfall intensity exceeds soil intake", "frozen or saturated ground", "impermeable urban surfaces"], effect: "a larger share of water follows a surface pathway" }, ["claim/geography-production/runoff"]),
      block("block/geography-production/runoff-groundwater-comparison", "comparison", 3, { dimensions: ["visible pathway", "main medium"], values: ["runoff travels across the surface", "groundwater flow travels through saturated subsurface material"] }, ["claim/geography-production/runoff"]),
    ],
    ["claim/geography-production/runoff"],
    ["ref/geography-production/usgs-cycle", "ref/geography-production/noaa-cycle"],
  ),
  unit(
    "unit/geography-production/storage-flow",
    "Water stores, groundwater flow, and human influence",
    ["concept/geography-production/water-storage", "concept/geography-production/groundwater"],
    ["objective/geography-production/explain-storage", "objective/geography-production/apply-change"],
    [
      block("block/geography-production/stores-example", "explanation", 1, { stores: ["oceans", "ice and snow", "lakes and rivers", "soil moisture", "vegetation", "atmosphere", "aquifers"], distinction: "A store holds water for a time; a process moves water between stores." }, ["claim/geography-production/cycle-system"]),
      block("block/geography-production/groundwater-flow", "explanation", 2, { text: "Groundwater can move through connected pores and fractures from recharge areas toward springs, streams, wetlands, or the coast." }, ["claim/geography-production/infiltration-recharge"]),
      block("block/geography-production/human-influence", "cause-effect", 3, { causes: ["land-cover change", "soil sealing", "water withdrawal", "warming climate"], effect: "the timing, amount, or pathway of water movement can change; the direction and magnitude depend on local conditions" }, ["claim/geography-production/human-influence"]),
    ],
    ["claim/geography-production/cycle-system", "claim/geography-production/infiltration-recharge", "claim/geography-production/human-influence"],
    ["ref/geography-production/usgs-cycle", "ref/geography-production/usgs-groundwater", "ref/geography-production/ipcc-water"],
  ),
];

const topic: PilotTopic = {
  id: topicId,
  disciplineId: "discipline/geography",
  subjectId,
  title: "The Water Cycle",
  summary: "A process-based explanation of water movement, storage, and human influence across the hydrologic cycle.",
  contentVersion: version,
  lifecycle: "published",
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  objectiveIds: objectives.map((item) => item.id),
  assessmentAlignmentIds: ["alignment/geography-production/water-cycle"],
  audience: "general learner",
  level: "foundational",
  provenanceStatus: "corroborated",
};

const assessmentAlignments: readonly PilotAssessmentAlignment[] = [{
  id: "alignment/geography-production/water-cycle",
  objectiveIds: objectives.map((item) => item.id),
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  assessmentSetId: "pilot/geography/water-cycle",
  contentVersion: version,
}];

export const geographyWaterCycleProductionPackage: PilotPackage = {
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
