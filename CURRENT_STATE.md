# SAJIB ATLAS — DOCUMENT CONTROL

**Architecture Baseline:** V10.7
**Master Vision:** `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
**Document Set:** V10.7
**Status:** Active / synchronized  
**Repository:** Implementation source of truth  
**Authority Rule:** Repository/runtime/test evidence overrides strategic assumptions.

> This document is part of the V10.7 documentation constitution. V10.7 is the
current active architecture baseline. V10.6 remains the historical engineering
foundation (Phase 0–9F and canonical content architecture). The Master Vision
document remains the V10.6 strategic constitution and is not rewritten here.
If a document conflicts with repository evidence, repository evidence wins.
Product, brand, and platform expansion claims are not implemented unless this
file and the repository confirm them.

# CURRENT_STATE.md — V10.7 SYNCHRONIZED STATE

## 1. Purpose

This file records what is actually implemented. It must never pretend that
future Master Vision capabilities already exist.

## 2. Confirmed Project Context

The active project is a Web application being developed as the first client of
the Sajib Atlas platform.

Working Web surfaces:

- Home, Explore, About, Geography, BCS, English, International Affairs, Research
- Geography category routes such as `/geography/physical-geography`
- Geography topic study routes such as `/geography/earths-rotation`
- `TopicStudyPage.tsx` + `MCQPractice.tsx` (Assessment Engine sessions with local learner ingestion)
- Client learner store (`localStorage`), `/dashboard`, `/revision`
- Desktop substring search over the canonical content manifest

## 3. Phase 0A — Canonical Topic Identity (implemented)

Phase 0A introduced a unique topic identity index (slug, subject, category,
title, contentStatus, href). Duplicate registry rows were removed.

Phase 0C moved that catalog into `src/lib/content/manifest.ts`. See §5.

Geography study content remains in `src/lib/geography-data.ts`.

Geography catalog hrefs in `knowledge-data.ts` now match live routes:

- `/geography/physical-geography`
- `/geography/human-geography`
- `/geography/economic-geography`
- `/geography/environmental-geography`
- `/geography/geography-of-bangladesh`

Stale nested catalog keys (`/geography/physical`, `/geography/human`,
`/geography/economic`, `/geography/environmental`, `/geography/bangladesh`)
were never valid `geography/[topic]` routes. They were removed from
`nestedPages` and from the sitemap. No redirects were added.

Phase 0A pointed the sitemap at live Geography routes instead of the stale
nested catalog keys. Phase 0C now derives those topic URLs from the
canonical manifest (see §5).

## 4. Phase 0B — Assessment Core (implemented)

Subject-independent assessment types and scoring live in:

- `src/lib/assessment/types.ts` — `MCQQuestion`
- `src/lib/assessment/scoring.ts` — `isAnswerCorrect`, `nextScore`

`MCQPractice.tsx` consumes that core. `geography-data.ts` re-exports
`MCQQuestion` for local content typing; it does not own the assessment
contract. The assessment module does not import Geography, React, or
`localStorage`.

Correctness remains `selectedOption === question.answer` (case-sensitive).
Score still increments by 1 on a correct check. Learner persistence is
unchanged: `{ topicSlug, correct, timestamp }` via `addMCQResult`.

Question `id` was not added: existing Geography items have none, and adding
one would require a mass content rewrite.

Scoring still runs only in the browser. There is no server-authoritative
assessment and no test runner.

## 5. Phase 0C — Canonical Content Manifest (implemented)

Thin canonical topic identity lives in:

- `src/lib/content/types.ts` — `CanonicalTopic`
- `src/lib/content/manifest.ts` — identity catalog
- `src/lib/content/validate.ts` — duplicate id/href and payload-coverage checks

The manifest owns topic identity and routing metadata:

- `id` (`${subject}/${slug}`, deterministic; not an index or UUID)
- `subject`, `slug`, `title`, `href`, `category`, `contentStatus`, `contentSource`

Geography educational payload remains in `src/lib/geography-data.ts`.
The manifest describes which topic exists; geography-data still contains
what that topic teaches. geography-data.ts was not mass-rewritten.

`src/lib/curriculum-registry.ts` no longer maintains a second catalog. It
re-exports the manifest under Phase 0A names.

`src/lib/knowledge-data.ts` remains catalog page copy (descriptions, labels,
nested stub pages). BCS/English topic cards resolve identity from the manifest.
International Affairs and Research child cards are not canonical topics; they
still point at parent section routes.

Consumers of canonical identity:

- search (`search-data.ts`, `SearchBar.tsx`)
- sitemap (`src/app/sitemap.ts`)
- revision and dashboard next-action (`store/learner/revision.ts`, `intelligence.ts`)
- DomainGrid topic counts
- Geography topic/category links (`TopicCard`, `PreviousNextNavigation`, index/study breadcrumbs)

Sitemap topic URLs come from the manifest. Geography grouping URLs
(`/geography/physical-geography`, etc.) are derived from unique Geography
category keys on the manifest. They are grouping pages, not study topics.

Intentionally deferred: Knowledge Graph, `/subjects`, `/topics/[slug]`, AI,
Supabase, auth, payment, CMS, database search.

## 6. Phase 0D — Learner Surface, Completion & State Consistency (implemented)

Topic study can mark the current Geography topic complete.

- `TopicCompletionControl` on `TopicStudyPage` resolves canonical id
  (`geography/${slug}`) and calls existing `markTopicComplete`.
- Completion is stored in the existing `localStorage` learner state as the
  canonical topic id. Duplicate id or legacy slug entries are ignored.
- Completed state is shown on the study page. No streaks, badges, or points.
- Study continuity is stored additively in optional `LearnerState.studyProgress`.
  It records canonical topic id, content version, active/completed status,
  topic-level progress, and last activity. It is independent from
  `completedTopics` and assessment performance.
- Published, available topic delivery is projected through
  `src/lib/content/delivery.ts`; draft and archived content are not normal
  learner delivery. A stored study record reports a deterministic stale-version
  condition when the current topic version changes.

`/dashboard` and `/revision` are linked from the primary navbar, footer, and
the matching Quick Access items.

Dashboard completed count is `countCompletedCanonicalTopics`: only manifest
topics that are actually marked complete. Next-action and review links use
canonical hrefs. Next-action skips completed available topics.

Revision remains accuracy-based (weak/developing MCQ performance). It does not
drop completed topics; completion is study progress, not a revision-queue
filter. Queue items are unique by canonical id.

Learner persistence is still client `localStorage`. Read/write is try/caught
for SSR and unavailable storage. Corrupt JSON becomes empty state. Legacy
bare-slug completion entries are treated as complete and normalized to
canonical ids on read. No server persistence, auth, or backend identity.

## 7. Phase 0E — Foundation Closure (implemented)

Phase 0A–0D remain in the working tree. Phase 0E closed documentation and
dependency gaps without starting Phase 1.

- `SajibAtlas-Master-Context-v2.md` is a pre-V10.6 context pack. Git still
  tracks the blob; the working copy is not restored. It is not an active
  authority. Decision: `docs/decisions/0001-master-context-v2-superseded.md`.
- Unused `@supabase/ssr` and `@supabase/supabase-js` were removed. No source
  file imported them. They were added in the V10.6 docs baseline commit and
  never wired.
- Navbar no longer duplicates Explore/Topics on `/explore`. Footer matches.
- Quick Access only links to live routes (`/dashboard`, `/explore`,
  `/geography`, `/revision`). Notes and Search Atlas `#top` placeholders
  were removed; they implied pages that do not exist.
- No test framework was installed. `npm run verify:learner` runs the
  existing completion/scoring verifier.

Roadmap Phase 0 foundation (identity, assessment, manifest, learner wiring,
build health) is closed in the repository. Accessibility/performance polish
and a project test runner were not part of 0A–0E.

## 8. Status Classification

### IMPLEMENTED

- Canonical content manifest and topic identity (`subject/slug`, canonical href)
- Geography study/MCQ payload in `geography-data.ts`
- Subject-independent MCQ type and deterministic client scoring
- Learner completion + `localStorage` persistence
- Dashboard and revision, linked from primary navigation
- Substring search and sitemap over the canonical manifest
- Web surfaces: Home, Explore, About, Geography, BCS/English catalog stubs,
  International Affairs, Research, Dashboard, Revision
- Phase 1A–1B universal knowledge contracts: Discipline, Subject, Category,
  Topic, Concept (`src/lib/knowledge/`). Earth's Rotation is the Concept
  proof-of-concept.
- Phase 1C content metadata: version, lifecycle, and repository provenance
  on canonical topics. Payload stays in geography-data.ts / knowledge-data.ts.
- Phase 1D assessment-set identity (`mcq-practice`) on Geography study topics.
  MCQ arrays remain in geography-data.ts. Question IDs are not implemented.
- Phase 1E TypeScript-only knowledge read contracts (`src/lib/contracts/`).
  No HTTP API, routes, or payload copy. Canonical catalogs remain source of truth.
- Phase 1F analytics event identity contract (`src/lib/analytics/`).
  No collection, provider, API, or UI tracking.
- Phase 1G learner profile/goals identity (`src/lib/learner/`).
  Local `learner/local` id. Not persisted. Separate from completion storage.
- Phase 1H entitlement identity (`src/lib/entitlement/`). Not commerce.
  Current catalog content remains free. No paywall or payment provider.
- Phase 1I commerce order/purchase identity (`src/lib/commerce/`). Not payment.
  No prices, checkout, or product catalog. Orders do not grant access.
- Phase 1J unified platform read API contract (`src/lib/contracts/api.ts`).
  TypeScript-only composition over existing read contracts. No HTTP, `/api`
  routes, or payload copy. Canonical catalogs remain source of truth.
- Phase 2 Universal Topic Engine (`src/lib/topic-engine/`). Subject-independent
  resolution, lifecycle, capabilities, composition, navigation, and inspect
  over existing catalogs. Not a second registry. No HTTP, AI, or payload copy.
- Phase 3A assessment domain contracts (`src/lib/assessment-engine/`).
  Delivery/session/result types only. No scoring, payload adapter, or UI.
- Phase 3B universal MCQ scoring boundary (`src/lib/assessment-engine/scoring.ts`).
  Pure set/question scoring on Assessment Engine contracts. No payload
  adapter, session execution, UI, or Geography import.
- Phase 3C universal MCQ payload adapter (`src/lib/assessment-engine/payload-adapter.ts`).
  Reads the canonical AssessmentSet payload pointer. Does not copy Geography
  MCQs, score, create sessions, or change the UI.
- Phase 3D universal MCQ delivery (`src/lib/assessment-engine/delivery.ts`).
  Public practice-mode AssessmentDelivery. Answer-safe. Consumes the adapter.
  No session, scoring, UI, or Geography import.
- Phase 3E in-memory assessment session lifecycle (`src/lib/assessment-engine/session.ts`).
  Execution state only. Completion reuses Phase 3B scoring. No persistence, UI,
  or Geography import.
- Phase 3F assessment result/outcome boundary (`src/lib/assessment-engine/result.ts`).
  Canonical completed AssessmentResult. Reuses Phase 3B scores. Answer-safe.
  No learner intelligence, persistence, or UI.
- Phase 3G Assessment Engine validation gate (`src/lib/assessment-engine/verify-engine.ts`).
  End-to-end composition of Phases 3A–3F. Not a new runtime feature.
- Phase 3H Assessment Engine integration gate
  (`src/lib/assessment-engine/verify-integration.ts`). Confirms the engine is
  a coherent, JSON-safe MCQ domain boundary for future UI/API/mobile
  consumers. Those consumers are not implemented.
- Phase 4 Learner Intelligence (`src/lib/learner-intelligence/`). Deterministic
  ingestion of AssessmentResult into topic progress and performance states.
  Local-first, compatible with existing mcqResults/completedTopics. No UI,
  AI, API, or cloud persistence.
- Phase 4B Learner Intelligence verification/integration gate
  (`verify-intelligence-integration.ts`). Confirms result-driven, local-first
  intelligence is coherent with the Assessment Engine. Not a UI or API.
- Phase 5 Search & Knowledge Retrieval Foundation (`src/lib/search/`).
  Deterministic lexical search over canonical catalogs. Not AI, not a
  database, not a UI redesign. Existing `searchTopics` remains compatible.
- Phase 6A AI Intelligence Foundation (`src/lib/ai-intelligence/`).
  Provider-agnostic request/context/response/safety boundary over Search.
  No chat UI or public API.
- Phase 6B AI Provider + Grounded Answering (`src/lib/ai-providers/xai/`).
  One server-only xAI/Grok adapter. Retrieval-required grounded answers.
  No RAG, chat UI, or `/api/ai`.
- Phase 6C Grounded AI Experience + RAG Readiness (`KnowledgeRetriever`,
  context assembly, grounding states, answer styles). Vector RAG, memory,
  and agents are not implemented.
- Phase 6D AI Experience Integration (`/ai` + thin POST `/ai/ask`).
  Browser never calls xAI. Grounded Ask experience, not a generic chatbot.
- Phase 6E Multi-Provider AI Routing (`src/lib/ai-providers/` router).
  Gemini (`gemini-2.5-flash`) is primary; xAI is eligible fallback only.
- Phase 7A Identity Foundation (`src/lib/identity/`). Canonical local
  identity remains `learner/local`. Authentication is not implemented.
- Phase 7B Entitlement & Access Foundation (`src/lib/entitlement/`).
  Public catalog remains free. Protected access is fail-closed.
- Phase 7C Commerce Foundation (`src/lib/commerce/`). Product, Order,
  Purchase, and Payment are separate. Payment does not grant access.
- Phase 7D Identity / Entitlement / Commerce integration gate
  (`src/lib/phase7/`). Hardening only.
- Phase 8A Platform Foundation **design** (`docs/PLATFORM.md`).
- Phase 8B Platform TypeScript contracts (`src/lib/platform/`). Envelope,
  client surface, errors, optional page, capabilities.
- Phase 8C HTTP transport (`src/app/api/v1/`). Capabilities, identity,
  and topic reads. No `/api/ai`, auth, or checkout.
- Phase 8D API foundation hardening (version, envelope, pagination,
  fail-closed topic access).
- Phase 8E platform integration gate (`npm run verify:phase8`). Phase 8
  foundation is closed.
- Phase 9A Mobile Client Architecture **design** (`docs/MOBILE.md`).
- Phase 9B shared client adapter (`src/lib/client/`).
- Phase 9C client state and offline boundary.
- Phase 9D Web client integration gate.
- Phase 9E mobile foundation integration gate (`npm run verify:phase9`).
  Phase 9 client foundation is closed. Next increment is not started.

### DEFERRED (exist in Vision/Roadmap, not built)

- Universal knowledge platform / Knowledge Graph
- `/subjects` and `/topics/[slug]`
- Semantic/vector retrieval, vector RAG, public REST AI API, adaptive learning
- Authentication, backend identity, Supabase
- Commerce, payments, paywalls
- Mobile (Android/iOS)
- Community, gamification, institutions, B2B/API

### PLANNED (Roadmap sequence only — not started)

- Phase 1 TypeScript identity and read-API contracts are in place. HTTP
  transport, analytics collection, persistence, and payment remain deferred.
- Phase 2 Universal Topic Engine is implemented. Roadmap Learning Intelligence
  (progress model, spaced repetition, adaptive practice) is not started.
- Later roadmap phases 3–6 as written in `ROADMAP.md`

Do not treat DEFERRED or PLANNED items as implemented.

## 9. Current Development Priority

The implemented client remains the Web application. V10.7 brand domains
are documentation only. Content Studio, the persistent batch engine, and
the Editorial CMS are implemented development-only authoring tools and do
not replace the Web client.

Phase 0–9F engineering is closed as recorded in later sections. Canonical
Geography production is the immediate execution path. Next workflow step:
Plate Tectonics publication readiness / human editorial approval
simulation. Authentication, payment processing, native mobile clients, and
persistence remain deferred. V10.7 brand domains, B2B/API products, and
Batch #5 are not started.

## 10. Known Limitations

- `/subjects` and `/topics/[slug]` do not exist. Live topic routes remain
  `/geography/[topic]`, `/bcs/[topic]`, `/english/[topic]`.
- BCS and English are catalog stubs, not study/MCQ pages.
- Scoring is extracted and deterministic but still client-only; answer keys
  remain in the client bundle.
- Learner completion is client `localStorage` only; there is no backend user.
  Canonical identity is `learner/local`. Profile/goals are not persisted yet.
- No project test runner exists (`npm run verify:learner`,
  `npm run verify:knowledge`, `npm run verify:content`,
  `npm run verify:assessment`, `npm run verify:read-contracts`,
  `npm run verify:analytics`, `npm run verify:learner-profile`,
  `npm run verify:identity`,
  `npm run verify:entitlement`, `npm run verify:phase7b`,
  `npm run verify:commerce`, `npm run verify:phase7c`,
  `npm run verify:phase7`,
  `npm run verify:phase8b`,
  `npm run verify:phase8c`,
  `npm run verify:phase8d`,
  `npm run verify:api-contracts`, `npm run verify:topic-engine`,
  and `npm run verify:assessment-contracts` are one-off scripts).

## 11. Deferred / Future Systems

Unless repository evidence says otherwise, treat these as future work:

- full community
- peer doubt solving
- reputation
- Study Squads
- full behavioral personalization
- gamification economy
- referral system
- creator marketplace
- institutional tenancy
- B2B/API
- production AI monetization
- Android
- iOS
- advanced offline synchronization

## 12. State Discipline

Every future feature must move from:

**PLANNED → IMPLEMENTED → TESTED → VERIFIED**

Do not mark planned functionality as implemented.

## 13. Phase 1A — Universal Knowledge Contracts (implemented)

Discipline → Subject → Category → Topic live in `src/lib/knowledge/`.
Canonical topics in `src/lib/content/manifest.ts` carry `disciplineId`,
`subjectId`, and `categoryId` while keeping Phase 0 `id` / `href` / `subject` /
`category` fields so existing consumers do not break.

Geography identity (not payload) is `src/lib/knowledge/geography.ts`. Study
text and MCQs remain in `geography-data.ts`. Curriculum-registry remains a
name projection over the manifest, not a second catalog.

`/topics/[slug]` is not created. English is not built as a second subject
implementation. Assessment-set identity is Phase 1D, not Phase 1A.

## 14. Phase 1B — Concept Identity (implemented)

Concept is an identity-level knowledge object attached to a canonical topic.

- Contract: `src/lib/knowledge/types.ts` (`Concept`)
- Registry: `src/lib/knowledge/concepts.ts`
- Geography seed: `src/lib/knowledge/geography-concepts.ts` (one topic)
- Validation: `src/lib/knowledge/validate.ts`
- Manifest refs: `CanonicalTopic.conceptIds` (identity strings, not objects)
- Verifier: `npm run verify:knowledge`

Identity rule: `${topicId}/${slug}` (example:
`geography/earths-rotation/rotation`). Slug is the stable identity component;
title may change later without changing id. A topic may have zero or more
concepts. Other Geography topics, BCS, and English have none. Concepts are
not a global graph: the same title may exist under different topics with
different ids.

Proof-of-concept topic: Earth's Rotation (`geography/earths-rotation`).

Seed concepts, each already present in that topic's existing payload:

- Rotation — west-to-east spin / axial rotation
- Axis — imaginary axis through the poles
- Day and Night — daily alternation of sunlight
- Apparent Motion — apparent daily motion of the Sun and stars

Concepts do not own study paragraphs, MCQs, hrefs, or learner state.
`geography-data.ts` was not rewritten. Search is not concept-aware. No
`/concepts` route, no concept UI, and no Knowledge Graph.

## 15. Phase 1C — Content Metadata & Versioning (implemented)

Canonical topics carry `contentMetadata` separate from topic identity and
from educational payload.

- Contract: `src/lib/content/types.ts` (`ContentMetadata`, `ContentProvenance`)
- Defaults: `src/lib/content/metadata.ts`
- Provenance catalog: `src/lib/content/sources.ts`
- Validation: `src/lib/content/validate.ts`
- Verifier: `npm run verify:content`

Version is an explicit integer on the current payload (`1` today). It is not
part of the canonical topic id, href, or learner identity. Future v2/v3 can
reuse the same topic id and route.

Lifecycle is `draft | published | archived`. Every live catalog topic is
`published`. This is independent of Phase 0 `contentStatus`
(`available | partial | planned`), which still means payload completeness.

Provenance is a repository-module record (`module/geography-data`,
`module/knowledge-data`). No scholarly citations, publishers, or update
dates were invented. `updatedAt` is omitted because the repository has no
per-topic dates.

`geography-data.ts` was not rewritten. Search, scoring, and learner state
are unchanged. No CMS, database, or publishing workflow.

## 16. Phase 1D — Assessment Set Identity (implemented)

Assessment Set is an identity/attachment object, not the MCQ payload.

- Contract: `src/lib/assessment/types.ts` (`AssessmentSet`, `AssessmentKind`)
- Identity helpers: `src/lib/assessment/identity.ts`
- Registry: `src/lib/assessment/sets.ts`
- Validation: `src/lib/assessment/validate.ts`
- Manifest refs: `CanonicalTopic.assessmentSetIds`
- Verifier: `npm run verify:assessment`

Identity rule: `${topicId}/${kind}` (example:
`geography/earths-rotation/mcq-practice`). Kind vocabulary is `mcq-practice`
only. Payload pointer is `{ module: "geography-data", field: "sections.mcqPractice" }`.
Questions stay in `geography-data.ts`. Sets do not copy MCQ arrays.

Every available Geography study topic receives one `mcq-practice` set.
BCS/English stubs have none. Assessment-set version is not introduced;
`contentMetadata.version` already versions the payload. Learner state remains
topic-based. Scoring is unchanged. Question `id` is still deferred.

No `/assessments` route, no UI redesign, no question-ID migration.

## 17. Phase 1E — Knowledge Read Contracts (implemented)

TypeScript-only read models project the canonical catalogs for future Web,
API, Mobile, and AI consumers. There is no HTTP server, `/api` route, or
second registry.

- Contracts: `src/lib/contracts/types.ts`
- Projection: `src/lib/contracts/read.ts`
- Verifier: `npm run verify:read-contracts`

Read models: `DisciplineRead`, `SubjectRead`, `CategoryRead`, `TopicRead`,
`ConceptRead`, `ContentMetadataRead`, `AssessmentSetRead`.

`TopicRead` exposes identity, href, hierarchy ids, `contentStatus`,
`contentMetadata`, `conceptIds`, and `assessmentSetIds`. It does not embed
study paragraphs or MCQ arrays. Assessment-set reads keep the existing
payload pointer. BCS/English stubs are valid with empty concept and
assessment-set lists.

Canonical catalogs remain the source of truth. No `/subjects`, `/topics/[slug]`,
`/api/*`, `/assessments`, or `/concepts` routes. Search and learner state
are unchanged.

## 18. Phase 1F — Analytics Event Identity (implemented)

A TypeScript-only analytics event contract exists. Events are not collected,
stored, or sent.

- Contract: `src/lib/analytics/types.ts`
- Validation: `src/lib/analytics/validate.ts`
- Verifier: `npm run verify:analytics`

`eventId` is an occurrence id and must not equal a domain entity id. Types
justified by existing surfaces: `topic_viewed`, `topic_completed`,
`assessment_started`, `assessment_completed`, `revision_opened`. Entity types:
`topic`, `assessment_set`, `concept`. No `learner` entity type: there is no
backend learner id.

`occurredAt` is ISO-8601 UTC datetime, distinct from `ContentMetadata.updatedAt`.
Metadata is primitive-only. PII keys are rejected. No provider, database, API,
or UI tracking. `AnalyticsPlaceholder.tsx` remains unused. Learner storage
and scoring are unchanged.

## 19. Phase 1G — Learner Profile & Goals Identity (implemented)

Local-first TypeScript contracts for who the learner is and what they intend
to do. No backend, auth, profile page, or persistence.

- Contract: `src/lib/learner/types.ts`
- Identity: `src/lib/learner/identity.ts`
- Validation: `src/lib/learner/validate.ts`
- Verifier: `npm run verify:learner-profile`

Learner id is the deterministic local singleton `learner/local`. It is not a
topic, concept, assessment-set, or analytics event id. Optional `displayName`
and `locale` only; no email, phone, or credentials.

Goals: `study` (subjectId), `complete` (topicId), `practice` (assessmentSetId).
Status: `active | completed | archived`. Goal `completed` is not topic
completion. Ids are `goal/${type}/${targetId}`. Targets are canonical refs,
not payloads.

Profile/goals are not written to `sajib_atlas_learner_state`. Completion,
revision, and MCQ results are unchanged. Analytics events still have no
learner entity type. No UI.

## 20. Phase 1H — Entitlement Identity (implemented)

TypeScript-only access-grant contract. Not a purchase, payment, subscription,
or paywall.

- Contract: `src/lib/entitlement/types.ts`
- Identity: `src/lib/entitlement/identity.ts`
- Access decision: `src/lib/entitlement/access.ts`
- Validation: `src/lib/entitlement/validate.ts`
- Verifier: `npm run verify:entitlement`

Ids are `entitlement/${scope}/${targetId}`. Scopes: `feature`, `subject`,
`topic`, `assessment_set`. Status: `active | expired | revoked`. Grant
`source` is an identifier only (`free | manual | purchase | subscription |
promotional`) with no transaction data.

Catalog subjects, topics, and assessment sets are public: `decideAccess`
returns `{ allowed: true, reason: "free" }` with an empty entitlement list.
Feature keys are not public. Optional `learnerId` must be `learner/local`.
No persistence, UI, or payment provider. `AdPlaceholder` remains a
placeholder.

## 21. Phase 1I — Commerce Order Identity (implemented)

TypeScript-only purchase/order record. Not payment, not entitlement, not a
product catalog.

- Contract: `src/lib/commerce/types.ts`
- Identity: `src/lib/commerce/identity.ts`
- Validation: `src/lib/commerce/validate.ts`
- Verifier: `npm run verify:commerce`

Order ids are opaque `order/{token}`. Status: `pending | confirmed |
cancelled | failed` — not `paid`. Product is `{ productId }` only; the
catalog and all prices are deferred. Optional `learnerId` is `learner/local`.
No amount, currency, card, or gateway fields. Confirmed orders do not grant
entitlements. Catalog content stays free. No checkout, pricing page, or
persistence.

## 22. Phase 1J — Unified Platform Read API Contract (implemented)

TypeScript-only composition layer over existing domain read contracts.
This is the future API response boundary, not HTTP and not a second catalog.

- Contracts: `src/lib/contracts/api.ts`
- Composition: `src/lib/contracts/compose.ts`
- Validation: `src/lib/contracts/validate-api.ts`
- Verifier: `npm run verify:api-contracts`

Existing 1E models remain authoritative: `DisciplineRead`, `SubjectRead`,
`CategoryRead`, `TopicRead`, `ConceptRead`, `ContentMetadataRead`,
`AssessmentSetRead`. Getters (`getTopicRead`, `getConceptRead`,
`getAssessmentSetRead`, and the hierarchy traversals) are unchanged.

`TopicReadResponse` composes `topic` + `concepts` + `assessmentSets` for
identity/navigation. It does not embed Geography study paragraphs, MCQ
arrays, learner state, analytics events, entitlements, or commerce.
Public assessment-set reads omit the internal payload pointer
(`geography-data` / `sections.mcqPractice`). `src/lib/geography-data.ts`
is not a public API contract; future payload APIs are deferred.

Collection and lookup types exist without pagination, cursors, or URL
parsing. A transport-independent error (`invalid_request` | `not_found` |
`validation_failure`) and success/error envelope are defined. Domain
getters do not return the envelope.

Knowledge, learner, analytics, entitlement, and commerce remain separate
boundaries. Learner reads are profile/goals only (`learner/local`).
Entitlement reads are access state. Commerce reads are the existing order
identity. No payment/checkout/invoice responses.

Contract versions `v1` | `v2` | `v3` can evolve without changing topic,
concept, assessment-set, learner, or entitlement ids. No `/api/v1` routing.

No HTTP handlers, REST/GraphQL/tRPC, database, auth, CMS, payment, AI,
mobile, or new public routes.

## 23. Phase 2 — Universal Topic Engine (implemented)

Subject-independent topic orchestration over the closed Phase 0A–1J
foundation. Not a second canonical registry and not a Geography-only engine.

- Boundary: `src/lib/topic-engine/`
- Model: `TopicEngineModel` (identity, hierarchy, status, concept refs,
  capabilities, navigation)
- Resolution: canonical id, href, or `subjectId` + `slug`
- Lifecycle: identity existence, content availability (`contentStatus`),
  publication (`lifecycle`), and engine capability availability stay
  independent. `contentStatus` is payload completeness only. Capability
  availability is `available` / `unavailable` per study, concepts,
  assessment, completion, revision, and search. `isReady`, `isComplete`,
  and `isActive` are forbidden unless a precise architectural meaning is
  defined. Phase 2 defines none, so true and false are both invalid.
  Derived `operationalState` does not replace those layers. Absence is
  not `planned`. Partial content can still be published.
- Universal capability model: same `TopicCapabilityModel` for every
  subject, bound to canonical `topicId`. Availability kinds are study,
  concepts, assessment, completion, revision, and search. Capabilities
  describe availability and do not execute features. Zero concepts and
  zero assessment sets are valid. Learner state is `external`. Phase 1C
  `contentMetadata.lifecycle` remains publication authority.
- Navigation: previous / next / siblings from canonical-manifest category order
- Search hook: composes over existing `searchTopics`
- Verifier: `npm run verify:topic-engine`
- Notes: `docs/TOPIC_ENGINE.md`

Earth's Rotation identity, four concepts, and `mcq-practice` set are
unchanged. Geography study/MCQ payload remains in `geography-data.ts`.
BCS/English stubs resolve as `catalog-only` with empty concept and
assessment lists. Existing 1E getters, scoring, and search are unchanged.

No HTTP, `/topics/[slug]`, AI, embeddings, spaced repetition, persistence,
payment, or UI rewrite.

## 24. Next Priority

Phase 9E mobile foundation integration gate is complete. Phase 9 client
foundation is closed.

**Next increment is not started.**

Do not add Android/iOS apps, React Native/Flutter, authentication
providers, payment providers, checkout, embeddings, or public REST AI
APIs in that increment.

## 25. Phase 3A — Assessment Domain Contracts (implemented)

TypeScript-only contracts for the future Assessment Engine. Not a registry,
not scoring, not a payload adapter, and not session execution.

- Boundary: `src/lib/assessment-engine/`
- Canonical set identity remains `src/lib/assessment/`
- Geography MCQ payload remains `src/lib/geography-data.ts`
- Contracts: modality, question key (`assessmentSetId` + `contentVersion` +
  `ordinal`), MCQ delivery (no `answer`), delivery container, MCQ response
  (`selectedOption: string | null`), in-memory session, outcome, result
- Question key is version-scoped, not an eternal question id and not a
  Geography payload `id`
- Session `mode` is `practice` (vocabulary reserved for timed/mock/exam/review)
- Session status is distinct from result status (`completed`)
- Verifier: `npm run verify:assessment-contracts`

No scoring changes, no `MCQPractice` changes, no learner storage changes,
no Geography payload edits, no HTTP, no persistence.

## 26. Phase 3B — Universal MCQ Scoring Boundary (implemented)

Pure Assessment Engine MCQ scorer. Not a payload adapter, not session
execution, and not UI integration.

- Boundary: `src/lib/assessment-engine/scoring.ts`
- Correctness: `selectedOption === question.answer` (exact, case-sensitive)
- Single-question: `isMcqAnswerCorrect`; `null` is not correct
- Set-level: `scoreMcqAssessment`; `null` is unanswered, not incorrect
- `score = correct`; one correct answer = one point; no negative marking
- `percentage = total > 0 ? (correct / total) * 100 : 0`
- Internal `ScoringMcqQuestion` includes `answer`; public outcomes/results omit it
- Responses matched by `{ assessmentSetId, contentVersion, ordinal }`
- Duplicate responses, invalid options, and version mismatch fail deterministically
- Canonical set identity remains `src/lib/assessment/`
- Legacy UI scoring remains `src/lib/assessment/scoring.ts`
- Geography MCQ payload remains `src/lib/geography-data.ts`
- Verifier: `npm run verify:assessment-scoring`

No `MCQPractice` changes, no Geography payload edits, no HTTP, no
persistence, no analytics/entitlement/commerce, no session runtime.

## 27. Phase 3C — Universal MCQ Payload Adapter (implemented)

Adapter from canonical AssessmentSet payload to Assessment Engine scoring
questions. Not session execution, not result calculation, and not UI.

- Boundary: `src/lib/assessment-engine/payload-adapter.ts`
- Canonical payload remains `src/lib/geography-data.ts` (`sections.mcqPractice`)
- Set identity remains `src/lib/assessment/` (`geography/earths-rotation/mcq-practice`)
- Adapter is the only Assessment Engine module that imports geography-data
- Output: `ScoringMcqQuestion[]` with version-scoped keys (`ordinal` from 0)
- `contentVersion` is preserved as supplied; it is not derived
- Canonical question order, text, options, and answers are unchanged
- Public `toMcqDeliveryQuestion` omits `answer`, explanation, and payload pointers
- Empty payload → successful empty collection; malformed payload fails
- Verifier: `npm run verify:assessment-adapter`

No Geography payload edits, no MCQ duplication, no `MCQPractice` changes,
no HTTP, no persistence, no analytics/entitlement/commerce.

## 28. Phase 3D — Universal MCQ Delivery (implemented)

Public, answer-safe AssessmentDelivery in practice mode. Not session
execution, not scoring, and not UI.

- Boundary: `src/lib/assessment-engine/delivery.ts`
- Consumes Phase 3C `adaptMcqAssessmentPayload` + `toMcqDeliveryQuestion`
- Output: Phase 3A `AssessmentDelivery` (`assessmentSetId`, `contentVersion`,
  `mode: "practice"`, `McqDeliveryQuestion[]`)
- Delivery does not import `geography-data.ts`; the adapter remains the
  payload import boundary
- Question keys, canonical order, and supplied `contentVersion` are preserved
- Public questions omit `answer`, explanation, and payload pointers
- Empty assessment → successful delivery with zero questions
- Adapter errors propagate (`not_found`, `validation_failure`)
- Verifier: `npm run verify:assessment-delivery`

No Geography payload edits, no `MCQPractice` changes, no HTTP, no
persistence, no analytics/entitlement/commerce, no session runtime.

## 29. Phase 3E — Assessment Session Lifecycle (implemented)

Pure in-memory session execution state. Not learner history, not
persistence, and not UI.

- Boundary: `src/lib/assessment-engine/session.ts`
- `startAssessmentSession(delivery)` → `in-progress`, empty responses
- Opaque `sessionId` via injectable factory (default `crypto.randomUUID`)
- Injectable clock for `startedAt` / `completedAt` (ISO-8601)
- `questionKeys` is the answer-free delivery context on lifecycle sessions
- `recordAssessmentResponse` replaces the same question key; foreign keys fail
- `completeAssessmentSession` calls Phase 3B `scoreMcqAssessment`; caller
  supplies scoring questions (adapter), not Geography
- `abandonAssessmentSession` is terminal, preserves responses, omits result
- Completed and abandoned sessions reject further lifecycle operations
- No localStorage, learner traces, analytics, entitlement, or API
- Verifier: `npm run verify:assessment-session`

No Geography payload edits, no `MCQPractice` changes, no HTTP, no
persistence.

## 30. Phase 3F — Assessment Result & Outcome Boundary (implemented)

Canonical completed AssessmentResult construction and validation. Not
scoring, not session lifecycle, and not learner intelligence.

- Boundary: `src/lib/assessment-engine/result.ts`
- Input: Phase 3B `McqAssessmentScore` + session identity + delivered keys
- Output: Phase 3A `AssessmentResult` (`status: "completed"`, answer-safe outcomes)
- Totals must satisfy `answered + unanswered = total`, `correct + incorrect = answered`,
  `score = correct`, `percentage = total > 0 ? (correct / total) * 100 : 0`
- One outcome per delivered question key; duplicates/missing/extra fail
- Phase 3E completion uses this boundary; it does not rescore
- Abandoned sessions still have no result
- Verifier: `npm run verify:assessment-result`

No Geography payload edits, no `MCQPractice` changes, no HTTP, no
persistence, no analytics/entitlement/commerce.

## 31. Phase 3G — Assessment Engine Validation (implemented)

Validation gate over the Phase 3A–3F chain. Not a new runtime subsystem.

- Verifier: `src/lib/assessment-engine/verify-engine.ts`
- Command: `npm run verify:assessment-engine`
- Proves: Phase 1D set identity → adapter → delivery → session → scoring →
  result for `geography/earths-rotation/mcq-practice`
- Invariants: single Geography payload, version-scoped keys, exact scoring
  law, unanswered ≠ incorrect, terminal completed/abandoned, answer-safe
  public objects, JSON-safe, non-mutating, deterministic with injected clock
- Only MCQ is concretely implemented. Other modalities remain vocabulary.
- No learner persistence, analytics collection, API, mobile, or UI integration

No Geography payload edits, no `MCQPractice` changes, no HTTP.

## 32. Phase 3H — Assessment Engine Integration Gate (implemented)

Final integration-readiness audit of the MCQ Assessment Engine. Not a new
runtime subsystem and not UI/API/mobile implementation.

- Verifier: `src/lib/assessment-engine/verify-integration.ts`
- Command: `npm run verify:assessment-integration`
- Reuses Phase 3G `verify:assessment-engine` for end-to-end composition
- Confirms dependency direction, Geography-free scoring/delivery/session/result,
  no browser/React/learner/analytics/commerce in engine modules, and
  JSON-safe public contracts
- Only MCQ is concrete. Timed/mock/exam/review and other modalities are
  vocabulary only
- Legacy UI still uses `MCQPractice.tsx` → `src/lib/assessment/scoring.ts`
- Future consumers (web UI, mobile, API, analytics) can consume engine
  objects without duplicating domain logic; they are not wired yet

No Geography payload edits, no `MCQPractice` changes, no HTTP.

## 33. Phase 4 — Learner Intelligence (implemented)

Deterministic local-first intelligence over completed AssessmentResult
values. Not UI, not AI, not mastery prediction.

- Boundary: `src/lib/learner-intelligence/` (separate from `src/lib/learner/`)
- Ingests Phase 3F `AssessmentResult`; does not rescore
- Topic progress aggregates by canonical `topicId`; assessments keep
  `assessmentSetId` + `contentVersion`
- Topic percentage = correct / delivered total × 100 (question-weighted)
- Overall accuracy = correct / answered × 100 (question-weighted)
- Performance states: not-started / active / developing / strong
  (60% / 80% thresholds)
- Idempotent on `sessionId`
- `lastActivityAt` / `updatedAt` from result `completedAt`
- `completedTopics` remains completion authority; intelligence only reads it
- Persistence: optional `intelligence` on existing `sajib_atlas_learner_state`
  without deleting `mcqResults` or `completedTopics`
- Verifier: `npm run verify:learner-intelligence`

No Geography payload import, no UI dashboards, no HTTP, no AI.

## 34. Phase 4B — Learner Intelligence Verification & Integration Gate (implemented)

Validation gate over Phase 4. Not a new intelligence model.

- Verifier: `src/lib/learner-intelligence/verify-intelligence-integration.ts`
- Command: `npm run verify:learner-intelligence-integration`
- Confirms AssessmentResult-only ingestion, no duplicate scoring, 60/80
  threshold boundaries, sessionId idempotency, version-distinct rows,
  weighted aggregation, completion separation, legacy state safety, and
  domain separations
- Reuses Phase 4 and Assessment Engine verifiers
- No UI, API, AI, cloud persistence, or adaptive assessment

No Geography payload edits, no `MCQPractice` changes, no HTTP.

## 35. Phase 5 — Search & Knowledge Retrieval Foundation (implemented)

Deterministic local lexical retrieval over canonical catalogs. Not AI.

- Boundary: `src/lib/search/` (separate from `src/lib/search-data.ts`)
- Documents: subject, category, topic, concept, assessment_set
- Identity equals canonical resource ids
- Index: in-memory projection of catalogs; `searchSchemaVersion = 1`
- Matching: title, keywords, searchText/summary, identifiers (case-insensitive)
- Ranking (highest matching field wins):
  1. exact title = 100
  2. title prefix = 80
  3. title contains = 60
  4. keyword = 40
  5. searchText = 20
  6. identifier = 10
  Tie-breaker: canonical `id` ascending
- Empty/whitespace query → no results (not discovery mode)
- `limit` default 25, max 100; invalid limits fail
- Assessment documents omit payload/answers
- Existing `searchTopics` title/slug substring helper is unchanged
- Topic Engine search hook remains the canonical-manifest substring index
- Verifier: `npm run verify:search`

No Geography payload scan at query time, no embeddings, no HTTP, no UI.

## 36. Phase 6A — AI Intelligence Foundation (implemented)

Provider-agnostic AI boundary. Not a chatbot and not a vendor integration.

- Boundary: `src/lib/ai-intelligence/`
- Intents: knowledge-answer, explain-topic, explain-concept, explain-assessment
- Request identity: opaque `ai-request/...` (not learner/topic/assessment ids)
- Context: structured search projections, assessment metadata/results, optional
  learner-intelligence projection
- Retrieval: Phase 5 `searchKnowledge` remains authoritative; AI copies scores
- Provider: `AiProvider` interface only; no SDK, keys, or network
- Grounding references are distinct from `output.kind = "generated"`
- Content version is recorded from canonical assessment/content, not owned
- Safety: max input/context size; forbidden payload/answer/path fields
- Unbound invoke is `status: blocked`, not a fake success
- Verifier: `npm run verify:ai-intelligence`

No RAG, embeddings, chat UI, `/api/ai`, persistence, or Geography payload scan.

## 37. Phase 6B — AI Provider + Grounded Answering Foundation (implemented)

One production adapter over the Phase 6A boundary. Not a chatbot.

- Provider: xAI / SpaceXAI (Grok) via `https://api.x.ai/v1`
- Adapter: `src/lib/ai-providers/xai/` implementing `AiProvider`
- Secrets: server-only `XAI_API_KEY` (never `NEXT_PUBLIC_*`)
- Default model: `grok-4.6`; timeout 15s; max output tokens 800
- Grounded flow: intent → Phase 5 retrieval → approved context → prompt →
  one provider call → validated `AiResponse`
- `knowledge-answer` requires a search hit with score ≥ 40 (Phase 5 keyword
  weight). Otherwise `insufficient_context` and no provider call
- Prompt builder: `src/lib/ai-intelligence/prompt.ts` (DATA vs instructions)
- Assessment explanations copy canonical scores; AI does not rescore
- Learner context is read-only
- Verifier: `npm run verify:ai-provider` (no network)

No RAG, embeddings, conversation memory, web search, chat UI, or `/api/ai`.

## 38. Phase 6C — Grounded AI Experience + RAG Readiness (implemented)

RAG-ready contracts over Phase 5 lexical retrieval. Not vector RAG.

- `KnowledgeRetriever` + lexical adapter (`retrieve.ts`)
- Context assembly: dedupe by canonical id, Phase 5 score order, source budget
- Grounding states: grounded (score ≥ 60 or assessment result),
  weakly-grounded (40–59), insufficient-context (< 40, no provider call)
- Answer styles: concise / standard / detailed / exam-focused
- Helpers: `explainTopic`, `explainConcept`, `explainAssessment`
- Prompt boundaries: `<USER_REQUEST>` vs `<RETRIEVED_KNOWLEDGE>`
- Learner-aware presentation is read-only
- Verifier: `npm run verify:ai-grounded-answering`

No embeddings, vector DB, web search, memory, agents, chat UI, or `/api/ai`.

## 39. Phase 6D — AI Experience Integration (implemented)

Grounded knowledge assistant. Not a generic chatbot.

Flow: UI → server boundary → AI Intelligence → Phase 5 Search →
quality gate → `AiProvider` → safe view.

- UX route: `/ai` only (no `/chat`, `/assistant`, `/bot`, `/ask`)
- Transports: Server Action `askGroundedQuestion` and thin POST `/ai/ask`
- Application service: `src/lib/ai-experience/service.ts` (provider-agnostic)
- Public JSON-safe request: text, intent, style, optional canonical
  `topicId` / `conceptId`, optional read-only learner projection
- Validation rejects invented ids, untrusted assessment results, provider
  fields, and oversized input
- Default path is `knowledge-answer` through Phase 5 retrieval and the
  grounding gate. Insufficient context does not call the provider
- Topic Ask links use canonical topic id, not title text
- Concept context uses canonical concept id
- `explain-assessment` is not offered from the web form: there is no
  server-persisted `AssessmentResult`, and client-supplied results are
  rejected. After MCQ completion the UI links to topic explanation
- Learner context is a safe projection only (performance state, topic
  progress). AI is read-only and does not write completion or MCQ state
- Answer display: generated text, retrieval grounding badge (Grounded /
  Limited matching knowledge / Not enough matching knowledge), canonical
  source links. No provider name, no raw retrieval scores, no secrets
- Insufficient-context UX is distinct; the form stays so the user can refine
- Process-local in-flight guard: one experience request at a time per
  isolate. Not Redis/database rate limiting. One provider call per request
- Access: public/free. No new entitlement or commerce gating
- Missing primary-provider key shows an unavailable state (no fake
  production answer, no silent mock)
- No chat history, memory, agents, streaming, vector RAG, or mobile app
- Verifier: `npm run verify:ai-experience`

**Phase 6D implemented.** Provider routing is Phase 6E.

## 40. Phase 6E — Multi-Provider AI Routing & Cost Optimization (implemented)

Gemini is the primary low-cost provider. xAI remains the eligible fallback.
The AI Intelligence core is unchanged.

- Gemini adapter: `src/lib/ai-providers/gemini/` implementing `AiProvider`
  via official `generateContent` HTTP (`generativelanguage.googleapis.com`)
- Default model: `gemini-2.5-flash` (`GEMINI_MODEL`, server-only)
- xAI adapter preserved at `src/lib/ai-providers/xai/`
- Router: `src/lib/ai-providers/router.ts` (`AiProviderRouter`)
- Explicit registry: `gemini`, `xai` only. Unknown `AI_PRIMARY_PROVIDER` fails
- Default policy: Gemini → xAI. If primary is `xai`, Gemini is fallback only
  when `AI_FALLBACK_PROVIDER=gemini` is set
- Fallback eligible: `rate_limited`, `timeout`, `network`, `upstream`,
  `malformed_response`
- Fallback not used: `configuration`, `authentication`, `invalid_request`,
  `policy_blocked`, `unknown`
- Missing `GEMINI_API_KEY` while Gemini is primary is configuration failure
  and does **not** fall back to xAI
- Worst-case provider calls per request = 2. No retry loops
- Same approved prompt/context is sent to fallback. Search is not re-run
- Insufficient context still calls neither provider
- Public UI remains “Sajib Atlas AI”; no provider names
- No LiteLLM, no circuit breaker, no health DB, no agents
- Verifier: `npm run verify:ai-provider-routing`

**Phase 6E implemented.** Phase 7A–7D and Phase 8A–8E platform
foundation are implemented. Phase 9A–9C client adapter/state is in
place. Phase 9A–9E client foundation is complete. Next increment is
not started.

## 41. Phase 7A — Identity Foundation (implemented)

Canonical learner identity boundary. Not authentication, not a profile
service, and not a replacement of local learner state.

- Boundary: `src/lib/identity/`
- Canonical local id remains `learner/local` (owned here; Phase 1G
  `LearnerProfile` consumes it)
- Modes: `local` (active), `authenticated` / `external` (structural)
- Status: `active` | `disabled` (local resolution is always `active`)
- Resolution: pure `resolveLearnerIdentity` → `learner/local`
- Public read: `{ learnerId, mode, status }` — no email, phone, tokens,
  provider subject, or secrets
- Future authenticated shape: `learner/{opaque-id}` (not generated)
- External identity ≠ canonical learner identity
- Migration contract describes local → authenticated only; it does not
  copy, merge, or delete state
- `sajib_atlas_learner_state` is unchanged
- Learner Intelligence still uses `learner/local` with no auth dependency
- Verifier: `npm run verify:identity`

No login UI, sessions, JWT, OAuth, user database, or `/api/auth`.
Phase 7B strengthens entitlement/access on this identity.

## 42. Phase 7B — Entitlement & Access Foundation (implemented)

Access decision boundary over Phase 1H entitlement identity. Not payment,
not authentication, and not a paywall on current catalog content.

- Boundary: `src/lib/entitlement/`
- Canonical id remains `entitlement/{scope}/{targetId}`
- Scopes: `feature`, `subject`, `topic`, `assessment_set`
- Matching: exact `scope` + `targetId` (no subject→topic inheritance)
- Classification: `public` | `protected`
- Public catalog subjects/topics/assessment sets remain `reason: "free"`
- Protected resources fail closed: missing, expired, revoked, wrong
  learner, wrong target, wrong scope, malformed, or out-of-window deny
- Ownership: if `entitlement.learnerId` is set it must equal the current
  canonical `learnerId` (`learner/local`)
- Temporal: inclusive `startsAt`/`expiresAt` with injectable `now`/`asOf`
- Grant proposal is a contract only; payment state cannot grant access
- Storage is an interface only; no database
- Verifier: `npm run verify:phase7b` (Phase 1H `verify:entitlement` remains)

No checkout, payment provider, subscription runtime, API routes, or UI
gating. Phase 7C adds commerce records that still cannot grant access.

## 43. Phase 7C — Commerce Foundation (implemented)

Domain foundation for commercial records. Not payment processing, not
checkout, and not an access authority.

- Boundary: `src/lib/commerce/`
- Product: opaque Phase 1I id, `one_time` | `subscription`, no price
- Order: `order/{opaque}`, statuses `pending | confirmed | cancelled |
  failed` (Phase 1I). No amount/currency on the order
- Purchase: `purchase/{opaque}`, `completed | cancelled | failed`
- Payment: `payment/{opaque}`, processing statuses only; supports an order
- Grant: `proposeEntitlementGrantFromPurchase` → Phase 7B proposal
  (`source: purchase` or `subscription`). Pure. No persistence
- Payment and Purchase never call `decideAccess`
- Public payment read omits provider internals, amount, and secrets
- Storage is an interface only
- Verifier: `npm run verify:phase7c` (Phase 1I `verify:commerce` remains)

No gateway, webhooks, invoices, refunds, checkout UI, or `/api/checkout`.
Phase 7D hardens the purchase → entitlement → access chain.

## 44. Phase 7D — Integration & Hardening Gate (implemented)

Audit and composition of Phase 7A–7C. Not a new domain and not Phase 8.

- Gate: `src/lib/phase7/verify-phase7.ts`
- Confirms Identity → Learner, Commerce → Entitlement, Entitlement → Access
- Confirms Payment ↛ Access and Purchase ↛ Access
- `entitlementFromGrantProposal` materializes a canonical Entitlement
  from a proposal without persistence
- Public Geography/BCS/English/AI remain free
- No auth, database, checkout, API, or mobile
- Verifier: `npm run verify:phase7`

Phase 8A is designed in `docs/PLATFORM.md`. Phase 8B code is in
`src/lib/platform/`.

## 45. Phase 8A — Platform Foundation Design (designed, not implemented)

Thin, universal client contract over existing Phase 1J and Phase 7
boundaries. Web → API → Android → iOS share one envelope. Domain engines
remain authoritative.

- Design: `docs/PLATFORM.md`
- Reuses `PlatformReadResult`, `v1|v2|v3`, and Phase 1J error codes
- Client surface ≠ `learner/local`
- No `src/lib/platform/`, no HTTP `/api/v1`, no mobile app
- No authentication, database, payment, or AI provider changes

Phase 8B TypeScript contracts are implemented in `src/lib/platform/`.

## 46. Phase 8B — Platform Contracts (implemented)

TypeScript-only platform layer over Phase 1J. Not HTTP and not a domain
engine.

- Boundary: `src/lib/platform/`
- Envelope reuses `PlatformReadResult` (`platformSuccess` / `platformFailure`)
- Client surfaces: `web | android | ios | api` — not `learner/local`
- Request context: `v1`, client, optional canonical learner, optional
  `platform-request/{id}`
- Errors: domain codes map to `invalid_request | not_found | validation_failure`
- Optional page: `{ items, limit, nextCursor? }` (Search `limit` unchanged)
- Capabilities: platform availability read; not Topic Engine capabilities
- AI experience can be mapped into the 1J envelope; `/ai/ask` is unchanged
- Verifier: `npm run verify:phase8b`

No Android/iOS, authentication, or database. `/api/v1` is read-only
transport. Phase 8D hardens that transport.

## 47. Phase 8C — HTTP / Client Transport (implemented)

Thin App Router GET handlers over Phase 8B helpers.

- Transport: `src/lib/platform/http.ts`
- Routes: `/api/v1/capabilities`, `/api/v1/identity`, `/api/v1/topics`
- Envelope and errors from Phase 1J / 8B
- Identity is always `learner/local`
- Optional `limit` paginates topic collections
- Verifier: `npm run verify:phase8c`

No `/api/ai`, `/api/auth`, checkout, or mutations.

## 48. Phase 8D — API Foundation Hardening (implemented)

Hardens `/api/v1` without new product APIs.

- Serve `v1` only; unsupported versions are `invalid_request`
- Envelope validation on every response
- Pagination default/max from Search contracts
- Topic reads go through `decideAccess`; catalog stays free
- Non-local learner claims rejected
- Verifier: `npm run verify:phase8d`

## 49. Phase 8E — Platform Integration Gate (implemented)

Audits 8A–8D. Does not add product APIs.

- Flow: Client → HTTP → Platform Contracts → Existing Domain Engines
- Topic / Assessment / Search / Learner Intelligence / AI remain engines
- Entitlement `decideAccess`; commerce records-only; payment is not access
- Web Geography/Topic/Search/AI stay in-process
- Verifier: `npm run verify:phase8`
- Notes: `docs/PHASE8.md`

## 50. Phase 9A — Mobile Client Architecture (design)

Documentation gate. No Android/iOS code.

- Notes: `docs/MOBILE.md`
- Flow: Mobile Client → Platform API Contracts → `/api/v1` → engines
- Layers: API client, cache/local state, navigation, projection
- Web and mobile share canonical domain contracts
- Auth and push are reserved slots only

## 51. Phase 9B — Shared Client Adapter (implemented)

TypeScript adapter over Phase 8 contracts. No product APIs.

- Code: `src/lib/client/`
- Reads: request, topics, assessment identity, search, intelligence, AI map, access
- Server cache keys ≠ local learner store
- Verifier: `npm run verify:phase9b`

## 52. Phase 9C — Client State & Offline Boundary (implemented)

In-memory dual store. No persistence API.

- Server cache: public catalog projections only
- Local learner: `learner/local` only; not access
- Status: idle / loading / success / error
- Offline: cache for public reads; protected and AI fail closed
- Verifier: `npm run verify:phase9c`

## 53. Phase 9D — Web Client Integration Gate (implemented)

Audits Web against 9B/9C. Minimal wiring only.

- Web boundary: `src/lib/client/web.ts`
- SearchBar uses that boundary; search-data behavior unchanged
- Geography/MCQ/AI in-process paths unchanged
- Verifier: `npm run verify:phase9d`

## 54. Phase 9E — Mobile Foundation Integration Gate (implemented)

Audits 9A–9D. Does not add Android/iOS apps.

- Flow: Web/future Android/iOS → shared client → `/api/v1` → engines
- Verifier: `npm run verify:phase9`
- Notes: `docs/PHASE9.md`

Next increment is not started.

## 55. Phase 9F — Platform Contract Reliability & Client Resilience (implemented)

The shared client boundary now hardens the existing Phase 1J/8B transport
without adding routes or changing domain authorities.

- Strict shared envelope parsing rejects malformed bodies, extra envelope
  fields, and unsupported response versions.
- Client requests generate opaque `platform-request/{opaque}` correlation IDs
  unless an explicit valid ID is supplied.
- Client transport has a bounded timeout (5 seconds by default).
- Only GET reads retry, at most once, and only when execution fails
  transiently. Mutations, malformed responses, and domain/access failures are
  never retried.
- The existing in-memory cache remains limited to safe public projections;
  protected data, learner-private state, answer keys, AI output, secrets, and
  credentials are rejected.
- Code: `src/lib/client/` and `src/lib/platform/envelope.ts`
- Verification: `npm run verify:phase9b`, `npm run verify:phase9c`,
  `npm run verify:phase9`

## 56. Assessment-to-Learner Web Loop Integration (implemented)

Web MCQ practice now creates an in-memory Assessment Engine session, records
responses, completes the session, and ingests the canonical `AssessmentResult`
through Learner Intelligence. Existing `mcqResults` and `completedTopics`
remain compatible local-first fields, while Dashboard and Revision continue to
consume the existing learner projection.

- Code: `src/components/assessment/MCQPractice.tsx`,
  `src/store/learner/context.tsx`
- Verification: assessment and learner-intelligence verifiers plus
  `npm run verify:phase9`

## 57. Learner Progress & Revision Intelligence (implemented)

Canonical learner intelligence now exposes additive evidence bands and revision
priorities on topic progress. Revision projections use canonical intelligence
assessments for states with intelligence, with deterministic priority,
last-activity, and topic-ID ordering. Legacy `mcqResults` remains a
read-compatible fallback only for pre-intelligence state.

- Code: `src/lib/learner-intelligence/`, `src/store/learner/revision.ts`,
  `src/store/learner/intelligence.ts`, `src/components/learning/LearningSignals.tsx`
- Verification: `npm run verify:learner-progress`

## 58. Canonical Geography Production Batch #1 (implemented)

The first independently authored canonical Geography package is available in
the production workflow and Live Content Review Workspace:

- Topic: Water Cycle (`topic/geography/water-cycle`), content version 1
- Six process-based KnowledgeUnits, five concepts, four objectives, claims, and
  authoritative source references
- Automated quality evaluation creates a version-bound Production Quality
  Snapshot; the record remains in `draft` for editorial and academic review
- Review route: `/content-review/geography/water-cycle`
- The package has no dependency on the legacy `src/lib/geography-data.ts`
  payload, which remains reference-only
- Verification: `npm run verify:content-review`

The subsequent editorial/academic remediation gate recorded the package as
`READY WITH WARNINGS`: no blockers remain, the human-influence claim has
additional verified USGS provenance, and the package remains draft pending
human editorial and academic approval. Audit report:
`docs/superpowers/reviews/2026-09-03-water-cycle-editorial-academic-audit.md`.

The human editorial approval simulation recorded
`APPROVE WITH NON-BLOCKING CONDITIONS`; Water Cycle remains draft and
`NOT PUBLISHED`. Geography Batch #2, Latitude and Longitude
(`topic/geography/latitude-and-longitude`), is now an independently authored
version-1 draft production package with five concepts, six KnowledgeUnits,
five objectives, provenance, and reference-only assessment alignment. It is
registered in the existing review workspace and remains unpublished pending
editorial/academic audit. It has no dependency on the legacy
`src/lib/geography-data.ts` payload.

The editorial and academic audit recorded `READY WITH WARNINGS` with zero
blockers. The retained warnings concern broad source locators, an optional
future spatial diagram/example, and intentionally bounded datum terminology.
Latitude and Longitude remains draft and unpublished pending human approval.

A cross-batch canonical quality gate compared Water Cycle and Latitude and
Longitude and found the universal standard stable for Batch #3. Recurring
source-locator precision is a documented recommendation, not a blocker.
Batch #3, Atmosphere (`topic/geography/atmosphere`), is now implemented as a
fresh version-1 canonical production package with five concepts, seven
KnowledgeUnits, five objectives, eight claims, five authoritative source
references, and reference-only assessment alignment. Its production quality
snapshot is valid and version-bound; the workflow lifecycle remains `draft`.
It is registered at `/content-review/geography/atmosphere`, has no legacy
Geography dependency, and is ready for a separate editorial/academic audit.
It remains unpublished.

Batch #3 Atmosphere has completed its editorial and academic audit with 22
passes, two non-blocking warnings, and zero blockers. The audit verdict is
`READY FOR PUBLICATION REVIEW`; the warnings record NOAA automated-fetch access
restrictions and an optional future layer diagram or worked pressure example.
The package remains a version-1 draft and unpublished.

Human editorial approval simulation for Atmosphere recorded
`APPROVE WITH NON-BLOCKING CONDITIONS`, with zero blockers and two documented
conditions: retain the NOAA access limitation for later editorial recheck and
consider an optional layer visual or worked pressure example in a future
revision. Atmosphere remains draft and unpublished. Batch #4 readiness
assessment recommends Plate Tectonics; no Batch #4 content has been created.

Batch #4, Plate Tectonics (`topic/geography/plate-tectonics`), is now
implemented as a fresh version-1 canonical production package with five
concepts, seven KnowledgeUnits, five objectives, nine claims, five source
references, and reference-only assessment alignment. It is registered at
`/content-review/geography/plate-tectonics` with a valid version-bound quality
snapshot and remains in lifecycle `draft`. The package has no dependency on
the legacy `src/lib/geography-data.ts` payload and has not been published.
It is ready for the separate editorial/academic audit; no Batch #5 content
has been created.

The durable resume checkpoint is recorded in
`docs/superpowers/reviews/2026-09-03-canonical-development-resume-checkpoint.md`.
The next exact workflow step remains Plate Tectonics publication readiness /
human editorial approval simulation.

## 59. V10.7 Product, Brand & Platform Expansion Architecture (documentation only)

V10.7 is the current active architecture baseline. The brand, product, and
channel expansion remains a documentation overlay. **Brand implementation
is unchanged.** Content production and the Editorial CMS, recorded below,
are separate implemented authoring tools. They are not brand domains.

- Authoritative V10.7 specification:
  `docs/superpowers/specs/2026-09-04-v10-7-product-brand-platform-expansion-architecture.md`
- High-level summary: `ARCHITECTURE.md` section 14
- Brand surfaces documented: SAJIB ATLAS (ecosystem/authority) and SAJLAS
  by Sajib Atlas (flagship learning product)
- Layering documented: Core Platform → Product → Experience → Channel
- Bangladesh remains the launch/proving market. The architecture is global
  by design and localized by market.
- No second application, domain, DNS, redirect, repository split,
  authentication system, database, mobile app, B2B/API product, or
  canonical-content change was made for V10.7.
- Future products (SAJLAS Assess, SAJLAS API, institutional, recruitment,
  creator, publishing, independent ventures) remain options only.
- Phase 0–9F implementation, Universal Content Schema, production packages,
  audits, and publication-readiness decisions are unchanged.

Immediate development path remains the existing canonical Geography
checkpoint: Plate Tectonics publication readiness / human editorial
approval simulation. Do not start Batch #5, publish draft content, migrate
legacy Geography, or implement V10.7 brand domains.

## 60. Studio Batch Production Engine (local-first, not publication)

The Content Studio in-request batch (`generateStudioBatchAction` /
`runStudioBatch`) is unchanged. It still runs every item inside one server
action and keeps results in page memory.

A separate batch production engine lives in `src/lib/content-studio/batch-engine/`.
It is an authoring orchestrator, not a publisher:

- A batch job and its items are persisted through a `BatchJobStore`
  (memory, or one local JSON file per batch). Creating or queueing a batch
  does not generate topics.
- `tickBatchWorker` runs exactly one eligible item per call through the
  existing `runStudioPipeline`. It is not a daemon. Browser `localStorage`
  is not a worker. Nothing continues after the calling process stops.
- Resume skips succeeded and quality-blocked items. `source_insufficient`
  stays blocked until its source text is replaced. `rate_limited` gets one
  automatic batch retry, separate from the Gemini adapter's own single retry.
- Results land in a Studio Production Inbox. An explicit handoff records that
  a human may later register the draft canonically. The handoff does not
  write `/content-review`, approve, or publish.
- Verification: `npm run verify:batch-engine`.

The Studio page now has an operator control surface for that engine. It can create a persistent batch, queue it, tick one item, pause, resume, and show the production inbox. The tick is explicit. It is not a background worker. The older synchronous batch on the same page is unchanged. A 3-topic live gate can describe Water Cycle, Atmosphere, and Plate Tectonics from the existing canonical packages, but it does not start a provider call.
Verification: `npm run verify:batch-control`.

A failed item can be explicitly requeued with `recoverFailedBatchItem`. That operation does not call a provider. The next tick runs that item once. Succeeded, quality-blocked, and source-insufficient items are not requeued. `rate_limited` keeps its existing one-retry policy. Verification: `npm run verify:batch-recovery`.

No bulk live generation has been run. Canonical Geography packages are unchanged.

The development-only Editorial CMS Workspace edits a batch item's existing draft through `/content-studio/editor/[batchId]/[itemId]`. It stops at editorial status `ready_for_approval`. It does not approve, publish, or register canonical review. Verification: `npm run verify:editorial-workspace`.

## 61. Editorial CMS and current V10.7 state

Status words used here:

- **IMPLEMENTED** — present in this worktree and covered by a verifier or by the production build.
- **ARCHITECTURE-ONLY** — specified, not a runtime product.
- **DEFERRED** — known, non-blocking, and intentionally unchanged.
- **NOT YET IMPLEMENTED** — absent. Do not treat it as present.

### IMPLEMENTED

The authoritative V10.7 architecture remains `docs/superpowers/specs/2026-09-04-v10-7-product-brand-platform-expansion-architecture.md`. The items below are authoring implementation. They are not a second architecture, and they are not canonical publication.

- Content Production Studio: Studio form, server generation action, server-routed provider, identity resolution, structured parsing, and a `ProductionRecord` draft.
- Source packet and provenance grounding. The pipeline does not invent sources. Provider traces are sanitized. Raw provider bodies and secrets are not stored.
- Content Quality Gate integration through `evaluateProductionQuality`, then review projection. The editor displays that snapshot. It does not reimplement the gate.
- Persistent Batch Production Engine: batch definition, local JSON persistence, deterministic queue, and `tickBatchWorker` processing one item through the existing Studio pipeline.
- Failure isolation. Succeeded, quality-blocked, and source-insufficient items are not auto-regenerated. A failed item can be explicitly requeued without calling the provider.
- Rate-limit handling: one automatic batch retry, separate from the Gemini adapter's single transient HTTP retry.
- Crash recovery: a still-running item may be reclaimed once. A second observation past that limit marks it failed and does not call the provider again for that reclaim.
- Production Inbox lanes, including `generated`. `generated` is not an editorial status. Handoff does not register `/content-review`.
- Batch Control Surface: create, queue, tick one item, pause, resume, recover, and show the inbox. The tick is operator-triggered.
- Editorial CMS Workspace at `/content-studio/editor/[batchId]/[itemId]`, with header, content editor, provenance, quality, notes, and history panels.
- Editorial workflow only: `needs_editing`, `ready_for_review`, `changes_requested`, and `ready_for_approval`. This is an authoring workflow. It is not the canonical publication system.
- Compare-and-swap revision save. A stale revision is rejected and is not written.
- Write-through copies the editorial production onto the batch draft only. Replay repairs an unequal copy through `replayEditorialWriteThrough` and does not merge or delete.
- Persistence-failure state: neither draft body is rendered. A corrupt editorial file stays in place, and replay is withheld when that record cannot be read. Missing batch, invalid parameters, and production mode use `notFound()`.
- Opening a draft with no editorial file returns in-memory `needs_editing` at revision 0 and does not write a file or change canonical content.
- Browser verification of `/content-studio`, `/content-review`, a valid editor route, a missing batch, and an invalid parameter. Approve and Publish were disabled. The editor did not present the draft as published.
- Verification: `verify:editorial-workspace`, `verify:content-studio`, `verify:batch-engine`, `verify:batch-control`, `verify:batch-recovery`, `verify:content-review`, `verify:content-quality`, `verify:content-production`, `tsc --noEmit`, `diff:check`, and `npm run build`.

Quality, editorial status, batch item state, and canonical publication remain four separate axes.

The legacy Geography payload in `src/lib/geography-data.ts` remains legacy reference for the current study surface. It is not the universal content-quality standard. New canonical Geography batches are separate production packages. They have not all been migrated, and they are not published by this workspace.

### ARCHITECTURE-ONLY

- SAJIB ATLAS / SAJLAS brand surfaces, domains, and a separate SAJLAS application.
- The V10.7 possibility map: SAJLAS Assess, SAJLAS API, institutional, recruitment, creator, publishing, and independent ventures.
- Native Android and iOS applications. Mobile-ready contracts exist. The apps do not.
- A future database or cloud worker behind the same batch and editorial contracts.

### DEFERRED

These editorial observations were left unchanged on purpose:

- `file-store.ts` `list()` parses JSON outside the `load()` failure path.
- The memory editorial store does not enforce the byte cap. The file store does.
- `updateBatchItemDraft` reports `stale content version` when `completedAt` differs, while one spec sentence names that reload refusal `persistence failure`. Commit and replay still fail closed.
- Approve and Publish keep those labels. The not-available sentence is beside the disabled buttons.
- The quality panel prints `FAIL` next to a blocked report's raw value.
- The header does not use the exact phrase `NOT PUBLICLY DELIVERABLE`.
- A block payload text edit is sent only when the existing `payload.text` is a string.

Lint still fails only on three pre-existing findings, which this work does not change:

- `src/components/content-studio/StudioForm.tsx` — `react-hooks/set-state-in-effect`
- `src/lib/content-studio/source-packet.ts` — unused `_identity`
- `src/lib/geography-data.ts` — unused `banglaSummaries`

### NOT YET IMPLEMENTED

- Canonical approval and publication of Studio or editorial drafts.
- Supabase, a new database, authentication, RBAC, and commerce processing.
- Geography Batch #5, publication of the existing draft packages, and migration of legacy `src/lib/geography-data.ts`.
- Push or merge. This work is local on `feature/editorial-cms-workspace` in `sajib-atlas-editorial-cms`. The original `feature/content-production-studio` workspace is separate.

Canonical Geography packages, the review registry, the Quality Gate, the production workflow, assessment, learner state, and search were not modified by the Editorial CMS.
