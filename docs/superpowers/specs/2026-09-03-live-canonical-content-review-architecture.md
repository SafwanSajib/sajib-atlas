# Live Canonical Content Review Architecture

**Date:** 2026-09-03  
**Status:** Architecture ready for review  
**Scope:** Post-Phase-9F, design-only; no review route or UI is implemented by this document.

## 1. Purpose

Define a future development-mode browser surface that lets an editor inspect
canonical content, provenance, lifecycle, version, integration projections, and
deterministic Content Quality Gate results without reading source files.

The surface is a read-only consumer of canonical production data. Rendering
content is never equivalent to approval, publication, or production readiness.

## 2. Current Architecture Context

Sajib Atlas is a modular monolith with API-ready, mobile-ready contracts. The
repository is the implementation source of truth.

Relevant current boundaries:

- `src/lib/content/types.ts` owns canonical topic identity and existing metadata.
- `src/lib/content/manifest.ts` owns the canonical topic registry and hierarchy
  references.
- `src/lib/contracts/` owns JSON-safe identity/read projections.
- `src/lib/content/pilot/` owns the universal pilot package, projections, and
  validation.
- `src/lib/content-quality/` owns deterministic quality validation.
- `src/lib/content/production/` owns workflow transitions, human review
  records, quality evaluation, publication eligibility, and corrections.
- `src/lib/content/delivery.ts` exposes the existing published topic delivery
  projection.
- Assessment Engine owns delivery/session/scoring/results.
- Learner Intelligence owns performance derivation and projections.
- Search owns retrieval and ranking.
- AI Intelligence and providers own retrieval-grounded answering and provider
  isolation.
- `src/store/learner/` owns local learner-private state.

The current production workflow operates on the approved `PilotPackage` model.
It is intentionally in-memory and does not provide a CMS, durable editorial
store, authentication, or a review browser.

## 3. Problem Statement

New canonical packages can be validated and moved through a production
workflow, but an owner currently lacks a single browser view that combines the
actual canonical content with the evidence and machine checks that govern it.

Directly rendering package objects would make visual inspection possible but
would risk leaking internal fields, exposing answer-bearing data, confusing
workflow state with readiness, and creating a second interpretation of content.

## 4. Goals

The future design must:

1. inspect discipline → subject → category → topic → concept → Knowledge Unit →
   Content Block hierarchy;
2. render canonical content using the same package and projections used by
   production;
3. display editorial metadata, provenance, version, lifecycle, and review
   records;
4. display deterministic quality dimensions as pass, warning, fail, or not
   evaluated;
5. show publication, Search, AI-grounding, assessment-reference, and
   learner-reference status without taking ownership of those domains;
6. support multi-subject content without Geography-specific assumptions;
7. run locally in development first;
8. remain strictly read-only and deterministic.

## 5. Non-Goals

This design does not implement:

- a route, React component, API endpoint, or browser automation;
- editing, approval, publication, deprecation, archiving, or source mutation;
- a CMS, database, cloud storage, authentication, or SaaS dependency;
- new assessment questions, answer keys, scoring, Search ranking, AI answers,
  provider calls, or learner-state changes;
- Geography migration or rewriting;
- a parallel preview content schema;
- native Android/iOS implementation;
- production authorization for an eventual hosted editorial tool.

## 6. Design Principles

1. Canonical content is the only content authority.
2. Production workflow state and content lifecycle remain distinct.
3. Validation and projections are reused, not reimplemented in UI.
4. Content rendering and audit/quality rendering are separate concerns.
5. Read-only means no mutation capability, not merely hidden buttons.
6. Public-safe, review-safe, and server-only fields are explicitly separated.
7. Assessment, Search, AI, learner, entitlement, commerce, and identity
   authorities remain unchanged.
8. Deterministic ordering and stable identifiers are required.
9. Evidence status must not be represented as psychological confidence or
   predictive ability.
10. Subject extensions stay outside universal-core assumptions.

## 7. Current Canonical Content Flow

The current universal pilot/production path is:

```text
PilotPackage
  → production workflow record
  → publication candidate
  → Content Quality Gate
  → editorial and academic-source review
  → approved/published workflow state
  → Search and AI/learner projections
```

The existing study route is separate and legacy-oriented:

```text
Geography route
  → legacy Geography payload
  → canonical topic identity/metadata lookup
  → published topic delivery check
  → TopicStudyPage
  → study content and Assessment Engine integration
```

The future review flow should be:

```text
canonical package + ProductionRecord
  → canonical quality evaluation or frozen report
  → read-only ReviewProjection
  → development browser review surface
```

The review flow must not ingest `geography-data.ts` as canonical production
content.

## 8. Candidate Architectures

### Option A — Direct rendering of canonical content packages

The route reads a `PilotPackage` and renders its fields directly, calling
existing validation helpers as needed.

**Advantages:** smallest initial code footprint; no new projection type;
straightforward local development.

**Disadvantages:** couples React to internal package shape; encourages field
filtering and quality calculations in UI; makes lifecycle and leakage controls
easy to bypass; repeated consumers may diverge.

**Coupling:** high coupling to authoring/package internals and validator
implementation details.

**Safety:** weakest. A future field addition could accidentally expose claims,
internal metadata, or assessment-adjacent data.

**Complexity:** low initially, increasing with every consumer and security rule.

**Future scalability:** poor for a hosted editor or mobile-compatible review
consumer.

**Compatibility:** superficially compatible, but creates pressure to modify
canonical packages for presentation needs.

### Option B — Dedicated validated Review Projection

An additive pure projection accepts canonical content plus a `ProductionRecord`
and emits a read-only, JSON-safe review model. It reuses the existing quality
gate and Search/AI/learner/assessment projections without exposing their
private payloads.

**Advantages:** one explicit leakage boundary; stable browser-facing contract;
clear separation between content renderer and audit metadata; deterministic
testing; future clients can consume the projection.

**Disadvantages:** requires maintaining a small additive projection contract;
the projection must be updated when canonical fields or quality dimensions
change.

**Coupling:** controlled coupling to canonical package, workflow, quality, and
existing projections through explicit adapters.

**Safety:** strongest while remaining within the current modular monolith.

**Complexity:** moderate and bounded.

**Future scalability:** supports a later CMS or authenticated editorial client
without changing canonical content contracts.

**Compatibility:** additive; existing study, API, assessment, Search, AI, and
learner boundaries remain unchanged.

### Option C — Separate editorial/review application architecture

Create a separate application or service that receives canonical content and
maintains its own review-facing model.

**Advantages:** independent deployment and stronger future operator isolation;
could later support multi-user editorial workflows.

**Disadvantages:** premature infrastructure; duplicate contracts or transport;
requires synchronization, authorization, audit retention, and failure handling;
creates a second content interpretation unless carefully constrained.

**Coupling:** operationally high through synchronization and version contracts.

**Safety:** potentially strong after substantial authorization and audit work,
but unsafe as an unauthenticated local first step.

**Complexity:** high and unjustified without durable editorial requirements.

**Future scalability:** highest only after the repository has a real editorial
team, persistence, authorization, and operational needs.

**Compatibility:** risks changing current boundaries and delaying content
validation feedback.

Option B is recommended.

## 9. Recommended Architecture

Add a pure, read-only `ReviewProjection` boundary under the content domain.
Conceptually:

```text
PilotPackage
  + ProductionRecord
  + ContentQualityReport (or explicit not-evaluated state)
  + existing projections
      ↓
ReviewProjection
      ↓
development-only browser route
      ↓
separate content renderer + audit metadata renderer
```

The projection is not a preview content model. It contains references and
sanitized views of the canonical package, preserving canonical IDs, versions,
and order. It must never be able to transition workflow state or mutate source
objects.

A future implementation should place the contract and pure builder in a
content review module, for example `src/lib/content/review/`, without changing
the existing production workflow API.

## 10. Source of Truth

The source of truth is the canonical `PilotPackage` together with its
corresponding `ProductionRecord`.

Rules:

- The package supplies hierarchy, content blocks, claims, sources, references,
  objectives, and assessment alignment references.
- The production record supplies workflow state, review records, publication
  timestamp, superseded version, and the stored quality report.
- If no quality report exists, the projection must say `NOT EVALUATED`; it must
  not run a silently different quality calculation in the browser.
- A package must not be treated as published merely because its lifecycle field
  is rendered.
- Published delivery remains governed by `isProductionDeliveryEligible`.
- The existing `CanonicalTopic`/`TopicRead` models remain authoritative for the
  established catalog, not a replacement for the universal package.

## 11. Review Projection Boundary

The projection should expose these groups:

```text
identity:
  disciplineId, subjectId, categoryId, topicId, canonical title
editorial:
  aliases, concepts, objectives, audience, level, scope, validity
content:
  KnowledgeUnits → ordered ContentBlocks → sanitized payload
provenance:
  claims, source references, source summaries, classifications, statuses
lifecycle:
  workflowState, content lifecycle, contentVersion, publication timestamp,
  supersedesVersion
quality:
  report state, overall status, dimensions, issues, publication readiness
integrations:
  assessment references, Search projection status, AI eligibility,
  learner-reference validity
```

The projection should normalize quality into:

- `PASS` for a passing dimension;
- `WARNING` for non-blocking issues;
- `FAIL` for a blocked dimension or report;
- `NOT EVALUATED` when no frozen report is attached.

The underlying quality vocabulary (`pass`, `warning`, `blocked`) remains
unchanged; the display labels are presentation-only.

Assessment alignment is reference metadata only. No question array, response,
answer key, correctness, score, or learner result belongs in the projection.

## 12. Lifecycle Model

The workflow states remain:

```text
draft → review → approved → published → deprecated → archived
```

Review visibility:

| State | Previewable | Public-deliverable | AI-groundable | Publishable |
|---|---:|---:|---:|---:|
| draft | yes, local review only | no | no | no |
| review | yes, local review only | no | no | no |
| approved | yes, local review only | no until published | no | yes |
| published | yes | yes if quality report passes | yes if existing AI projection is eligible | already published |
| deprecated | yes, explicitly marked historical | no | no | no |
| archived | yes, explicitly marked archived | no | no | no |

These are review display rules, not new lifecycle semantics. The browser must
show workflow state and package lifecycle separately where they differ.

## 13. Quality Gate Integration

The safest architecture is to consume a frozen `ContentQualityReport` stored
on the `ProductionRecord`. The production workflow already evaluates the same
package through `validateContentQuality`; the review surface should display
that report rather than independently reconstructing checks.

For a draft or review record with no report, the projection may offer an
explicit server/development action in a future design to evaluate and attach a
report, but the read-only viewer itself must only display `NOT EVALUATED`.
There must be no browser-only quality result that can disagree with publication
evaluation.

The projection should preserve dimension, issue code, severity, path, and
message. It should also display the overall report and the publication
readiness dimension. A rendered package is never evidence of readiness.

## 14. Rendering Boundary

Use two conceptual renderers:

1. **Canonical content renderer:** topic summary, objectives, concepts,
   Knowledge Units, ordered blocks, terminology, examples, procedures, and
   subject extensions.
2. **Review metadata renderer:** lifecycle, version, review records, claims,
   sources, quality dimensions, readiness, and integration status.

The content renderer must preserve block order and semantic block type. It
should not infer facts, rewrite claims, or generate missing content.

The metadata renderer must be visually and semantically distinct, with explicit
labels such as `NOT EVALUATED`, `DRAFT`, and `NOT PUBLICLY DELIVERABLE`.
Quality colors must not be the only status signal; text and accessible labels
are required.

## 15. Search Integration

The review projection should consume `projectPilotToSearch` or an equivalent
existing Search projection boundary to show:

- whether projections exist;
- which canonical IDs are represented;
- content version and lifecycle;
- whether the content is eligible for Search.

It must not create a review-specific index, query parser, ranking score, or tie
breaker. Search ranking remains owned by the existing Search module.

Unpublished content may be visible in local review metadata, but it must not be
represented as publicly searchable merely because a projection can be built.

## 16. AI Integration

The review surface should show the result of existing AI grounding eligibility
logic and, where safe, a count/list of canonical grounding references:

- eligibility status;
- content version;
- Knowledge Unit/block identity;
- source-reference IDs and interpretation status.

It must not call an AI provider, generate an answer, display provider
configuration, display provider responses, or create a second retrieval path.
AI eligibility remains gated by published lifecycle, quality outcome, and the
existing grounding projection.

## 17. Assessment Integration

The review surface may show assessment alignment IDs, target objectives,
concepts, Knowledge Units, assessment-set IDs, item-reference IDs where already
present, and aligned content version.

It must not show question payloads or answer keys. It must not call scoring,
create sessions, record responses, or derive correctness. Assessment Engine
remains the sole scoring authority, and alignment remains a reference from
content to assessment rather than an embedded assessment model.

## 18. Learner Integration

The review projection may show whether learner references are structurally valid
and which Knowledge Unit references are eligible for learner projection.

It must not include learner identity, progress, completion, assessment history,
performance, revision queue, local storage, or private learner state. The
review surface does not simulate a learner and does not mutate learner state.
Learner Intelligence remains the sole performance/projection authority.

## 19. Legacy Geography Isolation

`src/lib/geography-data.ts` is explicitly **LEGACY / REFERENCE ONLY**.

The review catalog must be built from canonical pilot/production packages, not
by scanning Geography payloads. It must use an explicit package registry or
production-record input and reject legacy-shaped objects that lack the
universal package contract.

If legacy inspection is ever useful, it should be a separate clearly labeled
reference view with:

- no canonical production status;
- no quality-gate promotion;
- no Search/AI grounding eligibility;
- no correction/version workflow;
- no automatic conversion or migration.

The existing Geography study route remains a user-facing study route and must
not be conflated with the developer/editor review route.

## 20. Multi-Subject Universality

The projection is keyed by universal fields: discipline, subject, category,
topic, concept, Knowledge Unit, block, objective, claim, source, and explicit
references.

Geography, History, English, Mathematics, Science, International Affairs, and
future subjects use the same core projection. Subject-specific semantics belong
in the package `extension` fields and are rendered generically unless a future
subject adapter is explicitly approved.

No reviewer status, block renderer, route parameter, validation rule, or
security rule may assume Geography sections, Geography MCQs, Bangladesh
connections, or Geography-specific terminology.

## 21. Route Architecture

Future review routes should be clearly separate from user-facing study routes.
A clean conceptual structure is:

```text
/content-review
/content-review/[subjectId]
/content-review/[subjectId]/[topicSlug]
/content-review/[subjectId]/[topicSlug]/[knowledgeUnitId]
```

The exact route names may change to match repository conventions, but the
boundary must remain developer/editor-only and must not overlap:

```text
/geography/[topic]
/english/[topic]
/bcs/[topic]
```

The index route lists only locally registered canonical production packages.
Selection resolves canonical identity, not array position. Unknown IDs and
unsupported packages fail closed with a not-found result.

Initial implementation should be development/local-only. If the route is ever
hosted, authentication and authorization must be designed before exposing
unpublished content.

## 22. Review Page Information Architecture

### Header

- subject and discipline;
- category and topic;
- canonical ID;
- workflow state;
- content lifecycle;
- content version;
- publication status;
- explicit delivery eligibility.

### Navigation

- topic overview;
- objectives;
- concepts and aliases;
- Knowledge Units;
- ordered Content Blocks;
- provenance;
- quality dimensions;
- integration references.

### Main content

Render the actual canonical title, summary, objectives, concepts, units, block
types, block payload, scope, validity, audience, level, and extensions. Preserve
semantic distinctions between definition, explanation, process, chronology,
comparison, formula/rule, procedure/derivation, and other typed blocks.

### Evidence/provenance panel

Show claims, interpretation status, support status, source-reference IDs,
citations/locators where present, source type, title, publisher/organization,
language, dates, scope, conflict-group identifiers, and verification metadata.

### Quality panel

Show the overall status, every required dimension, issue code/path/message,
publication readiness, and whether the report is evaluated or not evaluated.

### Integration panel

Show assessment alignments, Search eligibility/projection identity, AI
grounding eligibility, learner-reference validity, content version, and
lifecycle. No private or answer-bearing payload is shown.

## 23. Security/Data Leakage Model

### PUBLIC-SAFE

Suitable for ordinary public catalog/read contracts:

- canonical IDs, titles, hierarchy IDs, hrefs;
- public content metadata and published lifecycle;
- concept and assessment-set identity references;
- approved public content projections;
- published Search-safe fields.

### REVIEW-SAFE

Suitable only for a protected local/development review boundary:

- draft/review/approved/deprecated/archived package content;
- claims, source references, citations, locators, and editorial notes;
- reviewer IDs and timestamps as needed for local audit;
- quality issues and validation paths;
- publication readiness and integration diagnostics;
- content versions and supersession metadata.

Review-safe does not mean safe for an unauthenticated public deployment.

### SERVER-ONLY

Never place in the browser projection:

- answer keys, full assessment payloads, responses, scores, or provider results;
- learner-private state or local learner storage;
- API keys, credentials, tokens, payment data, or internal authorization data;
- raw provider configuration or private infrastructure details;
- unnecessary filesystem paths or implementation internals;
- unpublished data in any public cache or public API response.

The projection must use allowlisted fields rather than serializing the package
and deleting known-bad fields. It must be JSON-safe, immutable by convention,
and tested for forbidden keys.

## 24. Development/Local Runtime Model

The first runtime is a development-mode route backed by deterministic local
module imports. A developer runs the existing application, opens the known
review URL, selects a package, and receives the same canonical content and
quality snapshot that production workflow logic uses.

No database, CMS, external API, cloud persistence, or new dependency is needed.
The review route should be disabled or inaccessible in a production deployment
unless a later authorization design explicitly enables it.

Development loading must be explicit and bounded:

- enumerate registered canonical packages;
- resolve by canonical topic ID;
- build a review projection;
- render read-only data;
- fail closed for missing or malformed records.

It must not dynamically import arbitrary filesystem paths or accept an
unvalidated package path from a query string.

## 25. Future Production Evolution

The local review projection can later sit behind:

```text
Editorial CMS
  → canonical package/version store
  → automated quality gate
  → human editorial and academic review
  → read-only review projection
  → approval/publication workflow
  → public delivery/Search/AI projections
```

The CMS should persist canonical package versions and production records, not a
preview-only content model. An authenticated operator service may later expose
the same projection contract after adding role checks, audit retention,
concurrency/version checks, and authorization for each mutation. The current
read-only viewer requires none of those systems and must not imply that they
already exist.

## 26. Testing/Verification Architecture

Future deterministic verification should cover:

1. every required ReviewProjection field maps to canonical input;
2. identical package/record input produces identical serialized output;
3. missing quality report maps to `NOT EVALUATED`;
4. quality statuses and issue details match the frozen report exactly;
5. lifecycle visibility and delivery eligibility agree with production workflow;
6. draft/review/approved/deprecated/archived records remain non-public;
7. published delivery requires an explicit evaluated, non-blocked report;
8. answer keys, question arrays, responses, scores, learner state, secrets,
   provider data, and credentials cannot appear;
9. legacy Geography payload objects are rejected as canonical packages;
10. Geography, History, English, Mathematics, Science, and International
    Affairs pilot packages project successfully;
11. assessment references contain no scoring authority;
12. Search and AI statuses reuse existing projections;
13. no UI module contains quality, scoring, Search-ranking, or learner formulas;
14. stable ordering is preserved for units, blocks, claims, sources, issues, and
    navigation;
15. unknown topic/package IDs fail closed.

These checks should be pure Node verifiers first. Browser automation is optional
later and should verify navigation and labels, not replace domain verification.

## 27. Migration/Compatibility Impact

The recommended design is additive:

- no existing canonical topic IDs or hrefs change;
- no `TopicRead`, assessment, Search, AI, learner, entitlement, commerce, or
  identity contract changes are required for the first review surface;
- no Geography payload migration occurs;
- no MCQ dataset or answer logic changes;
- no production workflow transition semantics change;
- no published content is rewritten in place;
- existing user-facing study routes remain unchanged.

The only new public-facing domain contract should be the internal/read-only
ReviewProjection. It must not be added to public catalog responses by default.

## 28. Risks and Mitigations

| Risk | Why it matters | Detection | Mitigation |
|---|---|---|---|
| Parallel preview model | Content can diverge from production | Contract/code search; projection parity tests | Project directly from canonical package and record |
| UI-derived quality status | Reviewer may see a result publication will not use | Compare displayed report with stored report | Consume frozen `ContentQualityReport` only |
| Unpublished exposure | Draft content or source notes may leak publicly | Route/cache boundary tests | Development-only route; review-safe allowlist; no public cache |
| Answer-key leakage | Content review could expose assessment secrets | Forbidden-field serialization tests | Assessment references only; explicit deny tests |
| Learner-data leakage | Private progress could cross into content review | Projection schema and dependency tests | No learner imports or learner fields |
| Geography ingestion | Legacy payload could be silently promoted | Input rejection and registry tests | Explicit canonical package registry; separate legacy view |
| Lifecycle confusion | Rendering may be mistaken for readiness | UI text/status tests | Show workflow, lifecycle, quality, and delivery independently |
| Duplicate Search/AI logic | Integration status may disagree with runtime | Projection reuse tests | Consume existing projections and eligibility helpers |
| Future mobile incompatibility | Web-only fields become a hidden contract | JSON-safe schema review | Stable additive projection with canonical IDs/version |
| Premature editor architecture | Complexity delays content quality feedback | Scope review | Local read-only first; defer persistence/auth/CMS |

## 29. Open Decisions

The following decisions belong to implementation planning, not to canonical
content semantics:

1. the exact development-only route name and whether it is guarded by an
   environment flag;
2. whether a future local viewer selects a package by topic ID or by a separate
   package registry key;
3. the exact sanitized subset of source fields shown to reviewers;
4. whether quality evaluation is performed before projection by a command or
   only consumed when attached to a `ProductionRecord`;
5. the visual component library and responsive layout;
6. whether a later authenticated editor needs reviewer identity redaction or
   role-specific fields.

None of these decisions justify adding a database, authentication provider,
public API, or mutation capability now.

## Architecture Review

**Review date:** 2026-09-03  
**Architecture reviewed:** Dedicated validated Review Projection for a
development/local browser review surface.

### Repository evidence inspected

The review cross-checked the architecture against:

- `AGENTS.md`, `README.md`, `CURRENT_STATE.md`, `ROADMAP.md`,
  `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DOCUMENT_MAP.md`, and
  `SECURITY.md`;
- `src/lib/content/`, `src/lib/content/pilot/`,
  `src/lib/content/production/`, `src/lib/content-quality/`,
  `src/lib/content/delivery.ts`, and `src/lib/contracts/`;
- existing Next.js routes and rendering components;
- Assessment Engine, Search, AI grounding/provider boundaries, Learner
  Intelligence, local learner state, and `src/lib/geography-data.ts`.

### Findings

1. The proposed projection is the correct boundary. It prevents the browser
   renderer from becoming a second content model while allowing actual
   canonical blocks and audit metadata to be viewed together.
2. The production workflow correctly separates workflow state from package
   lifecycle and already prevents unevaluated records from delivery after the
   latest eligibility hardening.
3. Search, AI, Assessment, Learner, identity, entitlement, commerce, and
   platform contracts remain separate authorities.
4. The existing public delivery projection is intentionally insufficient for
   editorial review; it must not silently become the review projection.
5. Legacy Geography is isolated from the universal pilot/production path and
   must remain reference-only.

### Required corrections

The current `ContentQualityReport` contains `contentId` and
`contentVersion`, but does not contain evaluation time or evaluator/gate
identity. A future review implementation must therefore use a version-bound
quality snapshot envelope, for example:

```text
ReviewQualitySnapshot
  contentId
  contentVersion
  evaluatedAt
  evaluatorVersion
  report: ContentQualityReport
```

The snapshot is valid only when its `contentId` and `contentVersion` exactly
match the selected `ProductionRecord.content.topic.id` and
`ProductionRecord.content.topic.contentVersion`. A mismatched, missing, or
invalidated snapshot displays `NOT EVALUATED` and cannot imply readiness.
`evaluatorVersion` identifies the deterministic gate/validator revision, while
`evaluatedAt` is caller-supplied metadata; neither changes quality semantics.

The production workflow should preserve this invariant when content moves
between states and must clear or recompute a snapshot whenever content changes.
Corrections already create a new version and therefore require a new
evaluation. This is an additive review/production metadata correction, not a
second quality gate.

### Security findings

The allowlisted ReviewProjection boundary is required. Direct package
serialization is not acceptable. Assessment payloads/answer keys, learner
state, provider data, credentials, secrets, and public-cache paths must remain
excluded. Unpublished review-safe data must never cross a normal public study,
API, or cache boundary.

### Lifecycle findings

The six production workflow states remain compatible and must not be
redefined. Previewability is a local review capability only; it is independent
of deliverability, AI grounding, approval, and publication. Deprecated and
archived content may be inspected as historical records but are never
deliverable or AI-groundable.

### Versioning findings

The safe review identity is the tuple
`contentId + contentVersion`, applied to both canonical content and quality
snapshot. Topic identity remains stable across versions, but a review must
never combine fields from different versions. Corrections are immutable
successor snapshots.

### Legacy isolation findings

`src/lib/geography-data.ts` is not canonical content, not the quality
baseline, not automatically review-publishable, and not subject to automatic
conversion or migration. New Geography content must originate as a canonical
universal package and pass the same production workflow.

### Universality findings

The projection remains universal for Geography Water Cycle, English
Subject-Verb Agreement, History UDHR Adoption, Mathematics, Science,
International Affairs, and future subjects. KnowledgeUnit, ContentBlock,
Objective, Claim/evidence, interpretation status, scope, and validity remain
core fields; subject-specific data remains an extension.

### Final architecture decision

Approve **Option B: Dedicated validated Review Projection**, subject to the
version-bound quality snapshot correction above. No implementation should
proceed with a browser-only quality calculation, an unbound report, direct
package serialization, or a legacy Geography ingestion path.

## 30. Final Architectural Verdict

**ARCHITECTURE READY FOR REVIEW**

The safest next design is **Option B: Dedicated validated Review Projection**.
It gives the owner a concrete future local browser review experience while
preserving canonical content, production workflow, quality-gate, Search, AI,
assessment, learner, and legacy Geography boundaries.

The review surface must remain read-only, development-first, explicit about
quality and lifecycle, and incapable of implying readiness from rendering
alone. It can later support a CMS/editorial evolution by reusing the same
canonical packages, version records, quality reports, and projection contract.
