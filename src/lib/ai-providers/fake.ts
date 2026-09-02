/**
 * Deterministic fake providers for routing verification. No network.
 */

import type { AiProviderInput } from "@/lib/ai-intelligence/provider";
import type { AiProviderFailureCategory, AiProviderId, ClassifiedAiProvider, ClassifiedAiProviderOutput } from "./types";

export type FakeProviderBehavior =
  | "success"
  | "rate_limited"
  | "timeout"
  | "network"
  | "upstream"
  | "authentication"
  | "configuration"
  | "invalid_request"
  | "policy_blocked"
  | "malformed_response"
  | "failure";

export type FakeProviderRecorder = {
  calls: number;
  inputs: AiProviderInput[];
};

const BEHAVIOR: Record<Exclude<FakeProviderBehavior, "success">, { status: ClassifiedAiProviderOutput["status"]; category: AiProviderFailureCategory; text: string }> = {
  rate_limited: { status: "failed", category: "rate_limited", text: "The AI provider rate-limited the request." },
  timeout: { status: "failed", category: "timeout", text: "The AI provider timed out." },
  network: { status: "failed", category: "network", text: "The AI provider is unavailable." },
  upstream: { status: "failed", category: "upstream", text: "The AI provider is unavailable." },
  authentication: { status: "failed", category: "authentication", text: "The AI provider rejected authentication." },
  configuration: { status: "failed", category: "configuration", text: "The AI provider is not configured." },
  invalid_request: { status: "failed", category: "invalid_request", text: "The AI provider rejected the request." },
  policy_blocked: { status: "blocked", category: "policy_blocked", text: "The AI provider blocked this request." },
  malformed_response: { status: "failed", category: "malformed_response", text: "The AI provider returned a malformed response." },
  failure: { status: "failed", category: "unknown", text: "The AI provider is unavailable." },
};

export function createFakeAiProvider(
  id: AiProviderId,
  behavior: FakeProviderBehavior,
  recorder: FakeProviderRecorder = { calls: 0, inputs: [] },
): ClassifiedAiProvider {
  return {
    id,
    async complete(input) {
      recorder.calls += 1;
      recorder.inputs.push(input);
      if (behavior === "success") {
        return { status: "success", text: `${id} grounded explanation.` };
      }
      const mapped = BEHAVIOR[behavior];
      return { status: mapped.status, text: mapped.text, failureCategory: mapped.category };
    },
  };
}
