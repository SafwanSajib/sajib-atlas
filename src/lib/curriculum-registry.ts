export type ContentStatus = "available" | "partial" | "planned";

export type CurriculumItem = {
  slug: string;
  title: string;
  subject: string;
  category: string;
  contentStatus: ContentStatus;
};

export const curriculumRegistry: CurriculumItem[] = [
  // Geography
  { slug: "earths-rotation", title: "Earth's Rotation", subject: "geography", category: "physical", contentStatus: "available" },
  { slug: "earths-revolution", title: "Earth's Revolution", subject: "geography", category: "physical", contentStatus: "available" },
  { slug: "latitude-and-longitude", title: "Latitude and Longitude", subject: "geography", category: "physical", contentStatus: "available" },
  { slug: "earths-interior", title: "Earth's Interior", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "plate-tectonics", title: "Plate Tectonics", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "earthquakes", title: "Earthquakes", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "volcanoes", title: "Volcanoes", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "rocks", title: "Rocks", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "weathering-and-erosion", title: "Weathering and Erosion", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "atmosphere", title: "Atmosphere", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "atmospheric-pressure", title: "Atmospheric Pressure", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "winds", title: "Winds", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "ocean-currents", title: "Ocean Currents", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "tides", title: "Tides", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "population-geography", title: "Population Geography", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "population-density", title: "Population Density", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "population-distribution", title: "Population Distribution", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "migration", title: "Migration", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "urbanization", title: "Urbanization", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "rural-settlement", title: "Rural Settlement", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "culture-and-geography", title: "Culture and Geography", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "human-development", title: "Human Development", subject: "geography", category: "human-geography", contentStatus: "available" },

  { slug: "agriculture", title: "Agriculture", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "industry", title: "Industry", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "resources", title: "Resources", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "energy-geography", title: "Energy Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "transport-geography", title: "Transport Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "trade-geography", title: "Trade Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "globalization", title: "Globalization", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "ecosystem", title: "Ecosystem", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "biodiversity", title: "Biodiversity", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "climate-change", title: "Climate Change", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "global-warming", title: "Global Warming", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "environmental-pollution", title: "Environmental Pollution", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "natural-hazards", title: "Natural Hazards", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "disaster-management", title: "Disaster Management", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "sustainable-development", title: "Sustainable Development", subject: "geography", category: "environmental-geography", contentStatus: "available" },

  { slug: "location-of-bangladesh", title: "Location of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "physiographic-divisions", title: "Physiographic Divisions", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "rivers-of-bangladesh", title: "Rivers of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "ganges-brahmaputra-meghna-basin", title: "Ganges-Brahmaputra-Meghna Basin", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "climate-of-bangladesh", title: "Climate of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "coastal-bangladesh", title: "Coastal Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "sundarbans", title: "Sundarbans", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "haor-and-wetland", title: "Haor and Wetland", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "natural-resources-of-bangladesh", title: "Natural Resources of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "population-geography-of-bangladesh", title: "Population Geography of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "urbanization-in-bangladesh", title: "Urbanization in Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "climate-vulnerability-of-bangladesh", title: "Climate Vulnerability of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },

  { slug: "bangladesh-affairs", title: "Bangladesh Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "international-affairs", title: "International Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "geography-environment", title: "Geography & Environment", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "english", title: "English", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "bangla", title: "Bangla", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "science-ict", title: "Science & ICT", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "ethics-governance", title: "Ethics & Governance", subject: "bcs", category: "core", contentStatus: "partial" },

  { slug: "grammar", title: "Grammar", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "vocabulary", title: "Vocabulary", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "literature-english", title: "Literature", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "ielts", title: "IELTS", subject: "english", category: "core", contentStatus: "partial" },



  { slug: "earths-interior", title: "Earth's Interior", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "plate-tectonics", title: "Plate Tectonics", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "earthquakes", title: "Earthquakes", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "volcanoes", title: "Volcanoes", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "rocks", title: "Rocks", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "weathering-and-erosion", title: "Weathering and Erosion", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "atmosphere", title: "Atmosphere", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "atmospheric-pressure", title: "Atmospheric Pressure", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "winds", title: "Winds", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "ocean-currents", title: "Ocean Currents", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "tides", title: "Tides", subject: "geography", category: "physical-geography", contentStatus: "available" },
  { slug: "population-geography", title: "Population Geography", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "population-density", title: "Population Density", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "population-distribution", title: "Population Distribution", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "migration", title: "Migration", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "urbanization", title: "Urbanization", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "rural-settlement", title: "Rural Settlement", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "culture-and-geography", title: "Culture and Geography", subject: "geography", category: "human-geography", contentStatus: "available" },
  { slug: "human-development", title: "Human Development", subject: "geography", category: "human-geography", contentStatus: "available" },

  { slug: "agriculture", title: "Agriculture", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "industry", title: "Industry", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "resources", title: "Resources", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "energy-geography", title: "Energy Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "transport-geography", title: "Transport Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "trade-geography", title: "Trade Geography", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "globalization", title: "Globalization", subject: "geography", category: "economic-geography", contentStatus: "available" },
  { slug: "ecosystem", title: "Ecosystem", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "biodiversity", title: "Biodiversity", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "climate-change", title: "Climate Change", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "global-warming", title: "Global Warming", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "environmental-pollution", title: "Environmental Pollution", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "natural-hazards", title: "Natural Hazards", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "disaster-management", title: "Disaster Management", subject: "geography", category: "environmental-geography", contentStatus: "available" },
  { slug: "sustainable-development", title: "Sustainable Development", subject: "geography", category: "environmental-geography", contentStatus: "available" },

  { slug: "location-of-bangladesh", title: "Location of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "physiographic-divisions", title: "Physiographic Divisions", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "rivers-of-bangladesh", title: "Rivers of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "ganges-brahmaputra-meghna-basin", title: "Ganges-Brahmaputra-Meghna Basin", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "climate-of-bangladesh", title: "Climate of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "coastal-bangladesh", title: "Coastal Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "sundarbans", title: "Sundarbans", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "haor-and-wetland", title: "Haor and Wetland", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "natural-resources-of-bangladesh", title: "Natural Resources of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "population-geography-of-bangladesh", title: "Population Geography of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "urbanization-in-bangladesh", title: "Urbanization in Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },
  { slug: "climate-vulnerability-of-bangladesh", title: "Climate Vulnerability of Bangladesh", subject: "geography", category: "geography-of-bangladesh", contentStatus: "available" },

  { slug: "bangladesh-affairs", title: "Bangladesh Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "international-affairs", title: "International Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "geography-environment", title: "Geography & Environment", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "english", title: "English", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "bangla", title: "Bangla", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "science-ict", title: "Science & ICT", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "ethics-governance", title: "Ethics & Governance", subject: "bcs", category: "core", contentStatus: "partial" },

  { slug: "grammar", title: "Grammar", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "vocabulary", title: "Vocabulary", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "literature", title: "Literature", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "ielts", title: "IELTS", subject: "english", category: "core", contentStatus: "partial" },



  { slug: "seasons", title: "Seasons", subject: "geography", category: "physical", contentStatus: "available" },
  { slug: "urbanization", title: "Urbanization", subject: "geography", category: "human", contentStatus: "available" },
  { slug: "migration", title: "Migration", subject: "geography", category: "human", contentStatus: "available" },
  { slug: "rural-settlement", title: "Rural Settlement", subject: "geography", category: "human", contentStatus: "available" },

  // BCS
  { slug: "bangladesh-affairs", title: "Bangladesh Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "international-affairs", title: "International Affairs", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "geography-environment", title: "Geography & Environment", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "english", title: "English", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "bangla", title: "Bangla", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "science-ict", title: "Science & ICT", subject: "bcs", category: "core", contentStatus: "partial" },
  { slug: "ethics-governance", title: "Ethics & Governance", subject: "bcs", category: "core", contentStatus: "partial" },

  // English
  { slug: "grammar", title: "Grammar", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "vocabulary", title: "Vocabulary", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "literature", title: "Literature", subject: "english", category: "core", contentStatus: "partial" },
  { slug: "ielts", title: "IELTS", subject: "english", category: "core", contentStatus: "partial" },
];

export const getCurriculumBySlug = (slug: string) => curriculumRegistry.find((item) => item.slug === slug);
export const getCurriculumBySubject = (subject: string) => curriculumRegistry.filter((item) => item.subject === subject);
export const getAvailableCurriculum = () => curriculumRegistry.filter((item) => item.contentStatus === "available");
