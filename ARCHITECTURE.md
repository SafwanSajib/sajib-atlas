# SAJIB ATLAS — DOCUMENT CONTROL

**Architecture Baseline:** V10.6  
**Master Vision:** `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`  
**Document Set:** V10.6  
**Status:** Active / synchronized  
**Repository:** Implementation source of truth  
**Authority Rule:** Repository/runtime/test evidence overrides strategic assumptions.

> This document is part of the V10.6 documentation constitution. If a document
conflicts with the Master Vision, the conflict must be resolved explicitly and
the affected documents must be synchronized. Do not silently maintain divergent
versions.

# ARCHITECTURE.md — V10.6 PLATFORM ARCHITECTURE

## 1. Target Model

```text
WEB / ANDROID / iOS
        ↓
EXPERIENCE LAYER
        ↓
DOMAIN PLATFORM
        ↓
INTELLIGENCE
        ↓
PLATFORM SERVICES
        ↓
DATA
        ↓
INFRASTRUCTURE
```

## 2. Experience Layer

- Study
- Practice
- Mock
- Research
- AI
- Community
- Creator
- Institution
- Commerce

## 3. Domain Layer

```text
identity
knowledge
taxonomy
assessment
learning
progress
personalization
search
ai
commerce
entitlements
research
resources
creator
institution
community
growth
analytics
notifications
```

## 4. Knowledge Model

```text
Discipline
  → Subject
    → Topic
      → Concept
        → Theory
          → Application
            → Question
            → Resource
            → Source
```

Canonical knowledge should be addressable independently of exam context.

Phase 1A–1J implemented subset (not the full graph):

```text
Discipline → Subject → Category → Topic → Concept
                                              ↓
                                    Content Metadata
                                    (version, lifecycle, provenance)
                                              ↓
                                    Assessment Set Identity
                                    (mcq-practice)
                                              ↓
                                    Educational / MCQ payload
```

Contracts live in `src/lib/knowledge/`. Topic identity remains
`${subjectId}/${slug}` in `src/lib/content/manifest.ts`. Concept identity is
topic-bound (`${topicId}/${slug}`) in `src/lib/knowledge/concepts.ts`. Canonical
topics expose `conceptIds` as identity references, not embedded Concept
objects. A topic may have zero or more concepts. Phase 1B seeds Earth's
Rotation only.

Phase 1C adds `contentMetadata` on each canonical topic: integer `version`
(not part of topic id), `lifecycle` (`draft | published | archived`), and
optional `sourceId` into a repository-module provenance catalog. `contentStatus`
remains payload completeness.

Phase 1D adds `assessmentSetIds` on canonical topics. Assessment Set identity
is `${topicId}/${kind}` in `src/lib/assessment/`. Kind is `mcq-practice`.
The set points at `geography-data.ts` `sections.mcqPractice` and does not
copy questions. Question `id` is not implemented. Educational payload stays
outside the identity layer.

Phase 1E adds a TypeScript-only read projection in `src/lib/contracts/`.
Consumers can traverse Discipline → Assessment Set through JSON-safe read
models derived from the canonical catalogs. No HTTP API, no second registry,
no CMS or revision history.

Phase 1F adds an analytics event identity contract in `src/lib/analytics/`.
Events reference canonical topic / assessment-set / concept ids. They are
not collected. Knowledge read contracts stay independent of analytics.
No analytics provider or pipeline.

Phase 1G adds learner profile and goal identity in `src/lib/learner/`.
The local learner id is `learner/local`. Goals reference subject, topic, or
assessment-set ids. Profile/goals are not completion storage and are not
analytics events. Phase 7A owns canonical learner identity; profile
consumes it. No authentication or profile service.

Phase 1H adds entitlement identity in `src/lib/entitlement/`. Entitlement is
access, not purchase or payment. Current catalog content is free. No paywall
or payment provider.

Phase 1I adds commerce order identity in `src/lib/commerce/`. An order is a
commercial record, not a payment and not an entitlement. Product catalog and
pricing are deferred. No checkout.

Phase 1J adds a TypeScript-only unified platform read contract in
`src/lib/contracts/api.ts`. It composes existing 1E read models into future
API response shapes (topic response, collections, queries, errors, result
envelope). Canonical catalogs remain the source of truth. No HTTP, no
`/api` routes, and no second registry. `geography-data.ts` is an internal
payload location, not a public API. Knowledge, learner, analytics,
entitlement, and commerce stay separate domain boundaries.

```text
Canonical Domain Catalogs
        ↓
Existing Read Contracts (Phase 1E)
        ↓
Unified Platform Read Contract (Phase 1J)
        ↓
Future HTTP / API Transport (not implemented)
```

Phase 2 adds a Universal Topic Engine in `src/lib/topic-engine/`. It is a
domain orchestration layer over the catalogs and read contracts, not a
second topic registry and not Geography-specific.

```text
Canonical Knowledge / Content Identity
        ↓
Existing Phase 1 Contracts
        ↓
Universal Topic Engine
        ↓
Future Web / API / Mobile / AI consumers
```

The engine resolves topics, inspects identity existence, derives
lifecycle/state, discovers study / concepts / assessment / completion /
revision / search capability availability, composes a JSON-safe topic
record, and exposes category navigation. Capabilities describe
availability and do not execute features. Identity absence is not payload
incompleteness. It does not copy study paragraphs or MCQ arrays. Payload
remains in `geography-data.ts` / `knowledge-data.ts`.

Phase 3A adds Assessment Engine **contracts** in
`src/lib/assessment-engine/`. Topic Engine discovers assessment
capability; these contracts describe delivery, response, session, and
result shapes. They do not load payload, score, or persist. Assessment-set
identity remains `src/lib/assessment/`. MCQ arrays remain in
`geography-data.ts`. Public delivery does not include `answer` or payload
pointers.

Phase 3B adds a pure universal MCQ **scoring boundary** in
`src/lib/assessment-engine/scoring.ts`. Correctness remains
`selectedOption === question.answer`. Set-level scoring produces
result-compatible totals (`total`, `answered`, `correct`, `incorrect`,
`unanswered`, `score`, `percentage`) and public `McqQuestionOutcome`
rows. `null` is unanswered, not incorrect. Duplicate responses, invalid
option strings, and mixed content versions fail deterministically. The
correct answer is a scoring-only input and is omitted from public
outcomes/results. The scorer does not import Geography payload, React,
learner persistence, analytics, entitlement, or commerce. Legacy UI
scoring remains `src/lib/assessment/scoring.ts`.

Phase 3C adds a universal MCQ **payload adapter** in
`src/lib/assessment-engine/payload-adapter.ts`. It is the only Assessment
Engine module allowed to import `geography-data.ts`. It reads the Phase 1D
AssessmentSet payload pointer (`module` + `field`) and produces internal
`ScoringMcqQuestion` rows. Canonical MCQ arrays are not copied, shuffled,
or given eternal ids. `contentVersion` is supplied by the caller.
`toMcqDeliveryQuestion` strips `answer` and payload pointers for public
delivery. The adapter does not score, create sessions, persist, or change
the existing Geography UI.

Phase 3D adds universal MCQ **delivery** in
`src/lib/assessment-engine/delivery.ts`. It composes Phase 1D set identity,
Phase 3A `AssessmentDelivery`, Phase 3C adaptation, and the public
`McqDeliveryQuestion` conversion. Mode is `practice`. Delivery does not
import Geography payload, score, create sessions, or change the UI.
Public questions omit `answer`, explanation, and payload pointers.

Phase 3E adds an in-memory **session lifecycle** in
`src/lib/assessment-engine/session.ts`. A session is execution state:
opaque `sessionId`, practice mode, `in-progress` → `completed` or
`abandoned`. Responses are replaced by question key while in-progress.
Completion reuses Phase 3B scoring; the session does not import Geography
payload or persist. Completed and abandoned sessions are terminal. Session
identity is distinct from learner identity. No UI, analytics, or API
integration.

Phase 3F adds the canonical **result/outcome boundary** in
`src/lib/assessment-engine/result.ts`. It attaches session identity to a
Phase 3B score and validates totals and outcomes. `status` is
`completed`. Public outcomes omit `answer`, explanation, and payload
pointers. The boundary does not rescore, persist, or compute mastery,
weakness, or recommendations. Phase 3E completion uses this constructor.

Phase 3G is a **validation gate** (`verify-engine.ts`) over that chain. It
does not add a runtime Assessment Engine API. It proves identity, payload
single-source, scoring, session, result, leakage, JSON, and domain-boundary
invariants. Only MCQ is implemented. UI, persistence, analytics, and HTTP
remain deferred.

Phase 3H is the **integration gate**. The Assessment Engine is a coherent
MCQ domain boundary: Phase 1D set identity, adapter-owned Geography access,
answer-safe delivery/result, in-memory session lifecycle, and exact
`selectedOption === question.answer` scoring. It is JSON-safe and free of
React, browser storage, learner persistence, analytics emission, and
HTTP. Legacy `MCQPractice.tsx` remains on `src/lib/assessment/scoring.ts`.
Future UI, API, and mobile consumers are deferred.

Phase 4 adds **Learner Intelligence** in `src/lib/learner-intelligence/`.
It consumes completed `AssessmentResult` facts and derives topic progress,
assessment performance, weighted accuracy, and performance states
(`not-started` / `active` / `developing` / `strong`). It does not rescore,
does not replace `completedTopics`, and does not emit analytics. Persistence
is an additive optional `intelligence` field on existing local-first learner
state. No AI, HTTP, or UI.

Phase 4B is the **Learner Intelligence integration gate**. It validates
that intelligence consumes Assessment Engine results, remains local-first
and deterministic, preserves `mcqResults`/`completedTopics`, and stays
separate from analytics, entitlement, commerce, AI, and UI.

Phase 5 adds **Search & Knowledge Retrieval** in `src/lib/search/`.
Canonical catalogs are projected into JSON-safe `SearchDocument` values
(subject, category, topic, concept, assessment_set). Queries are normalized
(whitespace/case only) and matched lexically against title, keywords,
searchText, and canonical identifiers. Ranking uses explicit field weights
with canonical `id` as the stable tie-breaker. Empty queries return no
results. `searchSchemaVersion` is 1 and is not content version. Existing
`searchTopics` remains the UI-compatible topic substring helper. Topic
Engine does not own ranking. No embeddings, vector DB, HTTP, or AI.

Phase 6A adds **AI Intelligence Foundation** in `src/lib/ai-intelligence/`.
AI is a replaceable intelligence layer over Search, Assessment Engine, and
Learner Intelligence. It consumes structured `AiContext` (including Phase 5
search projections), never scans Geography payload, never scores, and never
mutates learner state. A provider-agnostic `AiProvider` interface exists;
no vendor SDK, RAG, chat UI, or `/api/ai` is implemented. Grounding
references are distinct from generated output. Content version is recorded
from canonical sources, not owned by AI.

Phase 6B adds a **single server-only xAI/Grok provider adapter** in
`src/lib/ai-providers/xai/`. Core AI contracts stay provider-agnostic.
Grounded answering retrieves through Phase 5 first; insufficient retrieval
returns `insufficient_context` without calling the model. Prompt construction
is isolated and treats retrieved text as DATA. Credentials use `XAI_API_KEY`
and must not use `NEXT_PUBLIC_*`. No chat UI, public AI route, RAG, or
conversation memory.

Phase 6C adds **grounded AI experience and RAG readiness**. AI retrieves
through a `KnowledgeRetriever` interface whose first implementation adapts
Phase 5 lexical search. Context assembly deduplicates by canonical id,
orders by Phase 5 score, and enforces source budgets. Grounding states
(`grounded` / `weakly-grounded` / `insufficient-context`) come from
retrieval policy, not model confidence. Prompt construction separates
`<USER_REQUEST>` from `<RETRIEVED_KNOWLEDGE>`. Answer styles include
`exam-focused`. Vector retrieval, web search, memory, agents, AI UI, and
`/api/ai` remain future work.

Phase 6D adds a **grounded Ask experience** at `/ai`. The browser talks
only to a platform boundary (Server Action and thin POST `/ai/ask`). That
boundary validates a public JSON-safe contract, then calls the AI
experience application service, which invokes AI Intelligence. The
provider adapter is bound on the server; the route contains no xAI fetch.
Topic and concept context use canonical ids. Client-supplied assessment
results are rejected. Learner context is a read-only projection. The UI
shows the answer, a retrieval grounding badge, and canonical source
hrefs. Insufficient context is a distinct state and does not call the
provider. There is no `/chat`, no `/api/ai`, no conversation memory, no
agents, no vector RAG, and no direct browser access to the provider.

Phase 6E adds **multi-provider routing**. Gemini (`gemini-2.5-flash`) is
the default primary; xAI is an eligible-only fallback. A provider router
classifies failures and may make at most one fallback call for transient
errors. Authentication, configuration, invalid request, and policy blocks
do not fallback. Retrieval and the grounding gate still run before any
provider call. The public AI experience remains provider-neutral.

Phase 7A adds **Identity Foundation** in `src/lib/identity/`. Canonical
learner identity is owned by identity, then consumed by LearnerProfile,
goals, and Learner Intelligence. Local identity remains `learner/local`.
Authentication, sessions, JWT, login UI, and identity providers are not
implemented. Authenticated (`learner/{opaque-id}`) and external provider
references are structural only. External identity is not canonical
learner identity. Public identity reads expose `learnerId`, `mode`, and
`status` only.

```text
Authentication Provider (not implemented)
        ↓
Authentication Result
        ↓
Identity Resolution
        ↓
Canonical Learner Identity  (learner/local)
        ↓
Learner Profile / Goals / Intelligence
```

Phase 7B adds **Entitlement & Access Foundation** in
`src/lib/entitlement/`. Access is:

```text
Resource → Classification → Entitlement Evaluation → Access Decision
```

Catalog subjects, topics, and assessment sets remain public (`free`).
Features are protected and fail closed. Matching is exact scope +
targetId. `startsAt`/`expiresAt` are inclusive and evaluated with an
injectable clock. Learner ownership uses canonical `learnerId` only.
Payment/purchase state does not grant access. The future chain is
Product → Order → Purchase → Entitlement → Access; 7B stops at
Entitlement → Access.

Phase 7C adds **Commerce Foundation** in `src/lib/commerce/`.

```text
Product → Order → Purchase → Entitlement Grant Proposal → Entitlement → Access
Order → Payment   (supports the order; never grants access)
```

Product, Order, Purchase, and Payment are separate identities. Phase 1I
order vocabulary is preserved (`pending | confirmed | cancelled |
failed`). A completed purchase of a confirmed order may produce a Phase
7B entitlement proposal. Captured payment cannot produce
`allowed: true`. Entitlement remains the access authority.

Phase 7D is the **Identity / Entitlement / Commerce integration gate**.
It does not add a domain. It confirms:

```text
Identity → Learner
Commerce → Entitlement proposal → Entitlement → Access
Payment ↛ Access
```

`entitlementFromGrantProposal` materializes a canonical Entitlement from
a proposal. It does not persist. Topic Engine, Assessment Engine, Search,
and AI are not authorization authorities.

Phase 8A **designs** a thin Platform Foundation over Phase 1J. It is not
implemented. Web, Android, and iOS are future clients of one contract.
Business logic stays in existing engines.

```text
WEB / ANDROID / iOS
        ↓
Platform Contract  (envelope, client surface, version, error, page, capabilities)
        ↓
Domain Contracts   (Phase 1E / 1J / 7A–7C)
        ↓
Existing Engines
```

Client surface (`web` | `android` | `ios` | `api`) is not learner
identity. Canonical learner remains `learner/local`. Authentication is
not implemented. HTTP `/api/v1`, mobile apps, and databases are not
part of 8A. Notes: `docs/PLATFORM.md`. Phase 8B implements TypeScript contracts in
`src/lib/platform/`. Phase 8C adds thin GET `/api/v1` transport
(capabilities, identity, topics). Phase 8D hardens version, envelope,
pagination, and fail-closed access. There is no `/api/ai`. Phase 8E is
the integration gate (`npm run verify:phase8`). Phase 8 foundation is
closed. Phase 9A designs the Web/Android/iOS client architecture
(`docs/MOBILE.md`). Phase 9B implements `src/lib/client/`. No mobile app
is implemented.

## 5. Assessment Model

Question metadata should be extensible for:

- country
- examination
- institution
- year
- subject
- topic
- concept
- difficulty
- type
- language
- source
- explanation
- trap
- tags

Practice modes:

- topic
- exam
- random
- timed
- mock
- adaptive
- mistake review
- spaced repetition
- confidence-based

## 6. Learning & Personalization

```text
GOAL → CURRICULUM → PROGRESS → ACCURACY → SPEED → WEAKNESS → MEMORY → RECOMMENDATION
```

Personalization may use confidence, accuracy, speed, errors, and revision
history.

## 7. Community Architecture

```text
QUESTION
→ PEER / AI RESPONSE
→ RATING
→ MODERATION
→ VERIFIED KNOWLEDGE CANDIDATE
```

Community reputation and canonical knowledge trust must remain separate.

## 8. Growth Architecture

```text
LEARN
→ ACHIEVE
→ MICRO-WIN
→ OPTIONAL SHARE
→ DISCOVERY
→ ACTIVATION
→ LEARNING
```

Referral, squad, creator, and community loops are secondary growth systems
built around genuine value.

## 9. Commerce Architecture

```text
PRODUCT
          ↓
ORDER  →  PAYMENT (record only; never grants access)
          ↓
PURCHASE
          ↓
ENTITLEMENT GRANT PROPOSAL
          ↓
ENTITLEMENT
          ↓
FEATURE ACCESS
```

Payment providers sit behind a commerce abstraction. Product, order,
purchase, and payment identities exist without payment processing.
Entitlement remains the access authority. Current catalog access remains
free.

## 10. AI Cost Architecture

```text
REQUEST
→ AUTH
→ ENTITLEMENT
→ RATE LIMIT
→ MODEL ROUTING
→ RETRIEVAL
→ INFERENCE
→ USAGE LOG
→ COST ATTRIBUTION
```

## 11. Institutional Architecture

```text
Organization
├── Departments
├── Admins
├── Teachers
├── Learners
├── Content
├── Licenses
├── Analytics
└── Policies
```

Tenant isolation is mandatory when institutional functionality is implemented.

## 12. Mobile Contract Principle

Mobile clients consume shared platform contracts. Business logic must not be
reimplemented separately in Android/iOS.

Phase 9A designs the client architecture (`docs/MOBILE.md`). Required flow:

```text
Mobile Client
  → Platform API Contracts
    → /api/v1 Transport
      → Existing Domain Engines
```

Minimal client layers: API client, state/cache, navigation, domain
projection. Local learner state stays separate from server-read cache.
Web may keep in-process composition; it must use the same canonical
types. No Android/iOS app, React Native, Flutter, or native SDK is
implemented in 9A. Phase 9B is the TypeScript adapter in
`src/lib/client/`. Phase 9C adds the in-memory server-cache / local-learner
boundary and fail-closed offline reads. Phase 9D is the Web integration
gate (`src/lib/client/web.ts`). Phase 9E is the integration gate
(`npm run verify:phase9`). Phase 9 client foundation is closed. Next
increment is not started.

## 13. Architecture Evolution

Start with a modular monolith.

Extract services only when justified by:

- scale
- reliability
- organizational ownership
- security boundary
- independent deployment needs
- measurable operational benefit
