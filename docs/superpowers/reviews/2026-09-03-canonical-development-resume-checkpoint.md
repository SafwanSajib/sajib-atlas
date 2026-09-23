# Canonical Development Resume Checkpoint

## 1. Checkpoint date

2026-09-03

## 2. Current project state

Sajib Atlas V10.6 has completed the platform/API and mobile-ready foundation
and is operating in controlled canonical Geography content production. The
approved workflow is:

`Universal Schema -> Editorial/Provenance -> Quality Gate -> Production
Pipeline -> Live Review -> Production Batch -> Editorial/Academic Audit ->
Publication Readiness -> Human Approval -> Next Batch`

No package is published. Batch #5 does not exist.

## 3. Current architecture state

The architecture remains a modular monolith with API-ready domain boundaries
and mobile-ready contracts. Identity, entitlement, commerce, assessment,
learner intelligence, Search, AI, content, review, and client boundaries are
preserved. No database, CMS, authentication provider, payment provider,
embeddings/vector search, public REST AI API, or native mobile app was added.

## 4. Universal content standard state

The universal `PilotPackage` model is stable across Water Cycle, Latitude &
Longitude, Atmosphere, and Plate Tectonics. KnowledgeUnits are reusable
learning objects; ContentBlocks are semantic; objectives, selective claims,
provenance, assessment references, Search, AI grounding, learner references,
versioning, and lifecycle semantics remain shared and provider-agnostic.

## 5. Production pipeline state

The existing draft -> review -> approved -> published -> deprecated ->
archived workflow is implemented. Quality snapshots are immutable,
version-bound, and required for delivery/authoritative AI eligibility.
Production does not automatically publish content.

## 6. Live Review state

The shared read-only development review workspace is available at
`/content-review`. Canonical Geography routes include:

- `/content-review/geography/water-cycle`
- `/content-review/geography/latitude-and-longitude`
- `/content-review/geography/atmosphere`
- `/content-review/geography/plate-tectonics`

## 7. Batch #1 status — Water Cycle

Production package, editorial/academic audit, remediation, and publication
readiness are complete. It remains unpublished.

## 8. Batch #2 status — Latitude & Longitude

Production package and editorial/academic audit are complete. It remains
version 1, draft, and unpublished.

## 9. Batch #3 status — Atmosphere

Atmosphere has completed production, editorial/academic audit, and publication
readiness simulation:

- decision: `APPROVE WITH NON-BLOCKING CONDITIONS`
- PASS: 22
- WARNINGS: 2
- BLOCKERS: 0
- content ID: `topic/geography/atmosphere`
- version: 1
- lifecycle: `draft`
- quality snapshot: valid and version-bound
- publication: not published

## 10. Batch #4 status — Plate Tectonics

Plate Tectonics has completed production and its independent
editorial/academic audit:

- verdict: `READY WITH WARNINGS`
- PASS: 24
- WARNINGS: 3
- BLOCKERS: 0
- content ID: `topic/geography/plate-tectonics`
- version: 1
- lifecycle: `draft`
- quality snapshot: valid and version-bound
- publication: not published

## 11. Current blockers

No canonical-content blocker is currently recorded. Plate Tectonics has not
yet received the separate publication-readiness/human editorial approval
simulation.

## 12. Current warnings

Plate Tectonics warnings are non-blocking:

1. Smithsonian automated fetch returned HTTP 403; the authoritative source is
   retained as an access limitation.
2. The USGS earthquake source is a broad program locator.
3. Case-study content uses bounded generic settings rather than named
   geographic cases.

The repository also retains one pre-existing lint warning in
`src/lib/geography-data.ts`.

## 13. Legacy content policy

`src/lib/geography-data.ts` is LEGACY / REFERENCE ONLY. It is not the
canonical content standard. New canonical packages must be independently
authored and must not import, transform, migrate, or depend on the legacy
payload. The legacy file remains untouched.

## 14. Next exact workflow step

Perform:

**Plate Tectonics Publication Readiness / Human Editorial Approval Simulation**

Do not publish automatically. The next Geography batch is not selected or
implemented until this governance stage is complete.

## 15. Do-not-do list

- Do not create Batch #5.
- Do not create new content or modify canonical packages.
- Do not publish Plate Tectonics or any other package.
- Do not perform remediation or a new audit in this checkpoint.
- Do not redesign schemas, provenance, quality gates, pipeline, or review.
- Do not modify legacy Geography.
- Do not add authentication, payments, databases, CMS, mobile apps, or AI providers.
- Do not commit, push, reset, rebase, merge, or switch branches.

## 16. Verification state

The established suite has repeatedly passed for content quality, production,
review, delivery, pilot, Search, Assessment Engine, assessment integration,
Learner Intelligence, learner progress, study progress, AI grounded answering,
Phase 7, Phase 8, Phase 9, TypeScript, lint, build, and `git diff --check`.
The only known lint issue is the pre-existing unused `banglaSummaries` warning
in `src/lib/geography-data.ts`.

## 17. Git / worktree state

The worktree is **not clean**. It contains the accumulated implementation and
documentation changes from prior phases and the current canonical workflow.
No Git history operation was performed for this checkpoint. The lightweight
checks `git status --short`, `git diff --check`, and `git diff --stat` were run.

## 18. Resume instructions for a new Copilot agent

Follow [RESUME PROTOCOL](#resume-protocol) exactly. Preserve the existing
worktree and begin only at Plate Tectonics publication readiness.

## 19. Resume instructions for a new Grok session

Treat this checkpoint and repository evidence as authoritative. Do not infer
that draft means published. Read the listed documents, inspect the existing
Plate Tectonics package and audit, and continue only with the publication
readiness/human approval simulation.

## 20. Current documentation map

Core authority documents:

- `AGENTS.md`
- `README.md`
- `CURRENT_STATE.md`
- `DEVELOPMENT_RULES.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DOCUMENT_MAP.md`

Canonical workflow documents are under `docs/superpowers/specs/` and
`docs/superpowers/reviews/`. The review artifacts for Water Cycle, Latitude &
Longitude, Atmosphere, the cross-batch gate, Batch #4 readiness, and Plate
Tectonics audit record the completed governance stages.

## 21. Important file paths

- `src/lib/content/production/`
- `src/lib/content/production/batches/`
- `src/lib/content/production/workflow.ts`
- `src/lib/content/production/index.ts`
- `src/lib/content/review/`
- `src/lib/content-quality/`
- `src/lib/content/pilot/`
- `src/lib/content/`
- `src/lib/search/`
- `src/lib/ai-intelligence/`
- `src/lib/ai-providers/`
- `src/store/learner/`
- `src/lib/geography-data.ts` — legacy boundary

## 22. Historical decisions that must not be reversed

1. Legacy Geography is not the future content standard.
2. New canonical content is independently authored.
3. KnowledgeUnit is the canonical reusable learning object.
4. ContentBlocks are semantic, not presentation sections.
5. Claims use selective evidence/provenance.
6. Fact and interpretation remain distinguishable.
7. Assessment alignment is reference-only.
8. AI grounding uses approved canonical projections.
9. Learner references remain structural.
10. Content versions are immutable.
11. Quality snapshots bind exactly to `contentId` + `contentVersion`.
12. Draft content is not published authoritative content.
13. Live Review is read-only development review.
14. Legacy Geography remains isolated.
15. Production never automatically publishes.
16. Editorial/academic audit is separate from implementation.
17. Human approval is separate from audit.
18. Batch production proceeds only after governance gates.
19. Copilot must not perform Git commit/push unless explicitly instructed.

## RESUME PROTOCOL

**First read this checkpoint document completely.**

Then read, in this order:

1. `AGENTS.md`
2. `README.md`
3. `CURRENT_STATE.md`
4. `DEVELOPMENT_RULES.md`
5. `ROADMAP.md`
6. `ARCHITECTURE.md`
7. `SECURITY.md`
8. `DOCUMENT_MAP.md`
9. Universal Content Schema specification
10. Editorial + Source/Provenance specification
11. Automated Content Quality Gate specification
12. Canonical Content Production Pipeline specification
13. Live Canonical Content Review Architecture
14. Live Content Review Implementation Plan
15. Geography Cross-Batch Quality Gate
16. Atmosphere Publication Readiness
17. Plate Tectonics Editorial + Academic Audit
18. Geography Batch #4 Readiness
19. Relevant production packages

Resume from:

**Plate Tectonics Publication Readiness / Human Editorial Approval Simulation**

Do not restart earlier architecture phases, redesign the schema, recreate
completed batches, or treat legacy Geography as canonical.

**Checkpoint status:** resume-ready; Plate Tectonics remains draft and
unpublished, and Batch #5 has not been created.
