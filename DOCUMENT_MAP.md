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
Product, brand, and platform expansion claims are not implemented unless
`CURRENT_STATE.md` and the repository confirm them.

# DOCUMENT_MAP.md — V10.7 DOCUMENTATION GRAPH

## Authority Graph

```text
                    MASTER VISION V10.6
                           │
                    V10.7 PRODUCT / BRAND /
                    PLATFORM EXPANSION SPEC
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

V10.7 brand/product layering is authoritative for brand surfaces, product
layering, and expansion governance. It does not replace canonical content
architecture or V10.6 phase history. Implementation that follows it is
recorded in `CURRENT_STATE.md`.

## Files

### `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
V10.6 strategic destination and constitutional product/business architecture.
Historical North Star. Not rewritten by V10.7.

### `docs/superpowers/specs/2026-09-04-v10-7-product-brand-platform-expansion-architecture.md`
Authoritative detailed V10.7 Product, Brand & Platform Expansion
Architecture. Documentation only. Does not change the strategic architecture.
Later Content Studio and Editorial CMS implementation is recorded in
`CURRENT_STATE.md`.

### `AGENTS.md`
Instructions for AI/software agents working in the repository. Active
baseline is V10.7.

### `AI_HANDOFF_V10_6.md`
Historical V10.6-named handoff file. Active baseline inside the file is
V10.7. Do not treat the filename as the current architecture version.

### `CLAUDE.md`
Claude entry point. Active baseline is V10.7.

### `ARCHITECTURE.md`
Concrete architectural boundaries and domain relationships. Sections 1–13
are the V10.6 engineering architecture. Section 14 is the canonical
high-level V10.7 summary and points to the detailed specification.

### `CURRENT_STATE.md`
What is actually implemented now. V10.7 brand expansion is documentation-only.
Content Studio, the batch engine, and the Editorial CMS are implemented
authoring tools, not publication.

### `DEVELOPMENT_RULES.md`
Engineering constraints and implementation discipline.

### `ROADMAP.md`
Prioritized evolution sequence. V10.7 is the current architectural
evolution; Phase 0–9F and later vision phases remain historical or future.

### `SECURITY.md`
Security, privacy, AI safety, abuse prevention, and commercial integrity.
V10.7 does not change the security architecture.

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
Phase 9F hardens client/envelope resilience. Canonical Geography publication
readiness remains a content checkpoint. V10.7 brand expansion does not start
a new product increment. Content Studio and the Editorial CMS are authoring
tools recorded in `CURRENT_STATE.md`, not a new public phase.

### Canonical content architecture (authoritative; unchanged by V10.7)

These remain the content-architecture authorities. Brand/product strategy
does not replace them.

- `docs/superpowers/specs/2026-09-03-universal-content-schema-design.md`
- `docs/superpowers/specs/2026-09-03-editorial-source-provenance-spec.md`
- `docs/superpowers/specs/2026-09-03-canonical-content-production-pipeline.md`
- `docs/superpowers/specs/2026-09-03-automated-content-quality-gate.md`
- `docs/superpowers/specs/2026-09-03-live-canonical-content-review-architecture.md`
- `docs/superpowers/reviews/2026-09-03-canonical-development-resume-checkpoint.md`

Phase notes under `docs/PHASE7.md`, `docs/PHASE8.md`, `docs/PHASE9.md`,
`docs/IDENTITY.md`, `docs/ENTITLEMENT.md`, `docs/COMMERCE.md`,
`docs/PLATFORM.md`, `docs/MOBILE.md`, and `docs/TOPIC_ENGINE.md` remain
V10.6 historical implementation records. Do not rewrite them merely to
display a newer version number.

## Version Rule

The **active architecture baseline is V10.7**.

Distinguish three layers:

1. **Historical V10.6 foundation** — Phase 0–9F engineering, Master Vision
   document, phase notes, audits, reviews, and provenance records.
2. **Current V10.7 active architecture** — Product, Brand & Platform
   Expansion specification. Content Studio and the Editorial CMS are
   implemented authoring tools recorded in `CURRENT_STATE.md`. They do
   not replace that specification.
3. **Future roadmap concepts** — NEXT/FUTURE capabilities that are not
   implemented.

Do not globally replace historical "V10.6" strings. Do not fabricate a
V10.7 implementation history.

If the active architecture version changes again:

1. preserve historical records
2. update active document-control headers
3. review architecture
4. review current state
5. review roadmap
6. review security
7. review agents/rules
8. update this map

No active document may silently claim a different architecture baseline.

## Conflict Rule

Implementation reality beats vision.

Security constraints beat convenience.

Canonical knowledge beats duplicated presentation data.

Current state is factual, not aspirational.

## Historical / not authoritative

`SajibAtlas-Master-Context-v2.md` is a pre-V10.6 context pack. It is not in
the authority graph. Phase 0E confirmed it is superseded; it is not restored.
See `docs/decisions/0001-master-context-v2-superseded.md`.
