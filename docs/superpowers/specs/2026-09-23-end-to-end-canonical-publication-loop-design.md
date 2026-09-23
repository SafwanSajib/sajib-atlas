# End-to-End Canonical Content Publication Loop

**Date:** 2026-09-23
**Status:** Implementation design for human review. Not implemented by this document.
**Scope:** How an existing production draft moves through the Editorial CMS into the existing canonical review, approval, and publication functions, and how public delivery stays closed until publication.
**Authoritative architecture:** `docs/superpowers/specs/2026-09-04-v10-7-product-brand-platform-expansion-architecture.md`
**Content authorities this design does not replace:**
- `docs/superpowers/specs/2026-09-03-universal-content-schema-design.md`
- `docs/superpowers/specs/2026-09-03-editorial-source-provenance-spec.md`
- `docs/superpowers/specs/2026-09-03-canonical-content-production-pipeline.md`
- `docs/superpowers/specs/2026-09-03-automated-content-quality-gate.md`
- `docs/superpowers/specs/2026-09-03-live-canonical-content-review-architecture.md`
- `docs/superpowers/specs/2026-09-23-editorial-cms-workspace-design.md`

This is an implementation design. It extends the existing architecture. It does not replace V10.7. It does not replace the Universal Content Schema, the Canonical Production Pipeline, the Quality Gate, or the Live Canonical Content Review architecture. The Editorial CMS remains an authoring system. Publication remains a separate canonical boundary.

No source code, route, database, approval action, or publication action is added by this document. No content is generated. The Water Cycle package is a verification fixture, not permission to publish it.

---

## 1. Purpose

The authoring stack can already produce a `ProductionRecord`, edit it, and stop at editorial status `ready_for_approval`. The canonical stack can already move a `ProductionRecord` through `draft → review → approved → published`, but only when a caller invokes `submitProductionForReview`, `recordProductionReview`, `approveProduction`, and `publishProduction` directly. Nothing connects those two stacks, and the public Geography route does not read either of them.

The milestone connects them without collapsing them:

```text
Existing ProductionRecord draft
→ Editorial CMS
→ editorial editing
→ quality validation
→ editorial ready_for_approval
→ canonical review
→ approval
→ publication
→ production delivery projection
→ later public topic route, not this milestone
→ assessment reference / learner progress / revision
```

The first proof uses the existing Water Cycle canonical package. It does not call a model and does not create a new topic. The proof of publication is the production delivery projection in section 2.F. It is not a change to `/geography/[topic]`.

## 2. Layers that stay separate

### A. Content Production Studio

Studio generates a draft, resolves identity, grounds provenance, builds a `ProductionRecord`, runs `evaluateProductionQuality`, and can place the result in the Production Inbox. The in-request action `generateStudioBatchAction` and the persistent `tickBatchWorker` both use `runStudioPipeline`. This milestone does not change that path and does not run a batch.

### B. Editorial CMS

The CMS authors one batch item. It edits the draft, stores notes and history outside the package, inspects provenance and the quality snapshot, saves with `expectedRevision`, writes the editorial production through to `result.draft`, and can replay that write when the copies diverge. Its statuses are only `needs_editing`, `ready_for_review`, `changes_requested`, and `ready_for_approval`.

`ready_for_approval` is not approval and not publication. The CMS must not call `approveProduction`, `publishProduction`, or `submitProductionForReview`.

### C. Canonical content review

`/content-review` lists `getReviewRecords()`. That list is registry membership. `buildReviewProjection` is a pure read model of whatever `ProductionRecord` it is given. It does not insert a record and it does not complete a review. A human review is a `ProductionReview` row of type `editorial` or `academic-source`, recorded only while `workflowState` is `review`, by `recordProductionReview`. The automated gate is not a human review row. Delivery and AI eligibility are separate predicates, `isProductionDeliveryEligible` and `isProductionAiEligible`. They are not review registration.

### D. Approval

Approval is `approveProduction`. It accepts only `workflowState === "review"`. It rejects `qualitySnapshot.report.overall === "blocked"`. It requires a passed `editorial` review and a passed `academic-source` review on that same `contentVersion`. It does not increment `contentVersion`.

### E. Publication

Publication is `publishProduction(record, publishedAt)`. It accepts only `workflowState === "approved"`. It rejects a blocked snapshot. It sets `publishedAt` and moves topic and knowledge-unit `lifecycle` to `published`. It does not increment `contentVersion`.

### F. Public delivery

`src/lib/geography-data.ts` stays legacy reference material for the current study pages. This milestone does not migrate it, rewrite it, delete it, or change its content. It is not the canonical publication source.

`/geography/[topic]` keeps reading that legacy module. This milestone does not change that page. It does not claim that the route serves a canonical `ProductionRecord`. A later milestone may point a public topic route at the production delivery projection below. That route change is not part of this milestone.

`getPublishedTopicDelivery` and `projectPublishedTopicDelivery` in `src/lib/content/delivery.ts` are also not this proof. They read a `CanonicalTopic` from the content manifest. Geography rows there use `contentSource: "geography-data"` and `lifecycle: "published"` because the legacy catalog page is live. That lifecycle is not `ProductionWorkflowState`. Using those functions for Water Cycle would treat the legacy page as canonical production publication, or would require a manifest edit. Neither is allowed here.

The pilot's published-delivery reader is a pure projection of a `ProductionRecord`:

- Name: `projectProductionDelivery`.
- Place: `src/lib/content/production/workflow.ts`, next to `isProductionDeliveryEligible`, or a sibling file that only calls that function.
- Input: one `ProductionRecord`.
- Output: that same record when `isProductionDeliveryEligible(record)` is true. Otherwise `undefined`.
- It does not read `geography-data.ts`, the content manifest, the editorial file, or the batch store.
- It does not write.

A record is eligible only when `workflowState` is `published`, topic `lifecycle` is `published`, the snapshot `contentId` and `contentVersion` match the topic, and overall is not `blocked`. An editorial draft, a `ready_for_approval` record, a canonical `draft`, a canonical `review` record, and an `approved` record all return `undefined`. An unpublished Water Cycle draft therefore cannot be read from this projection.

The pilot calls `projectProductionDelivery` on a discarded clone that has passed `publishProduction`, and expects the record back. It calls the same function on `getReviewRecord("topic/geography/water-cycle")` and expects `undefined`. No page renders either result.

## 3. State axes

These axes are not one field.

| Axis | Existing contract | Values |
|---|---|---|
| Canonical workflow | `ProductionWorkflowState` | `draft`, `review`, `approved`, `published`, `deprecated`, `archived` |
| Topic lifecycle | `PilotLifecycle` on topic and knowledge units | `draft`, `review`, `published`, `deprecated`, `archived`. `approved` workflow uses lifecycle `published` because `lifecycleForState` maps both `approved` and `published` to `published`. |
| Editorial status | `EditorialStatus` | `needs_editing`, `ready_for_review`, `changes_requested`, `ready_for_approval` |
| Batch job | `BatchJobState` | `draft`, `queued`, `running`, `paused`, `completed`, `completed_with_failures` |
| Batch item | `BatchItemState` | `pending`, `running`, `succeeded`, `quality_blocked`, `source_insufficient`, `rate_limited`, `failed` |
| Inbox lane | `ProductionInboxLane` | `generated`, `quality_blocked`, `source_insufficient`, `rate_limited`, `failed`, `ready_for_editorial_review` |
| Quality | `ContentQualityReport.overall` | `pass`, `warning`, `blocked` |
| Human review row | `ProductionReview` | type `editorial` or `academic-source` or `automated`; outcome `passed`, `failed`, or `warning`. `automated` cannot be inserted through `recordProductionReview`. |
| Content version | `topic.contentVersion` and aligned unit and alignment versions | Integer ≥ 1. Editorial edits do not change it. |

Names that are not contracts and must not be stored:

- `eligible_for_canonical_review` is not a state. It is the predicate in section 4.
- `reviewed` is not a state. A record stays in `review` until `approveProduction` or a return to `draft`.
- `ready_for_editorial_review` is an inbox lane, not `ready_for_review`.
- `generated` is an inbox lane, not an editorial status.
- `quality_blocked` is a batch item state and an inbox lane, not an editorial status and not `workflowState`.

### Editorial transitions

Existing `EDITORIAL_TRANSITIONS`:

- `needs_editing` → `ready_for_review`
- `ready_for_review` → `ready_for_approval`, `changes_requested`, or `needs_editing`
- `ready_for_approval` → `changes_requested` or `needs_editing`
- `changes_requested` → `needs_editing`

A content save from any status other than `needs_editing` returns to `needs_editing`. A note-only save does not. `needs_editing` → `ready_for_approval` is invalid. Same-status is not a transition. Advance requires the existing `previewEditorialAdvance` predicate: overall not `blocked`, the must-not-be-blocked dimensions not `blocked`, and the projection not deliverable, AI-groundable, or publishable.

### Canonical transitions

Existing `transitions` in `workflow.ts`:

- `draft` → `review` by `submitProductionForReview`
- `review` → `approved` by `approveProduction`
- `approved` → `published` by `publishProduction`
- `published` → `deprecated` by `deprecateProduction`
- `deprecated` → `archived` by `archiveProduction`
- `archived` has no outgoing transition

The private transition table also lists `review → draft` and `approved → draft`. No exported function performs those returns today. This design does not add one and does not treat them as an available operator action.

`createProductionCorrection` does not move the published record. It returns a new `draft` whose `contentVersion` is exactly one greater and whose `supersedesVersion` is the published version.

### How the operator path crosses axes

```text
inbox lane generated
→ editorial needs_editing
→ editorial ready_for_review
→ editorial changes_requested
→ editorial needs_editing
→ editorial ready_for_approval
→ canonical workflow review
→ passed editorial and academic-source ProductionReview rows
→ canonical workflow approved
→ canonical workflow published
```

`ready_for_review` may also go directly to `ready_for_approval`. The canonical half starts only at the handoff in section 4. Batch item state does not change when the editorial status or the canonical workflow changes.

## 4. Editorial handoff is not canonical review

`recordEditorialHandoff` is an Editorial CMS and Production Inbox marker. It appends a `BatchEditorialHandoff` with `decision: "submit-for-canonical-registration"` and `registeredInContentReview: false`. That `false` is a literal type, and the batch verifiers require it. The flag means "this inbox item has not been registered by the handoff." It does not mean the topic is absent from `getReviewRecords()`. The handoff does not call `getReviewRecords`, `buildReviewProjection`, `recordProductionReview`, `submitProductionForReview`, or `approveProduction`. A quality-blocked or non-succeeded item still cannot be handed off.

Canonical review registration, for this codebase, is membership in the list returned by `getReviewRecords()`. Water Cycle is already in that list. `getReviewRecords` builds it by `createProductionDraft` plus `evaluateProductionQuality` on `geographyWaterCycleProductionPackage`. The editorial handoff must not add a second copy and must not be described as the act that registers Water Cycle.

`buildReviewProjection` only displays a record. Calling it does not complete a review and does not approve.

The canonical-review steps that make a Water Cycle clone eligible for `approveProduction` are the existing functions, in order:

1. `submitProductionForReview` moves `workflowState` from `draft` to `review`. The bridge in the next subsection is the only CMS path that may call it.
2. `recordProductionReview` with `type: "editorial"` and `outcome: "passed"`, while `workflowState` is `review`. The row stores the current `contentVersion`.
3. `recordProductionReview` with `type: "academic-source"` and `outcome: "passed"`, on that same version.
4. The snapshot matches the topic id and `contentVersion`, and `report.overall` is not `blocked`.

Only then is `approveProduction` legal. A passed editorial row without the academic-source row is not enough. The 2026-09-03 audit markdown is not either row. `recordProductionReview` rejects `type: "automated"`. No new review type or review store is added.

## 4.1 Editorial to canonical handoff

The new bridge is a function beside the existing workflow, not a second workflow type. Proposed name: `submitReadyEditorialRecord`. It is the only new write entry from the CMS into the canonical record. It calls `submitProductionForReview` after the checks below and does not call `approveProduction` or `publishProduction`.

Eligibility predicate, all required:

- Editorial status is `ready_for_approval`.
- Editorial `production` is deep-equal to the batch `result.draft`. If not, the result is the existing editorial persistence failure. Replay remains the repair. The bridge does not merge and does not delete.
- Batch item state is `succeeded` or `quality_blocked`. A `quality_blocked` item may be submitted only when the current snapshot overall is not `blocked`. The item state stays `quality_blocked`.
- `workflowState` of the canonical record is `draft`.
- Topic id matches the editorial production topic id.
- `contentVersion` matches across the editorial record, the batch draft, and the canonical record.
- A quality snapshot exists, `contentId` equals the topic id, `contentVersion` equals the topic version, the report ids match the snapshot, `evaluatorVersion` is non-empty, and `evaluatedAt` parses. This is the same snapshot shape `buildReviewProjection` already treats as evaluated.
- Snapshot overall is not `blocked`.
- Provenance still satisfies the package validator used by the Quality Gate. The bridge does not invent sources and does not add a second provenance schema.
- The projection is not deliverable and not AI-groundable. A draft must not already look public.

If any check fails, the canonical record is not written. `registeredInContentReview` stays `false` because this design does not change that field.

On success, `submitProductionForReview` moves that canonical record to `review` and sets topic and unit lifecycle to `review`. The editorial status stays `ready_for_approval` until a later content edit demotes it. The inbox flag stays `false`. Canonical submission is visible because `workflowState` is `review`. Review completion is the two `recordProductionReview` calls in section 4, not this submission and not the handoff flag.

`submitProductionForReview` today does not inspect quality. The bridge must not rely on that silence. Callers other than the bridge must still be able to submit an already canonical draft that the production verifier constructs. Tightening `submitProductionForReview` itself is out of scope. The bridge owns the editorial eligibility check.

## 5. Approval boundary

Approval is an explicit call to `approveProduction` by the development operator. There is no authentication system and this design does not add one. The recorded identity is the existing `reviewerId` string on each `ProductionReview`, not `actorLabel` from the CMS and not a role.

`approveProduction` already requires:

- `workflowState === "review"`
- overall not `blocked`
- a passed `editorial` review and a passed `academic-source` review whose stored `contentVersion` is the topic version at review time

This design adds one fail-closed precondition before that call, because `approveProduction` currently trusts a snapshot whenever the object is present:

- If the snapshot is missing, call `evaluateProductionQuality` and use that result. Do not approve the unevaluated object.
- If the snapshot is present but `contentId` or `contentVersion` disagrees with the topic, reject. Do not approve. Do not repair the snapshot in place.
- If overall is `blocked`, `approveProduction` already throws `quality blockers prevent approval`. The CMS advance to `ready_for_review` remains separately blocked by `editorial_quality_blocked`.
- If provenance is missing or dangling, the gate's provenance dimension blocks, overall is `blocked`, and approval throws. No separate provenance repair runs.
- If `workflowState` is not `review`, approval throws `only review content can be approved`.
- If `contentVersion` on the loaded canonical record differs from the editorial baseline, reject as a stale content version. Do not approve the newer or older body.
- Approval does not create a version. `contentVersion` stays the same. `publishedAt` stays unset. Lifecycle becomes `published` only because the existing mapper treats `approved` that way. `isProductionDeliveryEligible` is still false because `workflowState` is `approved`, not `published`. The review projection may show `publishable` under its current rule. Deliverable and AI-groundable stay false.

An editor cannot bypass the gate by setting `ready_for_approval`. That status does not call `approveProduction`. A direct `approveProduction` on a draft throws. A direct call on a blocked snapshot throws.

A failed or warning review does not satisfy `hasPassedReview`. Review rows are not deleted by a rejected approval. There is no exported return-to-draft function. Sending a canonical record back to `draft` is not part of this design.

## 6. Publication boundary

`approved → published` is `publishProduction(record, publishedAt)`.

Required at the call:

- `workflowState` is `approved`.
- Topic id is the canonical id already on the record. The function does not mint an id.
- `contentVersion` is unchanged and matches the snapshot when a snapshot is present. A mismatched snapshot is rejected by the same precondition as approval.
- The snapshot overall is not `blocked`. If the snapshot is absent, `publishProduction` already evaluates before publishing. This design rejects a mismatched snapshot instead of publishing it.
- Provenance remains valid under the gate. A blocked provenance result makes overall `blocked`, and publication throws `quality blockers prevent publication`.
- Both human review types have passed for this version, which is how the record was allowed to become `approved`.
- `publishedAt` is a non-empty timestamp.
- The editorial copy, if still loaded, is deep-equal to the canonical content about to be published, or the call is refused as a stale editorial session. Publication does not silently take the editorial file.

Failure leaves the approved record unchanged. No partial lifecycle write is kept. The function returns a new object. The registry write happens only after it returns. If that write fails, the previous registry object remains and `workflowState` stays `approved`.

Publication is atomic from the canonical record's point of view: the stored record either remains the previous value or becomes the returned published record. It does not update `geography-data.ts`, search documents, learner rows, or assessment sets in the same operation.

A published version stays public while a later draft exists:

```text
Published version N
        │
        ├── remains the deliverable record
        │
        └── correction draft version N+1
                │
                └── edited and reviewed on its own record
```

`createProductionCorrection` is the only way to open N+1. It requires the source record to be `published` or `deprecated`, the same topic id, and `contentVersion === N + 1`. The published object is not mutated. An unfinished N+1 draft is not deliverable. Deprecating N is a separate later call and is not part of starting a correction. This milestone does not deprecate Water Cycle.

## 7. Version safety

`contentVersion` remains the canonical content version on the topic, knowledge units, and assessment alignments. Editorial `revision` remains the compare-and-swap counter on `EditorialDraftRecord`. They are not substitutes.

| Event | contentVersion | Editorial revision | Canonical workflow |
|---|---|---|---|
| Editorial content edit | unchanged | increments by 1 | unchanged |
| Note-only edit | unchanged | increments by 1 | unchanged |
| Quality validate | unchanged | unchanged | unchanged |
| `recordProductionReview` | unchanged; the row copies the current version | unchanged | stays `review` |
| `approveProduction` | unchanged | unchanged | `review` → `approved` |
| `publishProduction` | unchanged | unchanged | `approved` → `published` |
| `createProductionCorrection` | new draft is N+1; published N unchanged | new editorial file starts at revision 0 when opened | published N unchanged; new record is `draft` |
| Rejected editorial transition or blocked advance | unchanged | unchanged | unchanged |
| Stale editorial `expectedRevision` | unchanged | unchanged | unchanged |

A stale editor session fails in the existing store: `save(record, expectedRevision)` throws `stale edit` and does not write. Two browser tabs are that race. The canonical transition additionally compares topic `contentVersion` and `workflowState` with the values the operator loaded. A mismatch throws and does not write. That is not a second version system.

Concurrent editors do not merge. The first editorial save wins. The second reloads. A canonical approval that loses the race finds `workflowState` no longer `review` and `approveProduction` throws.

Rejected changes stay on the editorial record only if that save succeeded, and a content save demotes editorial status to `needs_editing`. The canonical record is unchanged until the handoff. A failed review outcome does not publish and does not roll back a previous published version.

## 8. Water Cycle pilot

The fixture is the existing package `geographyWaterCycleProductionPackage`.

| Fact | Value |
|---|---|
| Topic id | `topic/geography/water-cycle` |
| Title | The Water Cycle |
| Subject | `subject/geography` |
| Discipline | `discipline/geography` |
| contentVersion | 1 |
| Provenance on the package | `provenanceStatus: "corroborated"`; four sources (three `government`, one `international-organization`) and four source references |
| Assessment alignment | `alignment/geography-production/water-cycle` to `pilot/geography/water-cycle`, reference only |
| Package object `topic.lifecycle` | The literal in the batch file says `published`. `createProductionDraft` and `getReviewRecords` replace that with `draft`. Callers must use the registry record or `createProductionDraft`, not the raw literal, or they will misread the package as already published. |
| Registry workflow | `getReviewRecord("topic/geography/water-cycle")` is `workflowState: "draft"` with a snapshot from `evaluateProductionQuality`. `isProductionDeliveryEligible` is false. |
| Human `ProductionReview` rows | None on the registry record. The 2026-09-03 audit document is not a `ProductionReview`. |
| Editorial state for a batch copy with no editorial file | `needs_editing`, revision 0, `persisted: false`. Opening that copy must not write an editorial file and must not write the registry. |
| Canonical review state | `draft`, not `review` |
| Approval state | not `approved` |
| Publication state | not `published`; `publishedAt` absent |
| Editorial handoff flag | Not set by the registry. If a batch copy records a handoff, `registeredInContentReview` remains `false`. |
| Canonical registration | Already true as registry membership: `getReviewRecord("topic/geography/water-cycle")` returns the draft. That is not review completion. |
| Review completion | Not done. `reviews` is empty. Eligibility for `approveProduction` begins only after `submitProductionForReview` and both passed `recordProductionReview` calls on a clone. |
| Production delivery | `projectProductionDelivery` of the registry record returns `undefined`. The same function on a discarded published clone returns that clone. |
| Legacy public route | `/geography/[topic]` continues to read `geography-data.ts`. It must not render this production package. `geography-data.ts` is not edited. |

The pilot test builds a memory batch whose `result.draft` is a deep copy of the registry record. It does not save that copy back to `geography-water-cycle.ts` or `registry.ts`. Expected end state of the repository fixture, after every test, is the same draft registry record and the same legacy public page.

The pilot is not allowed to call `publishProduction` on the registry singleton. A test that needs a published object clones the record, runs the existing functions on the clone, and discards the clone.

## 9. Assessment, learner, search, and AI

Only a record that `projectProductionDelivery` returns may be added to a public learner surface. That function returns a record only when `isProductionDeliveryEligible` is true. The Water Cycle registry draft returns `undefined`. This milestone still does not add it to a public page.

The Assessment Engine remains the only scorer. Publication does not grade, does not create attempts, and does not change `assessmentSetId`. The alignment stays a reference. Learner progress and revision intelligence are not rewritten and are not fed draft bodies.

Public search continues to index the current manifest and legacy Geography pages. The review projection's search ids are not inserted into that public index for a draft. A published record may be indexed later only by a delivery adapter that checks `isProductionDeliveryEligible` first.

AI grounding stays on `isProductionAiEligible`, which is delivery eligibility. Editorial drafts, `ready_for_approval` records, `review` records, and `approved` records are not groundable. Studio generation is not an AI-grounding source.

## 10. Failure and recovery

Each case fails closed. The previous published version, when one exists, is not loaded for overwrite except by the explicit correction and deprecation functions.

| Case | Detection | Result | Retry | Replay | Published N |
|---|---|---|---|---|---|
| 1. Stale editorial CAS | `expectedRevision` ≠ stored revision, or stored revision + 1 ≠ record revision | `stale edit`; no write | Safe after reload | Not applicable | Untouched |
| 2. Stale content version | Batch draft, editorial baseline, or canonical topic version disagree, or `completedAt` disagrees on write-through | `stale content version` or editorial `persistence failure` on the write-through reload | Safe after reload | Safe only when `completedAt` and `contentVersion` match | Untouched |
| 3. Missing quality snapshot | Snapshot absent at the bridge | Bridge evaluates with `evaluateProductionQuality`. If that result is blocked, it stops. It does not invent a snapshot. | Safe | Safe if copies already match | Untouched |
| 4. Mismatched snapshot | `contentId` or `contentVersion` ≠ topic | Reject before `approveProduction` / `publishProduction`. Do not repair. | Safe after a real evaluation of this version | Not a write-through repair | Untouched |
| 5. Blocked Quality Gate | overall `blocked`, or a must-not-be-blocked dimension `blocked` on editorial advance | Editorial: `editorial_quality_blocked`, status unchanged. Canonical: existing approval and publication errors. | Safe after the draft is fixed and re-evaluated | Safe for an already saved editorial file | Untouched |
| 6. Missing provenance | Gate provenance blocker, or editorial `malformed draft` / `invalid source reference` | No handoff and no approval | Safe after the operator supplies real references | Does not invent sources | Untouched |
| 7. Invalid canonical identity | Topic id mismatch, or `buildReviewProjection` throws `invalid canonical identity` | Reject. No id minting. | Not safe until the id is the existing canonical id | No | Untouched |
| 8. Invalid workflow transition | Existing `invalid transition` or `only review content can be approved` or `only approved content can be published` | No write | Safe only from the legal prior state | No | Untouched |
| 9. Persistence failure | Unequal editorial and batch copies, corrupt editorial JSON, store throw, or failed registry write after a pure function returned | Editorial file kept when it was already valid. Corrupt file kept. Registry write not committed. | Safe after the cause is removed | Safe for unequal copies when guards match. Unsafe when the editorial file cannot be parsed. | Untouched |
| 10. Publication failure | Any publication precondition or a failed registry write | Canonical record stays `approved` if that was the stored state | Safe after the precondition is true | No | Untouched |
| 11. Concurrent editorial modification | Second save uses an old `expectedRevision` | `stale edit` | Safe after reload | No | Untouched |
| 12. Published N plus draft N+1 | Correction constructed with `createProductionCorrection` | N unchanged and still deliverable if still `published` and not blocked. N+1 is `draft`. | Editing N+1 uses a new editorial record | Replay applies only to N+1's batch item | Untouched by N+1 edits |

## 11. Implementation boundaries

Reuse these modules. Do not add a parallel model, gate, provenance system, review store, publication machine, assessment engine, learner engine, or search engine.

| Need | Reuse |
|---|---|
| Canonical transitions | `src/lib/content/production/workflow.ts` |
| Record shape | `src/lib/content/production/types.ts` |
| Registry read | `src/lib/content/review/registry.ts` `getReviewRecord` |
| Review read model | `src/lib/content/review/projection.ts` `buildReviewProjection` |
| Gate | `evaluateProductionQuality` and `validateContentQuality` |
| Delivery and AI flags | `isProductionDeliveryEligible`, `isProductionAiEligible` |
| Pilot delivery projection | `projectProductionDelivery`, a pure wrapper around `isProductionDeliveryEligible`. Not `getPublishedTopicDelivery`. |
| Editorial save, open, replay | `src/lib/content-studio/editorial/` |
| Batch draft write | `updateBatchItemDraft` |
| Inbox handoff marker | `recordEditorialHandoff` |
| Water Cycle fixture | `src/lib/content/production/batches/geography-water-cycle.ts` |
| Legacy public page, not changed | `src/app/geography/[topic]/page.tsx` reading `src/lib/geography-data.ts` |

Two additions are required because no existing function covers them. `approveProduction` does not know about `EditorialDraftRecord`, and the CMS must not import publication functions. The bridge belongs in `src/lib/content/production/editorial-handoff.ts`. It calls `submitProductionForReview` only after the section 4 checks. `projectProductionDelivery` is the other addition. It cannot be `getPublishedTopicDelivery`, because that helper reads the legacy-linked topic manifest rather than a `ProductionRecord`. The CMS may later gain one server action that calls the bridge. That action is not part of this document's implementation. No new route is added.

No new `workflowState` is required. No database is required for the pilot: tests use the memory batch store and a cloned registry record. A durable canonical registry can later replace `getReviewRecords`'s constant list behind the same read functions. That store is not this design's first step.

`geography-data.ts` is not the publication target and is not migrated.

## 12. Test strategy

Tests are behavior checks on cloned records and a memory batch. They do not call Gemini. They do not write the Water Cycle source file. They assert on returned records and on thrown messages.

- Valid handoff: a copy at `ready_for_approval` with a matching unblocked snapshot becomes `workflowState` `review`. The source registry object is still `draft`.
- Blocked quality: overall `blocked` does not enter review through the bridge, and `approveProduction` still throws.
- Stale version: a canonical `contentVersion` of 2 against an editorial baseline of 1 throws and does not write.
- Missing snapshot: the bridge evaluates; it does not persist a hand-built snapshot.
- Mismatched snapshot: `contentVersion` on the snapshot disagrees; approval and publication are not called successfully.
- Provenance: a dangling source reference does not hand off.
- Valid approval: `review` plus both passed review types and a matching unblocked snapshot becomes `approved`, same `contentVersion`, not deliverable.
- Invalid approval: draft, blocked snapshot, or only one review type throws, and the input object is unchanged.
- Valid publication: `approved` becomes `published`, `isProductionDeliveryEligible` becomes true, version unchanged.
- Invalid publication: `review` or a blocked snapshot throws.
- Published preservation: `createProductionCorrection` leaves the published clone's JSON equal to its prior JSON. The new draft is version N+1.
- Concurrent editor: two saves with the same `expectedRevision`; one `stale edit`; stored revision is the winner.
- Persistence and replay: unequal copies throw, the editorial file remains, replay copies production onto the batch draft when guards match, and a corrupt file is not replayed.
- Public visibility: `projectProductionDelivery` returns `undefined` for the Water Cycle registry record and returns the discarded published clone only after `publishProduction`. It never reads `geography-data.ts`. `/geography/[topic]` is not asserted as serving the production package.
- Unpublished privacy: search and AI eligibility on the draft projection do not become public-index or grounding eligibility.
- Boundaries: the bridge module's source does not import learner stores, the assessment scorer, or `geography-data.ts`. Publication does not call a scoring function.

`npm run verify:content-production` and `npm run verify:editorial-workspace` remain the suites that grow these cases. No new runner is required.

## 13. Later browser verification

Not part of this specification pass. When implementation exists, a browser check should:

1. Open the Editorial CMS on a non-production copy and see `DRAFT — NOT CANONICAL`.
2. Show `ready_for_approval` without a live Approve action succeeding.
3. Open `/content-review` and see Water Cycle still as a draft review record.
4. Confirm the approval control is absent or inert until the canonical function is wired, and that a blocked draft cannot pass it.
5. Open `/geography/[topic]` and see the legacy page from `geography-data.ts`. Do not expect it to serve the production package. That expectation is the protection check, not a failed publication.
6. Confirm an editorial draft URL is not linked from the public Geography page.
7. Confirm a discarded published clone is visible only to `projectProductionDelivery` in the test, and that `/geography/[topic]` still serves the legacy page rather than version N or an N+1 draft.

## 14. Explicit non-goals

This design excludes Android and iOS, a new V10.7 architecture document, a new CMS, a new database, an authentication redesign, payment, monetization, B2B or API products, bulk generation, Geography migration, migration of `geography-data.ts`, a redesign of the Assessment Engine, a redesign of Learner Intelligence, a new search architecture, a new AI provider, an autonomous batch worker, global localization work, and publication that skips `approveProduction`.

## 15. Non-goals for the Water Cycle fixture

Do not edit `geography-water-cycle.ts` to make the pilot pass. Do not register a `ProductionReview` by editing the audit markdown into code. Do not flip the registry record to `published`. Do not point `/geography/[topic]` at the production package in this milestone.
