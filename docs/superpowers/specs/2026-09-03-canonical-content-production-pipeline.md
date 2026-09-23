# Canonical Content Production Pipeline

**Date:** 2026-09-03  
**Status:** Post-Phase-9F product increment

## 1. Purpose

This document defines the deterministic workflow boundary for moving an
approved universal content package through editorial production. It is an
authoring and publication safety boundary, not a CMS, database, or public API.

## 2. Scope

The pipeline currently operates on the approved `PilotPackage` contract. It
does not replace the canonical schema, legacy content, assessment engine,
learner state, Search, or AI provider architecture.

## 3. Ownership

`src/lib/content/production/` owns workflow transitions and publication
eligibility. The content package remains the canonical content model.

## 4. Workflow states

The explicit workflow is:

```text
draft -> review -> approved -> published -> deprecated -> archived
```

Review may return to draft, and approved content may return to draft. Published
content cannot be edited in place.

## 5. Content lifecycle

Workflow state is separate from the package lifecycle. The workflow maps draft,
review, deprecated, and archived directly; approved is workflow metadata while
the publication candidate uses the published lifecycle.

## 6. Draft creation

`createProductionDraft` requires a positive content version and creates a
defensive lifecycle snapshot with no reviews or publication timestamp.

## 7. Review submission

Only draft content may enter review. Repeated or invalid transitions fail
explicitly rather than silently accepting an invalid state.

## 8. Human review

Editorial and academic-source reviews are recorded independently, with reviewer
identity, timestamp, outcome, notes, and content version. Approval requires a
passing record for both review types.

## 9. Automated review

Automated review is not manually recordable. `evaluateProductionQuality`
reuses the existing deterministic Content Quality Gate and stores its report.

## 10. Quality gate

The gate checks identity, structure, blocks, objectives, claims, provenance,
fact/interpretation classification, lifecycle/versioning, assessment
separation, Search, AI, learner compatibility, and universal-core safety.

## 11. Approval

Approval is allowed only from review state, with no quality blockers and passing
editorial and academic-source reviews. Approval is not a new canonical content
lifecycle.

## 12. Publication

Only approved content can be published. A publication timestamp is required and
the stored quality report must contain no blockers.

## 13. Delivery eligibility

Public delivery requires workflow state `published`, package lifecycle
`published`, and an explicit evaluated report with no blockers. Draft, review,
approved, deprecated, archived, and unevaluated records are not deliverable.

## 14. AI eligibility

The current production boundary gives AI the same eligibility as public
delivery. This does not authorize generation, provider access, or client-side
credentials.

## 15. Version identity

Canonical topic identity remains stable. `contentVersion` identifies the
immutable content snapshot and is carried by topic and knowledge units.

## 16. Corrections

Corrections require a published or deprecated source, the same canonical topic
identity, and exactly the next content version. They create a new draft and
record the superseded version.

## 17. Immutability

The source published snapshot is not mutated when a correction is created.
Publication of the correction is a separate review and approval decision.

## 18. Deprecation and archive

Published content may be deprecated and deprecated content may be archived.
Neither state is eligible for public delivery or AI grounding.

## 19. Pilot promotion

Pilot packages are inputs to this workflow, not automatically published
content. Passing the machine gate does not promote a package; human editorial
and academic-source reviews remain mandatory.

## 20. Legacy Geography boundary

The existing Geography payload remains legacy/reference material. It is not
rewritten, migrated, or silently promoted by this pipeline.

## 21. Assessment boundary

Assessment alignments contain references only. The production workflow does not
own questions, answer keys, correctness, attempts, scoring, or results.

## 22. Learner boundary

Learner state, progress, completion, and performance remain private learner
concerns. Production content does not embed learner state or make assessment
completion equivalent to topic completion.

## 23. Search boundary

Search projections remain separate from workflow state and ranking. Delivery
eligibility does not replace the Search engine or its ranking authority.

## 24. AI grounding boundary

AI projections may reference eligible canonical content, but generation and
provider routing remain in the existing AI Intelligence boundary.

## 25. Persistence model

This increment is in-memory and contract-level. It introduces no database,
cloud persistence, CMS, synchronization service, authentication, or external
observability system.

## 26. Determinism

Transitions, validation, review requirements, version checks, and eligibility
decisions are deterministic. They do not use network calls, randomness, AI, or
current time; timestamps are supplied by the caller.

## 27. Error behavior

Invalid transitions, identities, versions, reviewer fields, and publication
requirements throw explicit domain errors. No invalid state is silently
accepted.

## 28. Compatibility

Existing content, assessment, learner, Search, AI, and platform contracts remain
available. The production boundary is additive and does not alter public
payloads or legacy learner compatibility fields.

## 29. Verification

`verify:content-production` covers valid and invalid transitions, review
requirements, quality blockers, publication, delivery and AI eligibility,
corrections, immutability, deprecation, archiving, and rejection of
legacy-shaped input. Regression verifiers, TypeScript, lint, build, and
`git diff --check` must also pass.

## 30. Non-goals

No Phase 10 work, public API, database, authentication, payments, mobile
implementation, Geography migration, MCQ rewrite, scoring change, Search
rewrite, AI rewrite, or broad authoring UI is included.

## 31. Future extension

A later increment may add durable editorial storage and operator tooling only
after contracts, authorization, audit retention, and migration requirements are
approved separately.

## 32. Verdict

The canonical content production boundary is implemented as a small additive
workflow around the approved universal package and is ready for verifier and
regression validation.
