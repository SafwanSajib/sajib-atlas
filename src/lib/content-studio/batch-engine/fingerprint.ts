import { createHash } from "node:crypto";
import type { StudioSourcePacketInput } from "../types";

export function sourceFingerprint(input: { sourceText?: string; sourcePacket?: StudioSourcePacketInput }): string {
  const sources = [...(input.sourcePacket?.sources ?? [])]
    .map((source) => ({
      id: source.id,
      title: source.title,
      publisherOrOrganization: source.publisherOrOrganization,
      reference: source.reference,
      type: source.type,
      excerpt: source.excerpt,
      accessedDate: source.accessedDate ?? "",
      citation: source.citation ?? "",
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const stable = JSON.stringify({
    sourceText: input.sourceText?.trim() ?? "",
    sources,
  });
  return createHash("sha256").update(stable).digest("hex");
}
