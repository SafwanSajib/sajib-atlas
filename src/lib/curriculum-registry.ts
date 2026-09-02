/**
 * Curriculum projection over canonical knowledge.
 *
 * Topic identity lives in src/lib/content/manifest.ts.
 * Discipline/subject/category live in src/lib/knowledge/.
 * Concept identity lives in src/lib/knowledge/concepts.ts.
 * Content metadata/version lives on CanonicalTopic.contentMetadata.
 * Assessment-set identity lives in src/lib/assessment/sets.ts.
 * Read contracts live in src/lib/contracts/ and project those catalogs.
 * This module does not maintain a second catalog. It preserves Phase 0A
 * names for curriculum-oriented imports.
 *
 * Flow: knowledge catalog → canonical topics → curriculum aliases → learner.
 * Geography study/MCQ payload remains in geography-data.ts.
 */
export {
  type ContentStatus,
  type CanonicalTopic as CurriculumItem,
  canonicalIdentityKey as curriculumIdentityKey,
  contentManifest as curriculumRegistry,
  getCanonicalTopicBySlug as getCurriculumBySlug,
  getCanonicalTopicsBySubject as getCurriculumBySubject,
  getAvailableCanonicalTopics as getAvailableCurriculum,
} from "@/lib/content/manifest";
