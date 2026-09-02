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

# ROADMAP.md — V10.6 PRODUCT & ENGINEERING ROADMAP

## Phase 0 — Stabilize Current Web

- finish current Web learning flows
- stabilize routing
- stabilize topic/content data
- stabilize MCQ practice
- maintain build health
- improve accessibility/performance
- establish clean domain boundaries

## Phase 1 — Platform Foundations

- identity architecture
- profile/goals
- analytics event model
- entitlement abstraction
- commerce boundary
- content/version metadata
- API-ready contracts

## Phase 2 — Learning Intelligence

First increment (implemented): **Universal Topic Engine**

- subject-independent topic resolution, lifecycle, capabilities, composition,
  navigation, and inspect
- code: `src/lib/topic-engine/`
- notes: `docs/TOPIC_ENGINE.md`

Later increments (not started):

- progress model
- weakness detection
- confidence tracking
- spaced repetition
- adaptive practice
- personalized study recommendations

## Assessment Engine (implemented increment; not Roadmap AI Foundation)

Implemented: **Universal MCQ Assessment Engine**

- contracts, scoring, payload adapter, delivery, in-memory session, result
- code: `src/lib/assessment-engine/`
- identity remains Phase 1D `src/lib/assessment/`
- Geography MCQs remain in `src/lib/geography-data.ts`
- verification: `npm run verify:assessment-engine` and
  `npm run verify:assessment-integration`
- only MCQ is concrete; other modalities are reserved vocabulary
- UI integration, learner intelligence, analytics collection, HTTP API,
  mobile clients, persistence, entitlement, and commerce remain deferred
- existing `MCQPractice.tsx` still uses `src/lib/assessment/scoring.ts`

This increment is distinct from Roadmap Phase 3 — AI Foundation below,
which is not started.

## Learner Intelligence (implemented increment)

Implemented: **deterministic AssessmentResult ingestion**

- code: `src/lib/learner-intelligence/`
- topic progress, assessment performance, performance states, sessionId
  idempotency, local-first compatibility
- not mastery prediction, AI recommendations, adaptive testing, or UI
- verification: `npm run verify:learner-intelligence` and
  `npm run verify:learner-intelligence-integration`

Roadmap Phase 2 later increments (weakness detection, spaced repetition,
adaptive practice, personalized recommendations) remain not started.

## Search & Knowledge Retrieval (implemented increment)

Implemented: **deterministic lexical search foundation**

- code: `src/lib/search/`
- SearchDocument projection of canonical catalogs; in-memory index
- matching: title / keywords / searchText / identifiers
- ranking: explicit field weights; tie-break by canonical id
- empty query returns no results; bounded `limit`
- not embeddings, vector search, RAG, HTTP, or a UI redesign
- existing `searchTopics` remains compatible
- verification: `npm run verify:search`

Roadmap Phase 3 — AI Foundation (semantic retrieval, RAG, AI tutor) remains
not started.

## AI Intelligence (implemented increment)

Implemented: **Phase 6A provider-agnostic AI boundary**

- code: `src/lib/ai-intelligence/`
- request/context/response/safety contracts; Search retrieval adapter
- no vendor SDK, embeddings, RAG, chat UI, or HTTP
- verification: `npm run verify:ai-intelligence`

Implemented: **Phase 6B real provider + grounded answering**

- adapter: `src/lib/ai-providers/xai/` (xAI/Grok, server-only `XAI_API_KEY`)
- retrieval-required knowledge answers; `insufficient_context` when weak
- verification: `npm run verify:ai-provider`

Implemented: **Phase 6C grounded experience + RAG-ready contracts**

- `KnowledgeRetriever` over Phase 5 lexical search
- context assembly, grounding states, answer styles, source attribution
- verification: `npm run verify:ai-grounded-answering`

Implemented: **Phase 6D grounded Ask experience**

- route: `/ai`
- transports: Server Action `src/lib/ai-experience/ask.ts` and POST `/ai/ask`
- application service: `src/lib/ai-experience/service.ts`
- verification: `npm run verify:ai-experience`

Implemented: **Phase 6E multi-provider routing & cost optimization**

- primary: Gemini `gemini-2.5-flash` (`src/lib/ai-providers/gemini/`)
- fallback: xAI, eligible transient failures only
- router: `src/lib/ai-providers/router.ts`
- verification: `npm run verify:ai-provider-routing`

Later Phase 6 work (vector RAG, web retrieval, memory, agents, public REST
AI API) is not started.

Implemented increment: **Phase 7A Identity Foundation**

- code: `src/lib/identity/`
- canonical local identity remains `learner/local`
- authentication, sessions, JWT, and login UI are not implemented
- verification: `npm run verify:identity`

Implemented increment: **Phase 7B Entitlement & Access Foundation**

- code: `src/lib/entitlement/`
- public catalog remains free; protected access is fail-closed
- verification: `npm run verify:phase7b`

Implemented increment: **Phase 7C Commerce Foundation**

- code: `src/lib/commerce/`
- Product / Order / Purchase / Payment remain separate
- payment does not grant access; purchase proposes entitlement only
- verification: `npm run verify:phase7c`

Implemented increment: **Phase 7D Integration & Hardening Gate**

- code: `src/lib/phase7/`
- composes 7A–7C; payment does not grant access
- verification: `npm run verify:phase7`

Designed increment: **Phase 8A Platform Foundation Design**

- notes: `docs/PLATFORM.md`
- reuses Phase 1J envelope, versions, and errors
- client surface ≠ canonical learner identity
- no HTTP, mobile app, auth, or database

Implemented increment: **Phase 8B Platform Contracts**

- code: `src/lib/platform/`
- reuses Phase 1J envelope and error codes
- verification: `npm run verify:phase8b`

Implemented increment: **Phase 8C HTTP / Client Transport**

- routes: `/api/v1/capabilities`, `/api/v1/identity`, `/api/v1/topics`
- transport: `src/lib/platform/http.ts`
- verification: `npm run verify:phase8c`

Implemented increment: **Phase 8D API Foundation Hardening**

- version, envelope, pagination, fail-closed topic access
- verification: `npm run verify:phase8d`

Implemented increment: **Phase 8E Platform Integration Gate**

- audits 8A–8D; no new product APIs
- verification: `npm run verify:phase8`
- notes: `docs/PHASE8.md`

Phase 8 foundation is closed.

Designed increment: **Phase 9A Mobile Client Architecture**

- notes: `docs/MOBILE.md`
- Web / Android / iOS consume the same Phase 8 contracts
- no Android/iOS app, auth, database, or new product APIs

Implemented increment: **Phase 9B Shared Client Adapter**

- code: `src/lib/client/`
- reuses Phase 8 envelope and existing engines
- verification: `npm run verify:phase9b`

Implemented increment: **Phase 9C Client State & Offline Boundary**

- in-memory server cache vs local learner store
- verification: `npm run verify:phase9c`

Implemented increment: **Phase 9D Web Client Integration Gate**

- Web uses `src/lib/client/web.ts`; search still delegates to search-data
- verification: `npm run verify:phase9d`

Implemented increment: **Phase 9E Mobile Foundation Integration Gate**

- audits 9A–9D; no Android/iOS app
- verification: `npm run verify:phase9`
- notes: `docs/PHASE9.md`

Phase 9 client foundation is closed. Next increment is not started. Do
not add Android/iOS apps, authentication, or extra product APIs until
that increment is designed.

## Phase 3 — AI Foundation

- retrieval-grounded AI
- AI tutor
- explanation workflows
- screenshot/question workflow
- usage quotas
- model routing
- cost monitoring

## Phase 4 — Responsible Growth

- Micro-Wins
- commitment cards
- verified social proof
- streaks
- badges
- contextual rankings
- shareable progress
- referral loop
- Study Squads

## Phase 5 — Community

- doubt solving
- peer answers
- reputation
- moderation
- correction workflow
- knowledge versioning
- contributor incentives

## Phase 6 — Mobile

- shared API/data contracts
- Android client
- iOS client
- push notifications
- selective offline learning

Implementation design (not the vision Android/iOS apps): **Phase 9A**
(`docs/MOBILE.md`). Shared contracts exist via Phase 8. Android/iOS
clients, push, and offline apps are not started.

## Phase 7 — Monetization Expansion

- B2C premium
- AI plans
- exam products
- resource commerce
- creator economy
- professional products

## Phase 8 — Institutional

- multi-tenancy
- institution dashboard
- teacher workflows
- learner management
- licensing
- institutional analytics

## Phase 9 — B2B / API

- knowledge APIs
- assessment APIs
- AI APIs
- LMS integrations
- enterprise products

## Priority Rule

Do not execute every phase at once.

Use repository evidence, user demand, unit economics, security, and operational
capacity to determine when a phase is ready.

## Definition of Progress

Progress means:

**USER VALUE + TECHNICAL HEALTH + TRUST + ECONOMIC SUSTAINABILITY**

not feature count.
