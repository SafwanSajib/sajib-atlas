import type { ContentSource } from "./content";
import type { MCQ } from "./assessment";

export type NormalizedTopic = ContentSource & {
  mcqs: MCQ[];
};
