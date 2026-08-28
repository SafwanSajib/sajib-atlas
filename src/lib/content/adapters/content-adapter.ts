import type { NormalizedTopic } from "@/types/topic";
import { getAllTopics, getTopic } from "@/lib/content/loaders/static-loader";

export interface ContentAdapter {
  getTopic(slug: string): Promise<NormalizedTopic | undefined>;
  getAllTopics(): Promise<NormalizedTopic[]>;
}

export const staticContentAdapter: ContentAdapter = {
  async getTopic(slug) { return getTopic(slug); },
  async getAllTopics() { return getAllTopics(); },
};
