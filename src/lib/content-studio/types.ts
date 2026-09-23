import type { PilotSource } from "@/lib/content/pilot/index";
import type { ProductionRecord } from "@/lib/content/production/index";
import type { ReviewProjection } from "@/lib/content/review/index";

export const STUDIO_STORAGE_KEY = "sajib_atlas_content_studio_drafts";
export const STUDIO_MAX_SOURCE_CHARS = 80000;
export const STUDIO_MAX_OUTPUT_TOKENS = 8192;
export const STUDIO_TIMEOUT_MS = 60000;
/** Page/server-action budget: primary timeout + router fallback + overhead. */
export const STUDIO_ACTION_MAX_DURATION_SECONDS = 150;

export type StudioSourceMetadata = {
  title: string;
  publisherOrOrganization?: string;
  reference?: string;
  type?: PilotSource["type"];
  citation?: string;
};

export type StudioSourceInput = {
  id: string;
  title: string;
  publisherOrOrganization: string;
  reference: string;
  type: PilotSource["type"];
  excerpt: string;
  accessedDate?: string;
  citation?: string;
};

export type StudioSourcePacketInput = {
  sources: readonly StudioSourceInput[];
};

export type StudioSourcePacket = {
  sources: readonly StudioSourceInput[];
};

export type StudioTopicIdentityInput = {
  subjectSlug: string;
  title: string;
  topicSlug?: string;
  disciplineSlug?: string;
  summary?: string;
  sourceMetadata?: readonly StudioSourceMetadata[];
};

export type StudioTopicIdentity = {
  topicId: string;
  subjectId: string;
  disciplineId: string;
  subjectSlug: string;
  topicSlug: string;
  title: string;
  summary: string;
};

export type StudioUsageMetadata = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type StudioProviderAttempt = {
  attempt: number;
  outcome: string;
  status?: number;
  finishReason?: string;
};

export type StudioProviderTrace = {
  provider: string;
  attempts: number;
  retryOccurred: boolean;
  attemptsDetail: readonly StudioProviderAttempt[];
};

export type StudioFailureCode =
  | "invalid_identity"
  | "invalid_source"
  | "provider_failure"
  | "parse_failure"
  | "unavailable";

export type StudioFailure = {
  ok: false;
  error: { code: StudioFailureCode; message: string };
  identity?: StudioTopicIdentity;
  attempts?: number;
  rawText?: string;
  providerTrace?: StudioProviderTrace;
};

export type StudioPipelineSuccess = {
  ok: true;
  identity: StudioTopicIdentity;
  record: ProductionRecord;
  preview: ReviewProjection;
  attempts: number;
  usage?: StudioUsageMetadata;
  providerTrace?: StudioProviderTrace;
};

export type StudioPipelineResult = StudioPipelineSuccess | StudioFailure;

export type StudioBatchItemInput = {
  id: string;
  identity: StudioTopicIdentityInput;
  sourceText: string;
};

export type StudioBatchItemResult = {
  id: string;
  result: StudioPipelineResult;
};

export type StudioPersistedDraft = {
  savedAt: string;
  identity: StudioTopicIdentity;
  record: ProductionRecord;
};

export type StudioLibraryEntry = {
  topicId: string;
  title: string;
  subjectId: string;
  contentVersion: number;
  savedAt: string;
  workflowState: ProductionRecord["workflowState"];
  qualityStatus: string;
};

export type StudioKeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};
