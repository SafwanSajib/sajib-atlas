import type { Metadata } from "next";

import AiAskPanel from "@/components/ai/AiAskPanel";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { getConcept } from "@/lib/knowledge/concepts";
import { getCanonicalTopic } from "@/lib/content/manifest";
import { isAiAnswerStyle, isAiIntent } from "@/lib/ai-intelligence/validate";
import { isPrimaryProviderConfigured } from "@/lib/ai-providers/routing-config";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask a grounded question about Sajib Atlas knowledge. Answers are retrieved from canonical topics and concepts, not an unrestricted chatbot.",
};

export const maxDuration = 30;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const topicId = firstParam(params.topic);
  const conceptId = firstParam(params.concept);
  const intentParam = firstParam(params.intent);
  const styleParam = firstParam(params.style);
  const topic = topicId ? getCanonicalTopic(topicId) : undefined;
  const concept = conceptId ? getConcept(conceptId) : undefined;
  const available = isPrimaryProviderConfigured(process.env);

  return (
    <main>
      <Navbar />
      <div className="section shell ai-page">
        <p className="eyebrow">Grounded knowledge assistant</p>
        <h1>
          Ask <em>Sajib Atlas.</em>
        </h1>
        <p className="page-description">
          This assistant answers from Sajib Atlas canonical knowledge. It can
          explain topics and concepts using canonical identities. It is not a
          general chatbot, does not browse the web, does not remember previous
          questions, and does not score assessments.
        </p>
        {topic ? (
          <p className="ai-context-note">
            Asking about topic <strong>{topic.title}</strong>
          </p>
        ) : null}
        {concept ? (
          <p className="ai-context-note">
            Asking about concept <strong>{concept.title}</strong>
          </p>
        ) : null}
        <AiAskPanel
          available={available}
          topicId={topic?.id}
          conceptId={concept?.id}
          defaultIntent={
            intentParam && isAiIntent(intentParam)
              ? intentParam
              : concept
                ? "explain-concept"
                : topic
                  ? "explain-topic"
                  : "knowledge-answer"
          }
          defaultStyle={styleParam && isAiAnswerStyle(styleParam) ? styleParam : "standard"}
        />
      </div>
      <Footer />
    </main>
  );
}
