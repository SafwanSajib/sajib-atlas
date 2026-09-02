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

# DOCUMENT_MAP.md — V10.6 DOCUMENTATION GRAPH

## Authority Graph

```text
                    MASTER VISION V10.6
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
   ARCHITECTURE        ROADMAP            PRINCIPLES
        │                  │
        ├──────────┬───────┼───────────┐
        │          │       │           │
   DEVELOPMENT  SECURITY  CURRENT     AGENTS
     RULES                STATE
        │
        └──────────── DOCUMENT MAP
```

## Files

### `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
Strategic destination and constitutional product/business architecture.

### `AGENTS.md`
Instructions for AI/software agents working in the repository.

### `ARCHITECTURE.md`
Concrete architectural boundaries and domain relationships.

### `CURRENT_STATE.md`
What is actually implemented now.

### `DEVELOPMENT_RULES.md`
Engineering constraints and implementation discipline.

### `ROADMAP.md`
Prioritized evolution sequence.

### `SECURITY.md`
Security, privacy, AI safety, abuse prevention, and commercial integrity.

### `DOCUMENT_MAP.md`
Relationship and authority map for the documentation set.

### `docs/TOPIC_ENGINE.md`
Phase 2 Universal Topic Engine: orchestration boundary, lifecycle, and
capability model. Implementation lives in `src/lib/topic-engine/`. Not an
authority document; it describes the implemented engine.

### `docs/IDENTITY.md`
Phase 7A Identity Foundation: canonical learner identity, modes, and
resolution. Implementation lives in `src/lib/identity/`. Not authentication
and not an authority document.

### `docs/ENTITLEMENT.md`
Phase 7B Entitlement & Access Foundation: classification, exact matching,
ownership, and temporal access rules. Implementation lives in
`src/lib/entitlement/`. Not payment and not an authority document.

### `docs/COMMERCE.md`
Phase 7C Commerce Foundation: Product, Order, Purchase, Payment, and the
purchase → entitlement proposal boundary. Implementation lives in
`src/lib/commerce/`. Not checkout and not an authority document.

### `docs/PHASE7.md`
Phase 7D integration gate over Identity, Entitlement, and Commerce.
Implementation lives in `src/lib/phase7/`. Not Phase 8.

### `docs/PLATFORM.md`
Phase 8A–8D platform foundation: envelope, client surface, version,
error, pagination, capability discovery, and hardened GET `/api/v1`
transport over Phase 1J. Implementation: `src/lib/platform/` and
`src/app/api/v1/`.

### `docs/PHASE8.md`
Phase 8E integration gate over 8A–8D. Verifier: `npm run verify:phase8`.
Not Android/iOS, authentication, or extra product APIs.

### `docs/MOBILE.md`
Phase 9A–9D mobile client architecture for Web, Android, and iOS over
Phase 8 contracts. Implementation: `src/lib/client/`. Not an app, not
React Native/Flutter, and not an authority document.

### `docs/PHASE9.md`
Phase 9E integration gate over 9A–9D. Verifier: `npm run verify:phase9`.
Not Android/iOS apps, authentication, or extra product APIs.

Phase 3A assessment domain contracts live in `src/lib/assessment-engine/`.
They are not a second assessment-set registry and do not own Geography MCQs.

Phase 3B universal MCQ scoring lives in `src/lib/assessment-engine/scoring.ts`.
It is not a payload adapter, not a second question registry, and not UI
scoring. Legacy UI scoring remains `src/lib/assessment/scoring.ts`.

Phase 3C universal MCQ payload adapter lives in
`src/lib/assessment-engine/payload-adapter.ts`. Canonical Geography MCQs
remain in `src/lib/geography-data.ts`. The adapter references that payload
and does not duplicate it.

Phase 3D universal MCQ delivery lives in `src/lib/assessment-engine/delivery.ts`.
It consumes the adapter and returns a public, answer-safe `AssessmentDelivery`
in practice mode.

Phase 3E in-memory session lifecycle lives in `src/lib/assessment-engine/session.ts`.
Sessions are execution state, not learner history or persistence. Completion
reuses Phase 3B scoring.

Phase 3F assessment result/outcome boundary lives in
`src/lib/assessment-engine/result.ts`. It validates and constructs completed
`AssessmentResult` values from Phase 3B scores. It is not learner intelligence.

Phase 3G Assessment Engine validation lives in
`src/lib/assessment-engine/verify-engine.ts`. It is a composition gate over
Phases 3A–3F, not a second engine or registry.

Phase 3H Assessment Engine integration lives in
`src/lib/assessment-engine/verify-integration.ts`. It is the readiness gate
for future UI/API/mobile consumers. Those consumers are not implemented.

Phase 4 Learner Intelligence lives in `src/lib/learner-intelligence/`.
It interprets Assessment Engine results. It is not `src/lib/learner/`
identity and not the UI learner store.

Phase 4B Learner Intelligence verification lives in
`src/lib/learner-intelligence/verify-intelligence-integration.ts`. It is a
gate, not a second intelligence engine.

Phase 5 Search & Knowledge Retrieval lives in `src/lib/search/`. It
projects canonical catalogs into search documents. It is not
`src/lib/search-data.ts` (legacy topic substring helper) and not AI
retrieval.

Phase 6A AI Intelligence Foundation lives in `src/lib/ai-intelligence/`.
It is a provider-agnostic boundary over Search. It is not a chatbot
and not RAG.

Phase 6B provider + grounded answering lives in `src/lib/ai-providers/xai/`.
It implements `AiProvider` for xAI/Grok. Core contracts do not import it.

Phase 6C RAG-ready retrieval and context assembly live in
`src/lib/ai-intelligence/retrieve.ts` and `assemble.ts`. Vector RAG is
not implemented.

Phase 6D Ask experience lives at `/ai` with server action
`src/lib/ai-experience/ask.ts` and thin POST `/ai/ask`. Application
logic is `src/lib/ai-experience/service.ts`. It is a grounded knowledge
assistant, not a generic chatbot and not a public REST `/api/ai`.

Phase 6E provider routing lives in `src/lib/ai-providers/router.ts` with
Gemini primary (`src/lib/ai-providers/gemini/`) and xAI fallback.
LiteLLM is not used.

Phase 7A Identity Foundation lives in `src/lib/identity/`. Canonical
learner identity is `learner/local`. It is not authentication, not
`src/lib/learner/` profile/goals, and not learner state. Notes:
`docs/IDENTITY.md`.

Phase 7B Entitlement & Access Foundation lives in `src/lib/entitlement/`.
It reuses Phase 1H identity and evaluates access. Notes:
`docs/ENTITLEMENT.md`.

Phase 7C Commerce Foundation lives in `src/lib/commerce/`. Product, Order,
Purchase, and Payment are separate. Notes: `docs/COMMERCE.md`.

Phase 7D integration gate lives in `src/lib/phase7/`. Notes:
`docs/PHASE7.md`.

Phase 8A Platform Foundation design lives in `docs/PLATFORM.md`.
Phase 8B TypeScript contracts live in `src/lib/platform/`.
Phase 8C HTTP transport lives at `src/app/api/v1/` via
`src/lib/platform/http.ts`. Phase 8D hardens that transport. Phase 8E
is the integration gate (`docs/PHASE8.md`, `npm run verify:phase8`).
Phase 9A mobile client architecture lives in `docs/MOBILE.md`. Phase 9B
shared client adapter lives in `src/lib/client/`. Phase 9C is the
client state/offline boundary. Phase 9D is the Web integration gate.
Phase 9E is the integration gate (`docs/PHASE9.md`, `npm run verify:phase9`).
Next increment is not started.

## Version Rule

All files in this set are **V10.6**.

If the Master Vision changes version:

1. update the Master Vision
2. update document-control headers
3. review architecture
4. review current state
5. review roadmap
6. review security
7. review agents/rules
8. update this map

No document may silently claim a different architecture baseline.

## Conflict Rule

Implementation reality beats vision.

Security constraints beat convenience.

Canonical knowledge beats duplicated presentation data.

Current state is factual, not aspirational.

## Historical / not authoritative

`SajibAtlas-Master-Context-v2.md` is a pre-V10.6 context pack. It is not in
the authority graph. Phase 0E confirmed it is superseded; it is not restored.
See `docs/decisions/0001-master-context-v2-superseded.md`.
