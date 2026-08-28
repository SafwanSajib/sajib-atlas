import type { ContentSource } from "@/types/content";
import type { MCQ } from "@/types/assessment";

export const motionsOfEarth: ContentSource & { mcqs: MCQ[] } = {
  slug: "motions-of-earth",
  title: "পৃথিবীর গতি · Motions of the Earth",
  description: "A foundational geography topic connecting rotation, revolution, time, seasons, and Earth systems.",
  subject: "Geography",
  difficulty: "Foundation",
  banglaSummary: "পৃথিবীর আহ্নিক ও বার্ষিক গতি দিন-রাত্রি, স্থানীয় সময়, ঋতু এবং সূর্যের আপাত অবস্থানের পরিবর্তন ব্যাখ্যা করতে সাহায্য করে।",
  englishSummary: "Earth rotates on its axis and revolves around the Sun. Together with axial tilt, these motions explain day and night, time differences, seasons, and changes in the Sun's apparent position.",
  coreConcept: "Earth has two major motions relevant to elementary geography: rotation about its axis and revolution around the Sun. Axial tilt makes revolution seasonally important.",
  mechanism: "Rotation produces the daily cycle and longitude-based time differences. Revolution plus the approximately 23.5° axial tilt changes solar illumination through the year, producing seasons.",
  keyFacts: [
    "Earth rotates from west to east.",
    "A solar day is approximately 24 hours.",
    "Earth's axis is tilted about 23.5° from the perpendicular to its orbital plane.",
    "Earth completes one revolution in about 365.2422 days.",
    "15° of longitude corresponds to approximately one hour of local solar time."
  ],
  keyTerms: ["Rotation", "Revolution", "Axial tilt", "Solstice", "Equinox", "Local solar time"],
  examples: ["Day and night", "International time differences", "Seasonal change", "Changing noon Sun altitude"],
  misconceptions: [
    "Seasons are not caused simply by Earth being closer to or farther from the Sun.",
    "The 23.5° figure describes Earth's axial tilt, not the inclination of the equator to the orbital plane."
  ],
  bcsTraps: ["Rotation → day and night; Revolution + axial tilt → seasons.", "15° longitude ≈ 1 hour of local solar time."],
  writtenPoints: ["Explain the interaction of revolution and axial tilt in producing seasons.", "Relate longitude to local time using Earth's rotation."],
  geographyConnection: "Earth motions connect physical geography with cartography, climatology, astronomy, and time-zone systems.",
  relatedTopics: ["latitude-and-longitude", "seasons", "local-time-and-longitude"],
  quickRevision: ["Rotation = daily cycle", "Revolution = annual cycle", "23.5° tilt is essential to seasonal contrast", "15° longitude ≈ 1 hour"],
  mcqs: [
    { id: "earth-motion-1", question: "Which motion directly produces the daily cycle of day and night?", options: ["Rotation", "Revolution", "Precession", "Nutation"], answer: "Rotation", explanation: "Earth's rotation on its axis causes the regular alternation of the illuminated and dark sides." },
    { id: "earth-motion-2", question: "Approximately how much local solar time changes per 15° of longitude?", options: ["15 minutes", "30 minutes", "1 hour", "2 hours"], answer: "1 hour", explanation: "Earth rotates 360° in about 24 hours, so 15° corresponds to about one hour." }
  ]
};
