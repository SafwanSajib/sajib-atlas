export type Difficulty = "Foundation" | "Intermediate" | "Advanced";

export type MCQQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type TopicSections = {
  overview: string;
  banglaSummary: string;
  coreConcept: string;
  whyItRotates: string;
  mechanism: string;
  keyFacts: string[];
  effects: string[];
  coriolisEffect: string;
  localTimeLongitude: string;
  bangladeshConnection: string;
  bcsPreli: string[];
  writtenPoints: string[];
  misconceptions: string[];
  mcqPractice: MCQQuestion[];
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
  const sections: TopicSections = {
    overview: seed.shortDescription,
    banglaSummary: `${seed.title} বিষয়টি স্থান, প্রক্রিয়া ও ভৌগোলিক পরিবর্তনের সম্পর্ক বুঝতে সাহায্য করে।`,
    coreConcept: `${seed.title} is studied as a relationship between processes, patterns and place. This foundation helps explain how geographic systems work and why they vary across regions.`,
    whyItRotates: "This section will explain the physical cause of the process and its geographic significance.",
    mechanism: "This section will describe the mechanism step by step, using precise geographic terminology.",
    keyFacts: [`${seed.title} is a core concept in ${seed.category}.`, "Use exact terminology and connect the concept to a real geographic example."],
    effects: [`${seed.title} affects geographic patterns and processes across different places.`],
    coriolisEffect: "This section will connect the topic to the Coriolis effect where relevant.",
    localTimeLongitude: "This section will connect the topic to longitude and local time where relevant.",
    bangladeshConnection: `In Bangladesh, ${seed.title.toLowerCase()} can be connected to regional patterns, livelihoods or environmental conditions.`,
    bcsPreli: [`Remember the definition and the central process of ${seed.title}.`, "Relate the concept to a map, region or observable geographic pattern."],
    writtenPoints: [`Define the concept before explaining its causes, characteristics and consequences.`, "Use a Bangladesh or global example to make the answer analytical."],
    misconceptions: [`Do not confuse the definition of ${seed.title} with a related but different geographic process.`],
    mcqPractice: [],
    geographyLink: `Geography turns ${seed.title} from an isolated fact into a spatial question: where does it occur, why there, and with what consequences?`,
    quickRevision: [seed.title, "Definition → process → spatial example"],
  };
  return { ...seed, sections: { ...sections, ...seed.sections } };
};

const topic = (category: string, title: string, slug: string, description: string, difficulty: Difficulty = "Foundation", examRelevance = "High", sections?: Partial<TopicSections>): GeographyTopic => makeTopic({ slug, title, shortDescription: description, category, difficulty, examRelevance, tags: [category.toLowerCase(), "BCS"], sections });
const category = (number: string, slug: string, title: string, eyebrow: string, description: string, topics: GeographyTopic[]): GeographyCategory => ({ number, slug, title, eyebrow, description, topics });

const rotation = topic("Physical Geography", "Earth's Rotation", "earths-rotation", "The west-to-east spin of Earth and its effects on time, motion and circulation.", "Foundation", "Very high", {
  overview: "Earth rotates west to east around its axis. This daily movement creates the alternation of day and night and shapes the apparent motion of the sky.",
  banglaSummary: "পৃথিবী নিজ অক্ষের চারদিকে পশ্চিম থেকে পূর্ব দিকে ঘোরে। এই ঘূর্ণনের ফলে দিন-রাত্রি, স্থানীয় সময়ের পার্থক্য এবং বায়ু ও সমুদ্রস্রোতের ওপর কোরিওলিস প্রভাব সৃষ্টি হয়।",
  coreConcept: "A sidereal rotation takes 23 hours 56 minutes 4 seconds, while the solar day is approximately 24 hours. Rotation gives different longitudes different local times and produces the Coriolis effect, which deflects moving air and water to the right in the Northern Hemisphere and left in the Southern Hemisphere.",
  whyItRotates: "Earth's rotation is a consequence of angular momentum retained from the rotating cloud of gas and dust that formed the solar system. As that cloud contracted, conservation of angular momentum sustained planetary spin.",
  mechanism: "Earth spins around an imaginary axis passing through the North and South Poles. Every point shares the same angular velocity, but linear velocity is greatest at the Equator because its distance from the axis is greatest.",
  keyFacts: ["Direction: west to east, or counterclockwise viewed from above the North Pole.", "Sidereal day: 23 h 56 m 4 s; mean solar day: 24 hours.", "Rotation produces day and night, apparent daily motion, local time and Coriolis deflection."],
  effects: ["Day and night alternate as places move into and out of sunlight.", "The Sun and stars appear to move daily from east to west.", "Different longitudes have different local times.", "Moving air and water are deflected through the Coriolis effect."],
  coriolisEffect: "On a rotating Earth, moving air and water appear to curve from a straight path. Deflection is to the right in the Northern Hemisphere and to the left in the Southern Hemisphere; it is effectively zero at the Equator and stronger toward the poles.",
  localTimeLongitude: "Earth rotates 360° in 24 hours, so 15° of longitude equals one hour and 1° equals four minutes. Local time is later eastward and earlier westward. Bangladesh Standard Time is based on 90°E, six hours ahead of Greenwich Mean Time.",
  bangladeshConnection: "Bangladesh lies approximately between 88°E and 92°E, and its standard meridian is 90°E. This makes Earth's rotation directly relevant to Bangladesh Standard Time and the country's position in the global time system.",
  bcsPreli: ["15° of longitude corresponds to one hour; 1° corresponds to four minutes.", "Rotation is fastest at the Equator in linear velocity and effectively zero at the poles.", "Coriolis deflection is rightward in the Northern Hemisphere and leftward in the Southern Hemisphere."],
  writtenPoints: ["Explain rotation through the links between angular motion, time zones and apparent solar movement.", "Discuss its role in the direction of winds and ocean currents through Coriolis deflection.", "Distinguish rotation from revolution when explaining day-night cycles and seasons."],
  misconceptions: ["The main cause of seasons is not rotation; it is axial tilt combined with revolution around the Sun.", "The Coriolis effect does not create wind; it deflects moving air and water.", "The Sun appears to move east to west because Earth rotates west to east."],
  mcqPractice: [
    { question: "পৃথিবী নিজের অক্ষের চারদিকে কোন দিকে ঘোরে?", options: ["পূর্ব থেকে পশ্চিম", "পশ্চিম থেকে পূর্ব", "উত্তর থেকে দক্ষিণ", "দক্ষিণ থেকে উত্তর"], answer: "পশ্চিম থেকে পূর্ব", explanation: "Earth's rotation is west to east." },
    { question: "১৫° দ্রাঘিমার সময়ের পার্থক্য কত?", options: ["১৫ মিনিট", "৩০ মিনিট", "১ ঘণ্টা", "৪ ঘণ্টা"], answer: "১ ঘণ্টা", explanation: "360° divided by 24 hours gives 15° per hour." },
  ],
  geographyLink: "Longitude is a spatial expression of rotational time: places east of a reference meridian experience local noon earlier. The global time-zone system is therefore grounded in Earth's rotation.",
  quickRevision: ["West → east", "23 h 56 m 4 s sidereal day", "15° longitude = 1 hour", "Day/night + local time + Coriolis effect"],
});

const physicalTopics = [rotation, ...[
  ["Earth's Revolution", "earths-revolution", "Earth's annual orbit around the Sun and the geometry behind the seasons."], ["Latitude and Longitude", "latitude-and-longitude", "The coordinate framework used to locate places."], ["Seasons", "seasons", "Seasonal change caused by axial tilt and revolution."], ["Earth's Interior", "earths-interior", "The layered structure of the crust, mantle and core."], ["Plate Tectonics", "plate-tectonics", "The movement of lithospheric plates and its role in shaping Earth's surface."], ["Earthquakes", "earthquakes", "Sudden ground movement caused by released tectonic energy."], ["Volcanoes", "volcanoes", "Openings through which magma, gases and ash reach the surface."], ["Rocks", "rocks", "The three major rock groups and the rock cycle."], ["Weathering and Erosion", "weathering-and-erosion", "The breakdown and removal of material that reshape landscapes."], ["Atmosphere", "atmosphere", "The gaseous envelope supporting weather, climate and life."], ["Atmospheric Pressure", "atmospheric-pressure", "The force exerted by the weight of air."], ["Winds", "winds", "The horizontal movement of air from high to low pressure."], ["Ocean Currents", "ocean-currents", "Large-scale movements of seawater driven by wind, density and rotation."], ["Tides", "tides", "Periodic sea-level change produced mainly by lunar and solar gravity."],
].map(([title, slug, description]) => topic("Physical Geography", title, slug, description))];

const listCategory = (categoryName: string, entries: string[][], difficulty: Difficulty, examRelevance: string) => entries.map(([title, slug, description]) => topic(categoryName, title, slug, description, difficulty, examRelevance));

export const geographyCategories: GeographyCategory[] = [
  category("01", "physical-geography", "Physical Geography", "01 / Earth systems", "Landforms, climate, oceans and the living systems of the planet.", physicalTopics),
  category("02", "human-geography", "Human Geography", "02 / People & place", "Population, culture, cities, migration and the spatial identity of human life.", listCategory("Human Geography", [["Population Geography", "population-geography", "The spatial study of population size, structure, change and movement."], ["Population Density", "population-density", "The relationship between population and area."], ["Population Distribution", "population-distribution", "The uneven spatial pattern of people."], ["Migration", "migration", "The movement of people between places."], ["Urbanization", "urbanization", "The growth of urban populations and settlements."], ["Rural Settlement", "rural-settlement", "Rural settlement forms and functions."], ["Culture and Geography", "culture-and-geography", "How culture shapes and is shaped by place."], ["Human Development", "human-development", "Health, education, income and human capability."]], "Foundation", "High")),
  category("03", "economic-geography", "Economic Geography", "03 / Networks & resources", "Production, trade, resources and the geography of opportunity.", listCategory("Economic Geography", [["Agriculture", "agriculture", "The spatial organization of farming and food systems."], ["Industry", "industry", "The location and regional effects of industrial activity."], ["Resources", "resources", "Natural and human resources and their distribution."], ["Energy Geography", "energy-geography", "The production, movement and consumption of energy."], ["Transport Geography", "transport-geography", "Networks, accessibility and movement."], ["Trade Geography", "trade-geography", "The spatial pattern of exchange and markets."], ["Globalization", "globalization", "Worldwide economic, cultural and technological connections."]], "Intermediate", "High")),
  category("04", "environmental-geography", "Environmental Geography", "04 / Planetary balance", "Human impact, risk, conservation and sustainable futures.", listCategory("Environmental Geography", [["Ecosystem", "ecosystem", "Organisms interacting with their physical environment."], ["Biodiversity", "biodiversity", "The variety of genes, species and ecosystems."], ["Climate Change", "climate-change", "Long-term changes in climate patterns and consequences."], ["Global Warming", "global-warming", "Long-term rise in average surface temperature."], ["Environmental Pollution", "environmental-pollution", "Harmful substances or energy in the environment."], ["Natural Hazards", "natural-hazards", "Natural processes that threaten life and property."], ["Disaster Management", "disaster-management", "Preparedness, response, recovery and mitigation."], ["Sustainable Development", "sustainable-development", "Development meeting present needs without harming future generations."]], "Intermediate", "Very high")),
  category("05", "geography-of-bangladesh", "Geography of Bangladesh", "05 / A living delta", "The rivers, regions, settlements and systems of Bangladesh.", listCategory("Geography of Bangladesh", [["Location of Bangladesh", "location-of-bangladesh", "Bangladesh's position in South Asia and the Bay of Bengal."], ["Physiographic Divisions", "physiographic-divisions", "Major landform regions shaped by deposition and erosion."], ["Rivers of Bangladesh", "rivers-of-bangladesh", "The river network structuring Bangladesh's landscape and life."], ["Ganges-Brahmaputra-Meghna Basin", "ganges-brahmaputra-meghna-basin", "The transboundary basin behind the delta's water and sediment."], ["Climate of Bangladesh", "climate-of-bangladesh", "The monsoon climate and seasonal rhythm of Bangladesh."], ["Coastal Bangladesh", "coastal-bangladesh", "A low-lying zone shaped by tides, cyclones and salinity."], ["Sundarbans", "sundarbans", "The world's largest contiguous mangrove forest."], ["Haor and Wetland", "haor-and-wetland", "Seasonally flooded wetland basins."], ["Natural Resources of Bangladesh", "natural-resources-of-bangladesh", "Resources supporting Bangladesh's development."], ["Population Geography of Bangladesh", "population-geography-of-bangladesh", "Population concentration and demographic change."], ["Urbanization in Bangladesh", "urbanization-in-bangladesh", "The spatial transformation of Bangladeshi cities."], ["Climate Vulnerability of Bangladesh", "climate-vulnerability-of-bangladesh", "Exposure, sensitivity and adaptive capacity in a delta."]], "Intermediate", "Very high")),
];

export const allGeographyTopics = geographyCategories.flatMap((item) => item.topics);
export const geographyTopicsBySlug = Object.fromEntries(allGeographyTopics.map((item) => [item.slug, item])) as Record<string, GeographyTopic>;
export const geographyCategoriesBySlug = Object.fromEntries(geographyCategories.map((item) => [item.slug, item])) as Record<string, GeographyCategory>;
