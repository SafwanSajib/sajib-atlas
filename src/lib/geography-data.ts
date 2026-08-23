export type Difficulty = "Foundation" | "Intermediate" | "Advanced";

export type TopicSections = {
  overview: string;
  coreConcept: string;
  keyFacts: string[];
  bcsPreli: string[];
  writtenPoints: string[];
  geographyLink: string;
  quickRevision: string[];
};

export interface GeographyTopic {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  difficulty: Difficulty;
  examRelevance: string;
  sections: TopicSections;
  tags: string[];
}

export interface GeographyCategory {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  number: string;
  topics: GeographyTopic[];
}

type TopicSeed = Omit<GeographyTopic, "sections"> & { sections?: Partial<TopicSections> };

const makeTopic = (seed: TopicSeed): GeographyTopic => {
  const sectionDefaults: TopicSections = {
    overview: seed.shortDescription,
    coreConcept: `${seed.title} is studied as a relationship between processes, patterns and place. This foundation helps explain how geographic systems work and why they vary across regions.`,
    keyFacts: [`${seed.title} is a core concept in ${seed.category}.`, "Use exact terminology and connect the concept to a real geographic example."],
    bcsPreli: [`Remember the definition and the central process of ${seed.title}.`, "Relate the concept to a map, region or observable geographic pattern."],
    writtenPoints: [`Define the concept before explaining its causes, characteristics and consequences.`, "Use a Bangladesh or global example to make the answer analytical."],
    geographyLink: `Geography turns ${seed.title} from an isolated fact into a spatial question: where does it occur, why there, and with what consequences?`,
    quickRevision: [seed.title, "Definition → process → spatial example"],
  };
  return { ...seed, sections: { ...sectionDefaults, ...seed.sections } };
};

const physical = (title: string, slug: string, description: string, sections?: Partial<TopicSections>, difficulty: Difficulty = "Foundation", examRelevance = "High") => makeTopic({ slug, title, shortDescription: description, category: "Physical Geography", difficulty, examRelevance, tags: ["earth systems", "physical geography", "BCS"], sections });
const human = (title: string, slug: string, description: string) => makeTopic({ slug, title, shortDescription: description, category: "Human Geography", difficulty: "Foundation", examRelevance: "High", tags: ["people", "society", "human geography"], });
const economic = (title: string, slug: string, description: string) => makeTopic({ slug, title, shortDescription: description, category: "Economic Geography", difficulty: "Intermediate", examRelevance: "High", tags: ["resources", "development", "economic geography"], });
const environmental = (title: string, slug: string, description: string) => makeTopic({ slug, title, shortDescription: description, category: "Environmental Geography", difficulty: "Intermediate", examRelevance: "Very high", tags: ["environment", "sustainability", "climate"], });
const bangladesh = (title: string, slug: string, description: string) => makeTopic({ slug, title, shortDescription: description, category: "Geography of Bangladesh", difficulty: "Intermediate", examRelevance: "Very high", tags: ["Bangladesh", "regional geography", "BCS"], });

export const geographyCategories: GeographyCategory[] = [
  { slug: "physical-geography", title: "Physical Geography", eyebrow: "01 / Earth systems", description: "Landforms, climate, oceans and the living systems of the planet.", number: "01", topics: [
    physical("Earth's Rotation", "earths-rotation", "The west-to-east spin of Earth and its effects on time, motion and circulation.", { overview: "Earth rotates west to east around its axis. This daily movement creates the alternation of day and night and shapes the apparent motion of the sky.", coreConcept: "A sidereal rotation takes 23 hours 56 minutes 4 seconds, while the solar day is approximately 24 hours. Rotation gives different longitudes different local times and produces the Coriolis effect, which deflects moving air and water to the right in the Northern Hemisphere and left in the Southern Hemisphere.", keyFacts: ["Direction: west to east, or counterclockwise viewed from above the North Pole.", "Sidereal day: 23 h 56 m 4 s; mean solar day: 24 hours.", "Rotation produces day and night, apparent daily motion, local time and Coriolis deflection."], bcsPreli: ["15° of longitude corresponds to one hour of time; 1° corresponds to four minutes.", "Rotation is fastest at the Equator and effectively zero at the poles.", "Coriolis effect is zero at the Equator and strongest toward the poles."], writtenPoints: ["Explain rotation through the links between angular motion, time zones and apparent solar movement.", "Discuss its role in the direction of winds and ocean currents through Coriolis deflection."], geographyLink: "Longitude is a spatial expression of rotational time: places east of a reference meridian experience local noon earlier.", quickRevision: ["West → east", "23 h 56 m 4 s sidereal day", "Day/night + local time + Coriolis effect"] }),
    physical("Earth's Revolution", "earths-revolution", "Earth's annual orbit around the Sun and the geometry behind the seasons."),
    physical("Latitude and Longitude", "latitude-and-longitude", "The coordinate framework used to locate places and measure distance east-west and north-south."),
    physical("Seasons", "seasons", "Seasonal change caused primarily by axial tilt and Earth's revolution around the Sun."),
    physical("Earth's Interior", "earths-interior", "The layered structure of the crust, mantle, outer core and inner core."),
    physical("Plate Tectonics", "plate-tectonics", "The movement of lithospheric plates and its role in shaping Earth's surface.", { coreConcept: "Plate tectonics explains the movement of rigid lithospheric plates over the ductile asthenosphere. Divergent boundaries create crust, convergent boundaries destroy or deform crust, and transform boundaries accommodate lateral motion.", keyFacts: ["Divergent, convergent and transform boundaries are the three principal boundary types.", "Subduction commonly creates trenches, volcanic arcs and deep earthquakes.", "Seafloor spreading and paleomagnetism support the theory."], bcsPreli: ["Lithosphere is rigid; asthenosphere is relatively plastic.", "Transform boundaries mainly produce shallow earthquakes.", "The Himalaya formed through continental collision."], writtenPoints: ["Link plate boundaries with landforms, hazards and resource distribution.", "Use the Himalaya or the Pacific Ring of Fire as a regional example."], geographyLink: "Plate boundaries explain why mountain belts, trenches, volcanoes and earthquake zones form in particular locations.", quickRevision: ["Lithospheric plates move over asthenosphere", "Divergent / convergent / transform", "Motion creates relief and hazards"] }, "Advanced", "Very high"),
    physical("Earthquakes", "earthquakes", "Sudden ground movement caused by the release of stored tectonic energy."), physical("Volcanoes", "volcanoes", "Surface openings through which magma, gases and ash reach the atmosphere."), physical("Rocks", "rocks", "The three major rock groups and the rock cycle connecting them."), physical("Weathering and Erosion", "weathering-and-erosion", "The breakdown and removal of material that reshape landscapes."), physical("Atmosphere", "atmosphere", "The layered gaseous envelope that supports weather, climate and life."), physical("Atmospheric Pressure", "atmospheric-pressure", "The force exerted by the weight of air and its role in weather systems."), physical("Winds", "winds", "The horizontal movement of air from high-pressure toward low-pressure areas."), physical("Ocean Currents", "ocean-currents", "Large-scale movements of seawater driven by wind, density and Earth's rotation."), physical("Tides", "tides", "Periodic rise and fall of sea level produced mainly by lunar and solar gravity."),
  ] },
  { slug: "human-geography", title: "Human Geography", eyebrow: "02 / People & place", description: "Population, culture, cities, migration and the spatial identity of human life.", number: "02", topics: [human("Population Geography", "population-geography", "The spatial study of population size, structure, change and movement."), human("Population Density", "population-density", "The relationship between population and the area it occupies."), human("Population Distribution", "population-distribution", "The uneven spatial pattern of people across the Earth's surface."), human("Migration", "migration", "The movement of people between places and the forces behind it."), human("Urbanization", "urbanization", "The growth of urban populations, settlements and metropolitan systems."), human("Rural Settlement", "rural-settlement", "Rural settlement forms, functions and relationships with land and resources."), human("Culture and Geography", "culture-and-geography", "How beliefs, language and identity shape and are shaped by place."), human("Human Development", "human-development", "A people-centred measure of health, education, income and capability.") ] },
  { slug: "economic-geography", title: "Economic Geography", eyebrow: "03 / Networks & resources", description: "Production, trade, resources and the geography of opportunity.", number: "03", topics: [economic("Agriculture", "agriculture", "The spatial organization of farming, crops, land and food systems."), economic("Industry", "industry", "The location, organization and regional effects of industrial activity."), economic("Resources", "resources", "Natural and human resources, their distribution and their use."), economic("Energy Geography", "energy-geography", "The production, movement and consumption of energy across regions."), economic("Transport Geography", "transport-geography", "Networks, accessibility and the movement of people and goods."), economic("Trade Geography", "trade-geography", "The spatial pattern of exchange, markets, routes and specialization."), economic("Globalization", "globalization", "The intensification of worldwide economic, cultural and technological connections.") ] },
  { slug: "environmental-geography", title: "Environmental Geography", eyebrow: "04 / Planetary balance", description: "Human impact, risk, conservation and sustainable futures.", number: "04", topics: [environmental("Ecosystem", "ecosystem", "A dynamic system of organisms interacting with one another and their physical environment."), environmental("Biodiversity", "biodiversity", "The variety of genes, species and ecosystems and why it matters."), environmental("Climate Change", "climate-change", "Long-term changes in climate patterns, causes and geographic consequences.",), environmental("Global Warming", "global-warming", "The long-term rise in Earth's average surface temperature, mainly from greenhouse gases."), environmental("Environmental Pollution", "environmental-pollution", "The introduction of harmful substances or energy into air, water and land."), environmental("Natural Hazards", "natural-hazards", "Natural processes that may threaten life, property and livelihoods."), environmental("Disaster Management", "disaster-management", "Preparedness, response, recovery and mitigation for hazard events."), environmental("Sustainable Development", "sustainable-development", "Development that meets present needs without compromising future generations.") ] },
  { slug: "geography-of-bangladesh", title: "Geography of Bangladesh", eyebrow: "05 / A living delta", description: "The rivers, regions, settlements and systems of Bangladesh.", number: "05", topics: [bangladesh("Location of Bangladesh", "location-of-bangladesh", "Bangladesh's position in South Asia, bounded by India, Myanmar and the Bay of Bengal."), bangladesh("Physiographic Divisions", "physiographic-divisions", "The major landform regions created by river deposition, uplift and erosion."), bangladesh("Rivers of Bangladesh", "rivers-of-bangladesh", "The river network that structures Bangladesh's landscape, economy and life."), bangladesh("Ganges-Brahmaputra-Meghna Basin", "ganges-brahmaputra-meghna-basin", "The transboundary drainage basin behind the delta's sediment, water and hazards."), bangladesh("Climate of Bangladesh", "climate-of-bangladesh", "The monsoon climate, seasonal rhythm and regional variation of Bangladesh."), bangladesh("Coastal Bangladesh", "coastal-bangladesh", "A low-lying coastal zone shaped by tides, cyclones, salinity and sediment."), bangladesh("Sundarbans", "sundarbans", "The world's largest contiguous mangrove forest and a critical delta ecosystem."), bangladesh("Haor and Wetland", "haor-and-wetland", "Seasonally flooded wetland basins important to ecology, fisheries and livelihoods."), bangladesh("Natural Resources of Bangladesh", "natural-resources-of-bangladesh", "Land, water, gas, forests, fisheries and other resources supporting development."), bangladesh("Population Geography of Bangladesh", "population-geography-of-bangladesh", "Population concentration, density and demographic change across Bangladesh."), bangladesh("Urbanization in Bangladesh", "urbanization-in-bangladesh", "The growth and spatial transformation of cities and metropolitan regions."), bangladesh("Climate Vulnerability of Bangladesh", "climate-vulnerability-of-bangladesh", "Exposure, sensitivity and adaptive capacity in a climate-vulnerable delta.") ] },
];

export const allGeographyTopics = geographyCategories.flatMap((category) => category.topics);
export const geographyTopicsBySlug = Object.fromEntries(allGeographyTopics.map((topic) => [topic.slug, topic])) as Record<string, GeographyTopic>;
export const geographyCategoriesBySlug = Object.fromEntries(geographyCategories.map((category) => [category.slug, category])) as Record<string, GeographyCategory>;
