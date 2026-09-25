import type { StudioSourceInput, StudioSourcePacket, StudioSourcePacketInput, StudioTopicIdentity } from "./types";

const SOURCE_ID = /^source\/[a-z0-9-]+$/;
const PLACEHOLDER = /^(n\/a|na|none|todo|tbd|unknown|placeholder)$/i;

function fail(message: string): never {
  throw new Error(`Content Production Studio: ${message}`);
}

function normalizeText(value: string, label: string): string {
  const text = value.trim();
  if (!text) fail(`${label} is required`);
  return text;
}

function normalizeLocator(value: string): string {
  const reference = value.trim();
  if (!reference) fail("source reference/locator is required");
  if (PLACEHOLDER.test(reference)) fail("source reference/locator is a placeholder");
  if (/javascript:/i.test(reference)) fail("source reference/locator is invalid");
  try {
    const url = new URL(reference);
    if (url.protocol !== "http:" && url.protocol !== "https:") fail("source URL must use http or https");
    const host = url.hostname.toLowerCase();
    if (host === "example.com" || host.endsWith(".example.com") || host === "localhost") {
      fail("source locator looks invented");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Content Production Studio:")) throw error;
    fail("source reference/locator must be an absolute http(s) URL");
  }
  return reference;
}

function normalizeSource(input: StudioSourceInput): StudioSourceInput {
  const id = normalizeText(input.id, "source id");
  if (!SOURCE_ID.test(id)) fail("source id must match source/{slug}");
  return {
    id,
    title: normalizeText(input.title, "source title"),
    publisherOrOrganization: normalizeText(input.publisherOrOrganization, "source organization"),
    reference: normalizeLocator(input.reference),
    type: input.type,
    excerpt: normalizeText(input.excerpt, "source excerpt"),
    ...(input.accessedDate?.trim() ? { accessedDate: input.accessedDate.trim() } : {}),
    ...(input.citation?.trim() ? { citation: input.citation.trim() } : {}),
  };
}

export function buildStudioSourcePacket(input: StudioSourcePacketInput): StudioSourcePacket {
  if (!input || !Array.isArray(input.sources) || input.sources.length === 0) fail("source packet requires at least one source");
  const sources = input.sources.map(normalizeSource);
  const ids = new Set<string>();
  for (const source of sources) {
    if (ids.has(source.id)) fail(`duplicate source id ${source.id}`);
    ids.add(source.id);
  }
  return {
    sources: [...sources].sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function isStudioSourcePacketThin(packet: StudioSourcePacket): boolean {
  return packet.sources.length < 3;
}

export function isPacketVerifiedSource(packet: StudioSourcePacket, sourceId: string): boolean {
  return packet.sources.some((source) => source.id === sourceId);
}

export function sourcePacketToGenerationInput(packet: StudioSourcePacket, _identity: StudioTopicIdentity): {
  sourceText: string;
  sourceMetadata: StudioSourcePacket["sources"];
} {
  const blocks = packet.sources.map((source, index) =>
    [
      `[${index + 1}] id=${source.id}`,
      `title: ${source.title}`,
      `organization: ${source.publisherOrOrganization}`,
      `type: ${source.type}`,
      `reference: ${source.reference}`,
      source.citation ? `citation: ${source.citation}` : "",
      "EXCERPT:",
      source.excerpt,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return {
    sourceText: ["SOURCE PACKET (authoritative, ordered):", ...blocks].join("\n\n"),
    sourceMetadata: packet.sources,
  };
}
