import type { PilotAssessmentAlignment, PilotClaim, PilotConcept, PilotContentBlock, PilotKnowledgeUnit, PilotObjective, PilotPackage, PilotSource, PilotSourceReference, PilotTopic } from "@/lib/content/pilot/index";

const topicId = "topic/geography/plate-tectonics";
const subjectId = "subject/geography";
const version = 1;

const sources: readonly PilotSource[] = [
  { id: "source/geography-tectonics/usgs-dynamic-earth", type: "government", title: "This Dynamic Earth: The Story of Plate Tectonics", publisherOrOrganization: "U.S. Geological Survey", reference: "https://pubs.usgs.gov/gip/dynamic/dynamic.html", language: "en", accessedDate: "2026-09-03" },
  { id: "source/geography-tectonics/nps-plate-tectonics", type: "government", title: "Plate Tectonics", publisherOrOrganization: "National Park Service", reference: "https://www.nps.gov/subjects/geology/plate-tectonics.htm", language: "en", accessedDate: "2026-09-03" },
  { id: "source/geography-tectonics/noaa-seafloor", type: "government", title: "Seafloor Spreading", publisherOrOrganization: "National Oceanic and Atmospheric Administration", reference: "https://oceanservice.noaa.gov/education/tutorial_geodesy/geo09_seafloor.html", language: "en", accessedDate: "2026-09-03" },
  { id: "source/geography-tectonics/usgs-earthquake", type: "government", title: "Earthquake Hazards Program", publisherOrOrganization: "U.S. Geological Survey", reference: "https://www.usgs.gov/programs/earthquake-hazards", language: "en", accessedDate: "2026-09-03" },
  { id: "source/geography-tectonics/smithsonian-volcanoes", type: "international-organization", title: "Global Volcanism Program", publisherOrOrganization: "Smithsonian Institution", reference: "https://volcano.si.edu/", language: "en", accessedDate: "2026-09-03" },
];

const sourceReferences: readonly PilotSourceReference[] = [
  { id: "ref/geography-tectonics/usgs-dynamic-earth", sourceId: sources[0].id, supportType: "direct", citation: "USGS, This Dynamic Earth", locator: "Plate tectonics overview" },
  { id: "ref/geography-tectonics/nps-plate-tectonics", sourceId: sources[1].id, supportType: "direct", citation: "National Park Service, Plate Tectonics", locator: "Plates and boundaries" },
  { id: "ref/geography-tectonics/noaa-seafloor", sourceId: sources[2].id, supportType: "direct", citation: "NOAA, Seafloor Spreading", locator: "Ocean-floor renewal" },
  { id: "ref/geography-tectonics/usgs-earthquake", sourceId: sources[3].id, supportType: "direct", citation: "USGS, Earthquake Hazards Program", locator: "Earthquake relationships" },
  { id: "ref/geography-tectonics/smithsonian-volcanoes", sourceId: sources[4].id, supportType: "contextual", citation: "Smithsonian Global Volcanism Program", locator: "Volcanism reference" },
];

const claims: readonly PilotClaim[] = [
  { id: "claim/geography-tectonics/theory", statement: "Plate tectonics describes the large-scale movement and interaction of rigid lithospheric plates over geological time.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id] },
  { id: "claim/geography-tectonics/structure", statement: "A tectonic plate is a piece of lithosphere, which includes crust and rigid uppermost mantle; it is not identical to a continent or to crust alone.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id] },
  { id: "claim/geography-tectonics/divergent", statement: "At divergent boundaries, plates move apart and new oceanic lithosphere can form through seafloor spreading.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[2].id] },
  { id: "claim/geography-tectonics/convergent", statement: "At convergent boundaries, plates move toward one another; an oceanic plate may subduct beneath another plate, while continental collision can build mountain belts.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id] },
  { id: "claim/geography-tectonics/transform", statement: "At transform boundaries, plates primarily move horizontally past one another, producing faults and earthquakes without being defined by seafloor creation or subduction.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[3].id] },
  { id: "claim/geography-tectonics/earthquakes", statement: "Earthquakes can occur when accumulated stress is released along faults, including faults associated with plate boundaries.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[3].id] },
  { id: "claim/geography-tectonics/volcanism", statement: "Volcanism is associated with some plate settings, including subduction zones and divergent boundaries, but earthquakes and volcanoes are distinct geological phenomena.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[1].id, sourceReferences[4].id] },
  { id: "claim/geography-tectonics/motion", statement: "Plate motion is relative motion between lithospheric plates; plates do not simply float as rigid objects on a global liquid ocean.", kind: "factual", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id] },
  { id: "claim/geography-tectonics/history", statement: "Wegener's continental-drift proposal preceded the modern plate-tectonic framework, which incorporated later evidence such as seafloor spreading.", kind: "historical", interpretationStatus: "fact", supportStatus: "corroborated", sourceReferenceIds: [sourceReferences[0].id] },
];

const concepts: readonly PilotConcept[] = [
  { id: "concept/geography-tectonics/theory", title: "Plate tectonic theory", aliases: ["plate tectonics", "continental drift"], knowledgeUnitIds: ["unit/geography-tectonics/theory", "unit/geography-tectonics/history"] },
  { id: "concept/geography-tectonics/plate-structure", title: "Lithosphere, asthenosphere, and plate structure", aliases: ["tectonic plate", "crust", "rigid lithosphere"], knowledgeUnitIds: ["unit/geography-tectonics/structure"] },
  { id: "concept/geography-tectonics/boundaries", title: "Plate-boundary classification", aliases: ["divergent", "convergent", "transform"], knowledgeUnitIds: ["unit/geography-tectonics/boundaries"] },
  { id: "concept/geography-tectonics/processes", title: "Seafloor spreading and subduction", aliases: ["subduction", "sea-floor spreading", "convergence"], knowledgeUnitIds: ["unit/geography-tectonics/divergent-convergent"] },
  { id: "concept/geography-tectonics/consequences", title: "Earthquakes, volcanism, and mountain building", aliases: ["faults", "volcanoes", "orogeny"], knowledgeUnitIds: ["unit/geography-tectonics/transform-effects", "unit/geography-tectonics/examples"] },
];

const objectives: readonly PilotObjective[] = [
  { id: "objective/geography-tectonics/explain-theory", verb: "explain", statement: "Explain the basic plate-tectonic model and distinguish it from the earlier continental-drift proposal.", level: "foundational" },
  { id: "objective/geography-tectonics/distinguish-structure", verb: "distinguish", statement: "Distinguish lithosphere, asthenosphere, tectonic plates, crust, and continents.", level: "foundational" },
  { id: "objective/geography-tectonics/classify-boundaries", verb: "distinguish", statement: "Distinguish divergent, convergent, and transform boundaries by relative motion and principal processes.", level: "foundational" },
  { id: "objective/geography-tectonics/relate-processes", verb: "analyze", statement: "Analyze how seafloor spreading, subduction, and continental collision relate to selected surface consequences.", level: "intermediate" },
  { id: "objective/geography-tectonics/apply-evidence", verb: "apply", statement: "Apply boundary concepts to interpret carefully scoped earthquake, volcanism, and mountain-building examples.", level: "intermediate" },
];

const block = (id: string, type: PilotContentBlock["type"], order: number, payload: PilotContentBlock["payload"], claimIds: readonly string[]): PilotContentBlock => ({ id, type, order, payload, claimIds });
const unit = (id: string, title: string, conceptIds: readonly string[], objectiveIds: readonly string[], blocks: readonly PilotContentBlock[], claimIds: readonly string[], sourceReferenceIds: readonly string[]): PilotKnowledgeUnit => ({ id, title, summary: `A canonical explanation of ${title.toLowerCase()} in plate tectonics.`, conceptIds, objectiveIds, blocks, contentVersion: version, lifecycle: "published", claimIds, sourceReferenceIds, audience: "general learner", level: "foundational" });

const knowledgeUnits: readonly PilotKnowledgeUnit[] = [
  unit("unit/geography-tectonics/theory", "The plate-tectonic model", ["concept/geography-tectonics/theory"], ["objective/geography-tectonics/explain-theory"], [
    block("block/geography-tectonics/theory-definition", "definition", 1, { text: "Plate tectonics is the model that Earth's lithosphere is divided into moving plates whose interactions shape the planet's surface." }, ["claim/geography-tectonics/theory"]),
    block("block/geography-tectonics/theory-explanation", "explanation", 2, { text: "The model links plate motion and boundary interactions to the creation, deformation, and recycling of lithosphere." }, ["claim/geography-tectonics/theory"]),
  ], ["claim/geography-tectonics/theory"], ["ref/geography-tectonics/usgs-dynamic-earth", "ref/geography-tectonics/nps-plate-tectonics"]),
  unit("unit/geography-tectonics/history", "Continental drift and development of plate tectonics", ["concept/geography-tectonics/theory"], ["objective/geography-tectonics/explain-theory"], [
    block("block/geography-tectonics/history-chronology", "chronology", 1, { stages: ["Wegener's continental-drift proposal", "later evidence for seafloor spreading", "modern plate-tectonic framework"], distinction: "These stages are historically related but are not identical claims." }, ["claim/geography-tectonics/history"]),
    block("block/geography-tectonics/history-misconception", "misconception", 2, { misconception: "Continental drift and plate tectonics are interchangeable names for one original theory.", correction: "Continental drift was an earlier proposal; plate tectonics is the later comprehensive framework." }, ["claim/geography-tectonics/history"]),
  ], ["claim/geography-tectonics/history"], ["ref/geography-tectonics/usgs-dynamic-earth"]),
  unit("unit/geography-tectonics/structure", "Lithosphere, asthenosphere, and plates", ["concept/geography-tectonics/plate-structure"], ["objective/geography-tectonics/distinguish-structure"], [
    block("block/geography-tectonics/structure-comparison", "comparison", 1, { dimensions: ["lithosphere", "asthenosphere", "crust", "continent"], values: ["rigid outer layer that forms plates", "weaker, hotter upper-mantle zone beneath much of the lithosphere", "rock layer that is part of continental or oceanic lithosphere", "large continental landmass carried by continental lithosphere"] }, ["claim/geography-tectonics/structure"]),
    block("block/geography-tectonics/structure-misconception", "misconception", 2, { misconception: "A tectonic plate is the same thing as a continent or crust.", correction: "Plates are lithospheric units and may carry oceanic crust, continental crust, or both." }, ["claim/geography-tectonics/structure"]),
  ], ["claim/geography-tectonics/structure"], ["ref/geography-tectonics/usgs-dynamic-earth", "ref/geography-tectonics/nps-plate-tectonics"]),
  unit("unit/geography-tectonics/boundaries", "Classifying plate boundaries", ["concept/geography-tectonics/boundaries"], ["objective/geography-tectonics/classify-boundaries"], [
    block("block/geography-tectonics/boundaries-classification", "explanation", 1, { categories: ["divergent: move apart", "convergent: move together", "transform: slide past"], rule: "Classification begins with relative motion; geological effects depend on the materials and setting involved." }, ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent", "claim/geography-tectonics/transform"]),
    block("block/geography-tectonics/boundaries-comparison", "comparison", 2, { dimensions: ["motion", "typical process"], values: ["apart; creation of lithosphere", "together; subduction or collision", "horizontal relative motion; faulting"] }, ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent", "claim/geography-tectonics/transform"]),
  ], ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent", "claim/geography-tectonics/transform"], ["ref/geography-tectonics/usgs-dynamic-earth", "ref/geography-tectonics/nps-plate-tectonics"]),
  unit("unit/geography-tectonics/divergent-convergent", "Seafloor spreading, subduction, and collision", ["concept/geography-tectonics/processes", "concept/geography-tectonics/boundaries"], ["objective/geography-tectonics/relate-processes"], [
    block("block/geography-tectonics/spreading-process", "mechanism-process", 1, { process: "At a divergent oceanic boundary, upwelling and separation allow new oceanic lithosphere to form.", result: "Seafloor spreading increases ocean-floor crust at the boundary." }, ["claim/geography-tectonics/divergent"]),
    block("block/geography-tectonics/subduction-cause-effect", "cause-effect", 2, { cause: "An oceanic plate converges with another plate and descends beneath it.", effect: "Subduction recycles lithosphere and may be associated with earthquakes and volcanism." }, ["claim/geography-tectonics/convergent"]),
    block("block/geography-tectonics/collision-example", "example", 3, { setting: "continental-continental convergence", consequence: "crustal shortening and thickening can build mountain belts", boundary: "Not every convergent boundary has this setting or consequence." }, ["claim/geography-tectonics/convergent"]),
  ], ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent"], ["ref/geography-tectonics/usgs-dynamic-earth", "ref/geography-tectonics/noaa-seafloor", "ref/geography-tectonics/nps-plate-tectonics"]),
  unit("unit/geography-tectonics/transform-effects", "Transform motion and geological effects", ["concept/geography-tectonics/consequences", "concept/geography-tectonics/boundaries"], ["objective/geography-tectonics/relate-processes", "objective/geography-tectonics/apply-evidence"], [
    block("block/geography-tectonics/transform-process", "mechanism-process", 1, { process: "Adjacent plates move laterally past one another along a fault zone.", result: "Stress accumulation and release can generate earthquakes without requiring subduction." }, ["claim/geography-tectonics/transform", "claim/geography-tectonics/earthquakes"]),
    block("block/geography-tectonics/effects-comparison", "comparison", 2, { dimensions: ["earthquake", "volcanism"], values: ["sudden release of stored fault stress", "magma reaching and erupting at the surface"], distinction: "They may share a tectonic setting but are different processes." }, ["claim/geography-tectonics/earthquakes", "claim/geography-tectonics/volcanism"]),
  ], ["claim/geography-tectonics/transform", "claim/geography-tectonics/earthquakes", "claim/geography-tectonics/volcanism"], ["ref/geography-tectonics/usgs-earthquake", "ref/geography-tectonics/smithsonian-volcanoes"]),
  unit("unit/geography-tectonics/examples", "Plate interactions and selected consequences", ["concept/geography-tectonics/consequences"], ["objective/geography-tectonics/apply-evidence"], [
    block("block/geography-tectonics/examples-case-study", "case-study", 1, { applications: ["divergent boundaries and new oceanic lithosphere", "subduction zones and linked earthquakes/volcanism", "continental collision and mountain building"], boundary: "These are representative relationships, not a complete catalogue of hazards or landforms." }, ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent", "claim/geography-tectonics/volcanism"]),
    block("block/geography-tectonics/examples-misconception", "misconception", 2, { misconception: "Every convergent boundary produces the same landform, and every plate boundary is equally volcanic.", correction: "Consequences depend on boundary type, crustal character, and local geological setting." }, ["claim/geography-tectonics/convergent", "claim/geography-tectonics/volcanism"]),
  ], ["claim/geography-tectonics/divergent", "claim/geography-tectonics/convergent", "claim/geography-tectonics/volcanism"], ["ref/geography-tectonics/nps-plate-tectonics", "ref/geography-tectonics/smithsonian-volcanoes"]),
];

const topic: PilotTopic = {
  id: topicId, disciplineId: "discipline/geography", subjectId, title: "Plate Tectonics",
  summary: "A bounded foundation in tectonic plates, lithosphere, boundaries, plate interactions, and selected geological consequences.",
  contentVersion: version, lifecycle: "published", conceptIds: concepts.map((item) => item.id), knowledgeUnitIds: knowledgeUnits.map((item) => item.id), objectiveIds: objectives.map((item) => item.id), assessmentAlignmentIds: ["alignment/geography-tectonics/foundations"], audience: "general learner", level: "foundational", provenanceStatus: "corroborated",
};

const assessmentAlignments: readonly PilotAssessmentAlignment[] = [{ id: "alignment/geography-tectonics/foundations", objectiveIds: objectives.map((item) => item.id), conceptIds: concepts.map((item) => item.id), knowledgeUnitIds: knowledgeUnits.map((item) => item.id), assessmentSetId: "pilot/geography/plate-tectonics", contentVersion: version }];

export const geographyPlateTectonicsProductionPackage: PilotPackage = { disciplineId: "discipline/geography", subjectId, topic, concepts, objectives, knowledgeUnits, claims, sources, sourceReferences, assessmentAlignments };
