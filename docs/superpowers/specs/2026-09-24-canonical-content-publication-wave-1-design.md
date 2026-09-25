# Canonical Content Publication Wave 1

**Date:** 2026-09-24
**Status:** Specification for human review. This document does not implement publication.
**Authority:** This design uses the existing publication functions. It does not replace `docs/superpowers/specs/2026-09-04-v10-7-product-brand-platform-expansion-architecture.md`, the Universal Content Schema, the provenance specification, the Quality Gate, the canonical production pipeline, the Live Canonical Content Review architecture, the Editorial CMS design, or `docs/superpowers/specs/2026-09-23-end-to-end-canonical-publication-loop-design.md`.
**Proof already in the repository:** commit `c804dda4602234eaa0797331cad8ac05dbdd561c` shows the same functions on a discarded Water Cycle clone. `getReviewRecords()` still returns that topic as `workflowState: "draft"`. `/geography/[topic]` still reads `src/lib/geography-data.ts`.

## 1. Purpose

Wave 1 runs the existing canonical publication functions on the four real Geography production records. It is not a new architecture and not a regeneration pass. A topic is published only when the existing fail-closed checks pass. A topic that fails stays at its previous registry state and names the blocking error. One topic's failure does not undo another topic's completed publication.

## 2. Current baseline

`getReviewRecords()` in `src/lib/content/review/registry.ts` builds each record with `createProductionDraft` and `evaluateProductionQuality` at module load. There is no second list and no writer. For each Wave 1 topic the current registry record is:

| Topic | Topic id | contentVersion | workflowState | Quality overall | ProductionReview rows |
|---|---|---|---|---|---|
| The Water Cycle | `topic/geography/water-cycle` | 1 | `draft` | `pass` | none |
| Latitude and Longitude | `topic/geography/latitude-and-longitude` | 1 | `draft` | `pass` | none |
| Atmosphere | `topic/geography/atmosphere` | 1 | `draft` | `pass` | none |
| Plate Tectonics | `topic/geography/plate-tectonics` | 1 | `draft` | `pass` | none |

`verify-review.ts` asserts those overall values. The package files still contain a topic `lifecycle` literal of `published`. `createProductionDraft` replaces that with `draft` before the registry record exists. Callers must use `getReviewRecord`, not the raw package lifecycle.

`projectProductionDelivery` returns a record only when `isProductionDeliveryEligible` is true. All four registry records return `undefined` today.

`recordEditorialHandoff` writes an inbox marker with `registeredInContentReview: false`. That flag is not registry membership. These four topics are already in `getReviewRecords()`.

The 2026-09-03 audit markdown files are historical notes. They are not `ProductionReview` rows. The Water Cycle audit verdict is `READY WITH WARNINGS`. That sentence does not authorize `approveProduction`.

`/geography/[topic]` reads `src/lib/geography-data.ts`. That file is legacy reference material. It is not the publication source.

## 3. Scope

Wave 1 may:

- Read the four package files and the current registry records.
- Call `submitProductionForReview`, `recordProductionReview`, `approveProduction`, `publishProduction`, `evaluateProductionQuality`, `buildReviewProjection`, `isProductionDeliveryEligible`, `isProductionAiEligible`, and `projectProductionDelivery`.
- Replace one topic's object inside the existing `localRecords` list in `registry.ts` after `publishProduction` returns. That is the same registry, not a new one.
- Leave package content files unchanged. Concepts, units, blocks, claims, sources, objectives, and alignments stay byte-identical.
- Record an operator-supplied review packet when a human operator provides `reviewerId`, `reviewedAt`, and `outcome` for each required review type during execution.

Wave 1 may not publish a live registry record when those review fields were not supplied by an operator in that execution.

## 4. Non-goals

This specification does not authorize a new CMS, review registry, publication registry, approval engine, content schema, quality gate, search index, AI grounding path, Geography runtime, database, API, authentication system, commerce system, or mobile client.

It does not authorize content regeneration, new sources, academic repair, a batch-worker publication, or a public-route switch. `src/lib/geography-data.ts` and `src/app/geography/[topic]/page.tsx` stay unchanged. Search, the Assessment Engine, and Learner Intelligence stay unchanged.

This task does not authorize commit, push, merge, reset, rebase, or a branch switch. Those actions are outside the specification stage.

## 5. Wave 1 topics

The only topic ids in the wave are:

1. `topic/geography/water-cycle`
2. `topic/geography/latitude-and-longitude`
3. `topic/geography/atmosphere`
4. `topic/geography/plate-tectonics`

Execution order is that list. Each id is loaded with `getReviewRecord`. No other pilot package is submitted, approved, or published by the wave.

## 6. Existing publication pipeline

The stored canonical states are the existing `ProductionWorkflowState` values: `draft`, `review`, `approved`, `published`, `deprecated`, `archived`. `review` is the state between `draft` and `approved`. It is not an editorial status and not an inbox lane.

The functions and their existing gates stay in `src/lib/content/production/workflow.ts`:

- `submitProductionForReview` moves `draft` to `review`.
- `recordProductionReview` appends one row only while `workflowState` is `review`. Allowed types are `editorial` and `academic-source`. `automated` is rejected.
- `approveProduction` accepts only `review`, requires a passed `editorial` row and a passed `academic-source` row for the current `contentVersion`, rejects `overall === "blocked"`, and rejects a present snapshot whose `contentId` or `contentVersion` disagrees with the topic. A missing snapshot is passed through `evaluateProductionQuality`. The returned object carries that evaluation. The input object is not mutated. Approval does not increment `contentVersion`.
- `publishProduction` accepts only `approved`, requires a non-empty `publishedAt`, applies the same snapshot rules, and sets `publishedAt`. It does not increment `contentVersion`.
- `projectProductionDelivery` returns the record only when `isProductionDeliveryEligible` is true.

`submitReadyEditorialRecord` remains the studio-batch bridge. Wave 1 does not call it for these four registry records, because they are not batch items and they have no editorial file. Calling it would require a fabricated `EditorialDraftRecord`.

## 7. Per-topic state transition

Four axes stay independent.

**Content quality.** `pass`, `warning`, or `blocked` on `qualitySnapshot.report.overall`.

**Editorial workflow.** `needs_editing`, `ready_for_review`, `changes_requested`, `ready_for_approval`, stored only on an `EditorialDraftRecord`. These four registry records have no editorial file. The wave report uses the words `no editorial file`. That phrase is not a new `EditorialStatus`.

**Batch item state and inbox lane.** `BatchItemState` is `pending`, `running`, `succeeded`, `quality_blocked`, `source_insufficient`, `rate_limited`, or `failed`. `generated` and `ready_for_editorial_review` are `ProductionInboxLane` values, not editorial statuses and not canonical workflow states. Wave 1 does not create a batch and does not change a batch item.

**Canonical publication.** `draft`, `review`, `approved`, `published`, `deprecated`, `archived` on `workflowState`.

No axis is inferred from another. A quality `pass` is not `ready_for_approval`, not `approved`, and not `published`. `ready_for_approval` is not `workflowState`. An inbox lane is not a review row.

For one topic, the legal sequence on its registry record is:

```text
workflowState draft
→ submitProductionForReview
→ recordProductionReview type editorial outcome passed
→ recordProductionReview type academic-source outcome passed
→ approveProduction
→ publishProduction
→ projectProductionDelivery returns that record
```

`contentVersion` stays `1` through publication. Topic and knowledge-unit `lifecycle` become `review` on submission and `published` on approval and publication, because that is what `lifecycleForState` already does. `isProductionDeliveryEligible` stays false until `workflowState` is `published`.

## 8. Quality Gate boundary

Publication is fail-closed. A topic proceeds only when all of these hold:

- `getReviewRecord(topicId)` exists and `content.topic.id` equals that id.
- `contentVersion` is `1` on the topic and on every knowledge unit and assessment alignment in that record.
- The snapshot exists after evaluation, `contentId` equals the topic id, and `contentVersion` equals the topic version.
- `report.overall` is not `blocked`.
- Provenance still satisfies `validateClaimsAndProvenance` inside the gate. The wave does not add sources or rewrite claims.
- Both required review rows have `outcome: "passed"` and the same `contentVersion`.
- `workflowState` allows the next existing transition.

`warning` does not block. `approveProduction` and `publishProduction` reject only `overall === "blocked"`. A dimension warning with overall `pass` remains publishable. The gate is not edited to force these four packages through.

If the snapshot is missing, the wave calls `evaluateProductionQuality` and uses the returned snapshot. It does not write `overall: "pass"` by hand. If that evaluation is `blocked`, the topic stops. If a snapshot is present and the ids or versions disagree, the topic stops with `quality snapshot does not match content identity`. The snapshot is not repaired.

## 9. Editorial and academic review boundary

The two review rows are different `ProductionReview.type` values. One passed row does not satisfy the other. A `failed` or `warning` outcome does not satisfy `hasPassedReview`.

Three evidence classes stay separate in the wave report:

| Class | What it is | What it is not |
|---|---|---|
| Automated verification | `qualitySnapshot` from `evaluateProductionQuality` | A human review |
| Existing review-record state | `reviews` on the registry record. Today each Wave 1 record has `reviews.length === 0` | The 2026-09-03 audit markdown |
| Operator action | A review packet supplied to the wave execution with `reviewerId`, `reviewedAt`, and `outcome` for `editorial` and for `academic-source` | A reviewer id invented by the program |

The wave reads no audit file. If the operator packet is absent, the topic result is `blocked` and the blockers are `missing-editorial-review` and `missing-academic-source-review`. The registry object for that topic stays the previous draft. No `ProductionReview` row is inserted.

If the operator packet is present, the wave calls `recordProductionReview` once per type with those exact fields. The evidence row records `source: operator-supplied`. It does not record `source: 2026-09-03-audit`.

The Editorial CMS is not asked to mark these records `ready_for_approval`. Studio batch state is not part of this decision.

## 10. Version safety

Publication of version `1` does not change `contentVersion` to `2`. `publishedAt` is set. The published object is a new record returned by `publishProduction`. The package source file is not rewritten.

A correction uses `createProductionCorrection(published, correctedContent)`. It is legal only when `correctedContent.topic.id` is the same and `correctedContent.topic.contentVersion` is exactly `2`. The returned record is `workflowState: "draft"` and `supersedesVersion` is `1`. The published version `1` object is not mutated. `projectProductionDelivery` continues to return version `1` and returns `undefined` for the version `2` draft.

The editor rejects a record that carries `supersedesVersion` with `malformed draft: immutable field`. Wave 1 does not change that rule and does not open a correction draft in the CMS.

Editorial compare-and-swap is unchanged for studio items. Wave 1 does not write an editorial file for these four topics, so it does not advance their editorial `revision`.

## 11. Partial failure and resume

The wave is not one transaction. The executor walks the four ids in section 5. For each id it holds the previous registry object, runs the functions, and replaces that id's slot only after the function that just succeeded returns. A throw, or a deliberate `blocked` result, leaves that slot on the previous object. Slots already replaced stay replaced.

Example outcome, all allowed:

| Topic | Result |
|---|---|
| Water Cycle | `published` |
| Latitude and Longitude | `blocked` |
| Atmosphere | `published` |
| Plate Tectonics | `blocked` with `missing-editorial-review` |

Resume reads the current registry state and continues from it:

- `draft` with no operator packet: remain `blocked`, no write.
- `draft` with a complete operator packet and a matching unblocked snapshot: submit, record both reviews, approve, publish.
- `review` with both passed rows: approve, then publish. Do not append duplicate passed rows of the same type.
- `approved`: publish only.
- `published` and `projectProductionDelivery` returns the record: return `published` again and do not call `publishProduction`.

A retry of a `blocked` topic is safe after the blocker is removed. A retry does not republish an already published topic and does not deprecate it.

The wave summary lists one result per topic id: `published` or `blocked`, the blocker strings, `contentVersion`, `workflowState`, whether `projectProductionDelivery` returned the record, and whether `isProductionAiEligible` is true.

## 12. Isolation guarantees

Before `workflowState` is `published`, `projectProductionDelivery` returns `undefined` and `isProductionAiEligible` is false. The review projection's search eligibility flag is not written into `src/lib/search`. Draft and `approved` records are not AI-groundable.

Wave 1 does not import or call the search indexer, the assessment scorer, learner-intelligence ingestion, entitlement, or commerce. It does not add an assessment set id. The existing alignment ids stay as they are. It does not read or write `src/lib/geography-data.ts` or `src/app/geography/[topic]/page.tsx`.

`getReviewRecords()` remains the only review list. Topics outside the four ids keep the same draft objects they have now.

## 13. Evidence and audit model

Each topic result is a deterministic object in the verifier output. Fields:

- `topicId`
- `contentVersion`
- `qualitySnapshot.contentId`
- `qualitySnapshot.contentVersion`
- `qualitySnapshot.report.overall`
- editorial file presence (`no editorial file` for these four records)
- `reviews` types and outcomes, each marked `operator-supplied` or `absent`
- `workflowState` before and after the topic step
- `publishedAt` when published
- `projectProductionDelivery` result: `returned` or `undefined`
- `isProductionAiEligible`
- byte equality of `src/lib/geography-data.ts`, `src/app/geography/[topic]/page.tsx`, and the four package files against their pre-wave contents
- confirmation that search, assessment scoring, and learner-intelligence modules were not imported by the wave executor

The report stores no API key, provider body, or learner record.

## 14. Browser verification

The implementation that follows this specification must open a development server and record HTTP status and visible text for:

- `/content-studio`
- `/content-review`
- one existing Editorial CMS route that already resolves, without adding a publish control
- `/geography/physical-geography`

`/content-review` may show a Wave 1 topic as `published` only after that topic's registry slot was replaced by `publishProduction`. Until then it shows `draft`. `/geography/physical-geography` must still render the legacy study page and must not show `topic/geography/water-cycle` as a production delivery id. Approve and Publish controls in the Editorial CMS stay disabled. The browser console must show no uncaught exception on these routes.

Browser evidence shows that the server still runs. It does not show that legacy Geography has become the canonical publication source.

## 15. Testing strategy

Implementation is test-first. Each new assertion is run and observed failing before the registry replacement or wave executor is added. Tests live in `src/lib/content/production/verify-production.ts` unless the file cannot import the registry without a cycle. In that case they live in `src/lib/content/review/verify-review.ts`. No new npm script is required if `verify:content-production` or `verify:content-review` already runs the file.

Required cases:

1. Water Cycle registry record, with an operator packet in the test, ends `published`, `contentVersion` `1`, and `projectProductionDelivery` returns it.
2. The same for `topic/geography/latitude-and-longitude`.
3. The same for `topic/geography/atmosphere`.
4. The same for `topic/geography/plate-tectonics`.
5. A snapshot `contentVersion` of `2` on version `1` throws `quality snapshot does not match content identity` and the stored object is unchanged.
6. A missing snapshot is not given `overall: "pass"` by assignment. `evaluateProductionQuality` runs. A blocked evaluation throws and the stored object stays `draft` or `review`.
7. After publication of version `1`, `createProductionCorrection` returns version `2` with `supersedesVersion` `1`, the version `1` JSON is unchanged, and delivery still returns version `1`.
8. Publishing Water Cycle and then blocking Latitude and Longitude leaves Water Cycle `published` and Latitude and Longitude at its previous state.
9. `publishProduction` on an invalid record throws, and the caller's stored object compares equal to its prior JSON.
10. File bytes of `src/lib/geography-data.ts` and `src/app/geography/[topic]/page.tsx` are unchanged.
11. The wave module source does not mention `src/lib/search`.
12. The wave module source does not mention `assessment-engine`.
13. The wave module source does not mention `learner-intelligence`.
14. `projectProductionDelivery` of each registry record is `undefined` before that topic is published.
15. `projectProductionDelivery` of a published topic record returns that record.
16. A second wave run on an already published topic does not change `publishedAt` and does not append another review row.

The tests call the real workflow functions. They do not stub `approveProduction` or `publishProduction`. They do not call Gemini or xAI. Rejection cases use `structuredClone(getReviewRecord(topicId))` and do not write that clone back into `localRecords`.

Success cases call the wave function on the registry record. When that call returns `published`, the existing `registry.ts` list returns that published object on the next `getReviewRecord`. `verify-review.ts` then asserts `workflowState` `published`, `contentVersion` `1`, and the same topic id. It does not keep asserting `draft` for a topic the wave published. Package-file assertions stay. A topic that remains `blocked` keeps the current `draft` assertion.

## 16. Rollback and failure semantics

There is no multi-topic rollback. A published topic stays published when a sibling topic blocks. Reverting one published topic is a separate `deprecateProduction` call and is not part of a failed sibling.

Per topic, the stored registry object changes only after the successful return of the function that advances it. A throw skips that assignment. `publishProduction` does not mutate its input. Package files are not written, so a failed topic cannot leave a half-edited package.

An operator packet with a missing `reviewerId` or an unparseable `reviewedAt` is a blocker. No partial review row is kept for that topic.

## 17. Deferred work

These items are outside Wave 1 and are not implied by a successful publication:

- Replacing `/geography/[topic]` so it reads `projectProductionDelivery`.
- Editing `src/lib/geography-data.ts`.
- Opening version `2` corrections in the Editorial CMS.
- Publishing any topic that is not in section 5.
- An autonomous batch worker.
- Authentication, payment, and a database-backed registry.

`getPublishedTopicDelivery` stays the catalog helper for legacy topic metadata. Wave 1 does not route Geography through it.

## 18. Acceptance criteria

The specification meets its gate only when a reader can confirm all of the following from this document:

- Wave 1 uses the four existing registry records and package files.
- No regeneration is required.
- `submitProductionForReview`, `recordProductionReview`, `approveProduction`, `publishProduction`, and `projectProductionDelivery` are the publication mechanism.
- Each topic commits or blocks on its own.
- The Quality Gate still rejects `blocked` and mismatched snapshots.
- Editorial and academic-source reviews are two rows.
- Version `1` stays version `1` when published. Version `2` is a separate correction and is not deliverable.
- Legacy Geography files and the public Geography route are not the publication write.
- Search, AI grounding, assessment scoring, and learner intelligence are not rewritten. Unpublished records stay non-deliverable.
- The existing `registry.ts` list remains the only review list.
- Browser checks are required of the implementation.
- Tests are written before the wave behavior and call the real functions.
- This specification stage does not authorize push, merge, reset, rebase, or a branch switch.

## 19. Implementation boundary

The future implementation plan, not this document, may name the wave function and the test order. The function belongs beside `src/lib/content/production/workflow.ts` and may update the existing array inside `src/lib/content/review/registry.ts` after a successful return. It must not add a second array, a file store, or a route.

Until that implementation is reviewed and written, `getReviewRecords()` continues to return four drafts, and `projectProductionDelivery` continues to return `undefined` for them.
