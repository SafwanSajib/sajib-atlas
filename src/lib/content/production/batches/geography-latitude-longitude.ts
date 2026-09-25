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

const topicId = "topic/geography/latitude-and-longitude";
const subjectId = "subject/geography";
const version = 1;

const sources: readonly PilotSource[] = [
  {
    id: "source/geography-coordinates/noaa-geodesy",
    type: "government",
    title: "Latitude and Longitude",
    publisherOrOrganization: "National Oceanic and Atmospheric Administration",
    reference: "https://oceanservice.noaa.gov/education/tutorial_geodesy/geo02_latlong.html",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-coordinates/epsg-guidance",
    type: "international-organization",
    title: "EPSG Guidance Notes",
    publisherOrOrganization: "International Association of Oil & Gas Producers",
    reference: "https://epsg.org/guidance-notes.html",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-coordinates/ogc-crs",
    type: "international-organization",
    title: "OGC Abstract Specification Topic 2: Referencing by Coordinates",
    publisherOrOrganization: "Open Geospatial Consortium",
    reference: "https://www.ogc.org/standards/abstract-specification",
    language: "en",
    accessedDate: "2026-09-03",
  },
  {
    id: "source/geography-coordinates/epsg-dataset",
    type: "international-organization",
    title: "EPSG Geodetic Parameter Dataset",
    publisherOrOrganization: "International Association of Oil & Gas Producers",
    reference: "https://epsg.org/",
    language: "en",
    accessedDate: "2026-09-03",
  },
];

const sourceReferences: readonly PilotSourceReference[] = [
  { id: "ref/geography-coordinates/noaa-geodesy", sourceId: sources[0].id, supportType: "direct", citation: "NOAA, Latitude and Longitude", locator: "Geodesy tutorial" },
  { id: "ref/geography-coordinates/epsg-guidance", sourceId: sources[1].id, supportType: "direct", citation: "EPSG Guidance Notes", locator: "Geodetic parameter and coordinate-system guidance" },
  { id: "ref/geography-coordinates/ogc-crs", sourceId: sources[2].id, supportType: "contextual", citation: "Open Geospatial Consortium, Abstract Specification Topic 2", locator: "Referencing by coordinates" },
  { id: "ref/geography-coordinates/epsg-dataset", sourceId: sources[3].id, supportType: "contextual", citation: "EPSG Geodetic Parameter Dataset", locator: "Coordinate reference systems" },
];

const claims: readonly PilotClaim[] = [
  {
    id: "claim/geography-coordinates/coordinate-system",
    statement: "A geographic coordinate system describes positions on Earth using angular coordinates referenced to a defined datum or reference surface.",
    kind: "definition",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id, sourceReferences[2].id],
  },
  {
    id: "claim/geography-coordinates/latitude",
    statement: "Latitude measures angular position north or south of the Equator, from 0 degrees at the Equator toward a maximum of 90 degrees at either pole.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-coordinates/longitude",
    statement: "Longitude measures angular position east or west of the Prime Meridian, using values up to 180 degrees in either direction.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-coordinates/geometry",
    statement: "Lines of latitude are parallels that generally do not meet, while meridians of longitude converge toward the poles.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[1].id],
  },
  {
    id: "claim/geography-coordinates/pair",
    statement: "A coordinate pair identifies a position by combining one latitude value with one longitude value in a stated order and reference system.",
    kind: "definition",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[2].id],
  },
  {
    id: "claim/geography-coordinates/notation",
    statement: "Degrees-minutes-seconds and decimal degrees are two representations of angular coordinates; a direction or sign is required to distinguish opposite hemispheres.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[0].id, sourceReferences[2].id],
  },
  {
    id: "claim/geography-coordinates/application",
    statement: "Coordinate systems provide a common spatial reference for mapping, geographic information systems, and navigation.",
    kind: "factual",
    interpretationStatus: "fact",
    supportStatus: "corroborated",
    sourceReferenceIds: [sourceReferences[1].id, sourceReferences[2].id],
  },
];

const concepts: readonly PilotConcept[] = [
  { id: "concept/geography-coordinates/system", title: "Geographic coordinate system", aliases: ["GCS", "coordinate reference"], knowledgeUnitIds: ["unit/geography-coordinates/system"] },
  { id: "concept/geography-coordinates/latitude", title: "Latitude and parallels", aliases: ["Equator", "north latitude", "south latitude"], knowledgeUnitIds: ["unit/geography-coordinates/latitude"] },
  { id: "concept/geography-coordinates/longitude", title: "Longitude and meridians", aliases: ["Prime Meridian", "east longitude", "west longitude"], knowledgeUnitIds: ["unit/geography-coordinates/longitude"] },
  { id: "concept/geography-coordinates/pairs", title: "Coordinate pairs and notation", aliases: ["DMS", "decimal degrees"], knowledgeUnitIds: ["unit/geography-coordinates/pairs", "unit/geography-coordinates/conversion"] },
  { id: "concept/geography-coordinates/spatial-application", title: "Spatial coordinate application", aliases: ["mapping", "GIS", "position"], knowledgeUnitIds: ["unit/geography-coordinates/spatial-application"] },
];

const objectives: readonly PilotObjective[] = [
  { id: "objective/geography-coordinates/define-system", verb: "explain", statement: "Explain how latitude and longitude form an angular reference for positions on Earth.", level: "foundational" },
  { id: "objective/geography-coordinates/distinguish-lines", verb: "distinguish", statement: "Distinguish latitude from longitude, parallels from meridians, and the Equator from the Prime Meridian.", level: "foundational" },
  { id: "objective/geography-coordinates/interpret-pair", verb: "apply", statement: "Interpret a coordinate pair using direction, order, and a stated notation.", level: "foundational" },
  { id: "objective/geography-coordinates/convert-notation", verb: "apply", statement: "Apply the degree-minute-second to decimal-degree rule when the required directional convention is provided.", level: "intermediate" },
  { id: "objective/geography-coordinates/use-position", verb: "analyze", statement: "Analyze how coordinate values describe relative spatial position for mapping and geographic information work.", level: "intermediate" },
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
  summary: `A canonical explanation of ${title.toLowerCase()} for geographic position.`,
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
  unit("unit/geography-coordinates/system", "The geographic coordinate system", ["concept/geography-coordinates/system"], ["objective/geography-coordinates/define-system"], [
    block("block/geography-coordinates/system-definition", "definition", 1, { text: "A geographic coordinate system locates positions on Earth with angular coordinates measured from agreed reference lines and a defined reference surface." }, ["claim/geography-coordinates/coordinate-system"]),
    block("block/geography-coordinates/system-comparison", "comparison", 2, { dimensions: ["coordinate", "meaning"], values: ["latitude describes north-south angular position", "longitude describes east-west angular position"] }, ["claim/geography-coordinates/coordinate-system"]),
  ], ["claim/geography-coordinates/coordinate-system"], ["ref/geography-coordinates/noaa-geodesy", "ref/geography-coordinates/epsg-guidance", "ref/geography-coordinates/ogc-crs"]),
  unit("unit/geography-coordinates/latitude", "Latitude and parallels", ["concept/geography-coordinates/latitude"], ["objective/geography-coordinates/distinguish-lines", "objective/geography-coordinates/interpret-pair"], [
    block("block/geography-coordinates/latitude-definition", "definition", 1, { text: "Latitude is angular position measured north or south from the Equator. The Equator is 0 degrees latitude; the poles are 90 degrees north and 90 degrees south." }, ["claim/geography-coordinates/latitude"]),
    block("block/geography-coordinates/latitude-classification", "explanation", 2, { categories: ["north latitude", "south latitude"], rule: "The direction names the hemisphere; the magnitude gives angular distance from the Equator." }, ["claim/geography-coordinates/latitude"]),
    block("block/geography-coordinates/latitude-geometry", "explanation", 3, { text: "Parallels are east-west circles of latitude. Their planes are parallel, so the parallels do not converge like meridians." }, ["claim/geography-coordinates/geometry"]),
  ], ["claim/geography-coordinates/latitude", "claim/geography-coordinates/geometry"], ["ref/geography-coordinates/noaa-geodesy", "ref/geography-coordinates/epsg-guidance"]),
  unit("unit/geography-coordinates/longitude", "Longitude and meridians", ["concept/geography-coordinates/longitude"], ["objective/geography-coordinates/distinguish-lines", "objective/geography-coordinates/interpret-pair"], [
    block("block/geography-coordinates/longitude-definition", "definition", 1, { text: "Longitude is angular position measured east or west from the Prime Meridian, the reference meridian assigned 0 degrees." }, ["claim/geography-coordinates/longitude"]),
    block("block/geography-coordinates/longitude-classification", "explanation", 2, { categories: ["east longitude", "west longitude"], rule: "The direction names the side of the Prime Meridian; values extend toward 180 degrees." }, ["claim/geography-coordinates/longitude"]),
    block("block/geography-coordinates/meridian-geometry", "cause-effect", 3, { cause: "meridians are great-circle reference lines joining the poles", effect: "meridians converge toward the poles" }, ["claim/geography-coordinates/geometry"]),
  ], ["claim/geography-coordinates/longitude", "claim/geography-coordinates/geometry"], ["ref/geography-coordinates/noaa-geodesy", "ref/geography-coordinates/epsg-guidance"]),
  unit("unit/geography-coordinates/pairs", "Coordinate pairs and reference lines", ["concept/geography-coordinates/pairs", "concept/geography-coordinates/latitude", "concept/geography-coordinates/longitude"], ["objective/geography-coordinates/distinguish-lines", "objective/geography-coordinates/interpret-pair"], [
    block("block/geography-coordinates/reference-comparison", "comparison", 1, { dimensions: ["latitude", "longitude"], values: ["Equator reference; north or south; 0 to 90 degrees", "Prime Meridian reference; east or west; up to 180 degrees"] }, ["claim/geography-coordinates/latitude", "claim/geography-coordinates/longitude"]),
    block("block/geography-coordinates/pair-definition", "definition", 2, { text: "A coordinate pair combines latitude and longitude to identify the intersection of one parallel and one meridian. The order must be stated; this package uses latitude first, longitude second." }, ["claim/geography-coordinates/pair"]),
    block("block/geography-coordinates/misconception", "misconception", 3, { misconception: "The first number is not automatically longitude, and north/south is not interchangeable with east/west.", correction: "Read the stated order and direction before interpreting a coordinate." }, ["claim/geography-coordinates/pair"]),
  ], ["claim/geography-coordinates/latitude", "claim/geography-coordinates/longitude", "claim/geography-coordinates/pair"], ["ref/geography-coordinates/noaa-geodesy", "ref/geography-coordinates/ogc-crs"]),
  unit("unit/geography-coordinates/conversion", "Degrees, minutes, seconds, and decimal degrees", ["concept/geography-coordinates/pairs"], ["objective/geography-coordinates/convert-notation", "objective/geography-coordinates/interpret-pair"], [
    block("block/geography-coordinates/notation-comparison", "comparison", 1, { dimensions: ["DMS", "decimal degrees"], values: ["degrees, minutes, and seconds show subdivisions of an angle", "a decimal degree expresses the same angle as one decimal number"] }, ["claim/geography-coordinates/notation"]),
    block("block/geography-coordinates/dms-rule", "procedure-derivation", 2, { rule: "decimal degrees = degrees + minutes / 60 + seconds / 3600", direction: "Use a negative sign for south or west when signed decimal notation is the chosen convention." }, ["claim/geography-coordinates/notation"]),
    block("block/geography-coordinates/notation-example", "example", 3, { dms: "23 degrees 30 minutes 0 seconds north", decimalDegrees: "23.5 degrees north", reasoning: "23 + 30 / 60 + 0 / 3600 = 23.5" }, ["claim/geography-coordinates/notation"]),
  ], ["claim/geography-coordinates/notation"], ["ref/geography-coordinates/noaa-geodesy", "ref/geography-coordinates/ogc-crs"]),
  unit("unit/geography-coordinates/spatial-application", "Using coordinates for spatial position", ["concept/geography-coordinates/spatial-application", "concept/geography-coordinates/pairs"], ["objective/geography-coordinates/use-position", "objective/geography-coordinates/interpret-pair"], [
    block("block/geography-coordinates/position-explanation", "explanation", 1, { text: "Changing latitude changes north-south position; changing longitude changes east-west position within the chosen reference system." }, ["claim/geography-coordinates/pair"]),
    block("block/geography-coordinates/application-example", "example", 2, { applications: ["mapping a named place", "organizing GIS features", "describing a navigation position"], boundary: "Coordinates identify position; a map projection is a separate method for displaying that position on a plane." }, ["claim/geography-coordinates/application"]),
    block("block/geography-coordinates/reference-warning", "exception", 3, { text: "A coordinate is incomplete without its order, direction/sign convention, and reference system when those details affect interpretation." }, ["claim/geography-coordinates/pair", "claim/geography-coordinates/application"]),
  ], ["claim/geography-coordinates/pair", "claim/geography-coordinates/application"], ["ref/geography-coordinates/epsg-guidance", "ref/geography-coordinates/ogc-crs"]),
];

const topic: PilotTopic = {
  id: topicId,
  disciplineId: "discipline/geography",
  subjectId,
  title: "Latitude and Longitude",
  summary: "A spatial foundation for interpreting latitude, longitude, coordinate pairs, angular notation, and geographic position.",
  contentVersion: version,
  lifecycle: "published",
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  objectiveIds: objectives.map((item) => item.id),
  assessmentAlignmentIds: ["alignment/geography-coordinates/latitude-longitude"],
  audience: "general learner",
  level: "foundational",
  provenanceStatus: "corroborated",
};

const assessmentAlignments: readonly PilotAssessmentAlignment[] = [{
  id: "alignment/geography-coordinates/latitude-longitude",
  objectiveIds: objectives.map((item) => item.id),
  conceptIds: concepts.map((item) => item.id),
  knowledgeUnitIds: knowledgeUnits.map((item) => item.id),
  assessmentSetId: "pilot/geography/latitude-and-longitude",
  contentVersion: version,
}];

export const geographyLatitudeLongitudeProductionPackage: PilotPackage = {
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
