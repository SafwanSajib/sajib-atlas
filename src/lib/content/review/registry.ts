import { createProductionDraft, evaluateProductionQuality } from "@/lib/content/production/index";
import { geographyWaterCycleProductionPackage } from "@/lib/content/production/index";
import { geographyLatitudeLongitudeProductionPackage } from "@/lib/content/production/index";
import { geographyAtmosphereProductionPackage } from "@/lib/content/production/index";
import { geographyPlateTectonicsProductionPackage } from "@/lib/content/production/index";
import { pilotPackages } from "@/lib/content/pilot/index";
import type { ProductionRecord } from "@/lib/content/production/index";

const localRecords: ProductionRecord[] = [geographyWaterCycleProductionPackage, geographyLatitudeLongitudeProductionPackage, geographyAtmosphereProductionPackage, geographyPlateTectonicsProductionPackage, ...pilotPackages.filter((pkg) => !["topic/geography/water-cycle", "topic/geography/latitude-and-longitude", "topic/geography/atmosphere", "topic/geography/plate-tectonics"].includes(pkg.topic.id))]
  .map((pkg) => evaluateProductionQuality(createProductionDraft(pkg)))
  .sort((a, b) => a.content.topic.id.localeCompare(b.content.topic.id));

export function replaceReviewRecord(topicId: string, next: ProductionRecord): void {
  if (next.content.topic.id !== topicId) {
    throw new Error("Canonical content production: review record identity mismatch");
  }
  const index = localRecords.findIndex((record) => record.content.topic.id === topicId);
  if (index < 0) throw new Error("Canonical content production: unknown review record");
  localRecords[index] = next;
}

export function getReviewRecords(): readonly ProductionRecord[] {
  return localRecords;
}

export function getReviewRecord(topicId: string): ProductionRecord | undefined {
  return localRecords.find((record) => record.content.topic.id === topicId);
}
