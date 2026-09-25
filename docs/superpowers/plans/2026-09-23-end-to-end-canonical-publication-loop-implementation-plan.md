# End-to-End Canonical Content Publication Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove a cloned Water Cycle `ProductionRecord` can move through editorial readiness, canonical review rows, `approveProduction`, and `publishProduction`, and that `projectProductionDelivery` returns only that published clone.

**Architecture:** Keep the Editorial CMS, the Production Inbox handoff, and `ProductionWorkflowState` as separate axes. Add a pure delivery projection beside `isProductionDeliveryEligible`. Add one bridge that may call `submitProductionForReview` and must not call `approveProduction` or `publishProduction`. Reject a present quality snapshot whose identity does not match the topic. Do not add a registry writer, a route, or a second review model.

**Tech Stack:** TypeScript, Node verifiers run with `node --experimental-strip-types --import ./scripts/register-ts-alias.mjs`, existing `node:assert/strict` scripts. No Gemini and no xAI.

**Spec:** `docs/superpowers/specs/2026-09-23-end-to-end-canonical-publication-loop-design.md`

**Inspected baseline:** branch `feature/editorial-cms-workspace`, commit `027d5350af3970b67eb4d70d24523dd32f89ceab`. Re-check `git rev-parse HEAD` before editing. Do not commit from the planning run.

## Global Constraints

- Do not edit `src/lib/geography-data.ts` or `src/app/geography/[topic]/page.tsx`.
- Do not edit `src/lib/content/production/batches/geography-water-cycle.ts` or `src/lib/content/review/registry.ts`.
- Do not change `getPublishedTopicDelivery` or `projectPublishedTopicDelivery`. Those functions read the topic manifest, whose Geography rows use `contentSource: "geography-data"`. They are not this pilot.
- Do not import `approveProduction` or `publishProduction` from `src/lib/content-studio/editorial/`. The editorial verifier joins that directory and asserts those names are absent.
- `registeredInContentReview` stays the literal `false` on `BatchEditorialHandoff`. `recordEditorialHandoff` does not register a canonical record. Water Cycle is already returned by `getReviewRecords()` as `workflowState: "draft"`.
- `contentVersion` is not an editorial `revision`. Approval and publication must not increment it.
- No database, no authentication role, no new review type, no batch-worker publication, no public route change.
- The 2026-09-03 Water Cycle audit markdown is not a `ProductionReview`.
- Lint may keep exactly three pre-existing findings: `StudioForm.tsx` `react-hooks/set-state-in-effect`, `source-packet.ts` unused `_identity`, and `geography-data.ts` unused `banglaSummaries`. New findings fail the task.

## Review Focus

1. `approveProduction` must throw when only one of `editorial` and `academic-source` has `outcome: "passed"`.
2. A snapshot whose `contentId` or `contentVersion` disagrees with `content.topic` must throw before workflow changes. Do not rewrite the snapshot.
3. `createProductionCorrection` must leave the published object's JSON unchanged and return a separate draft at N+1.
4. `projectProductionDelivery` must return `undefined` for `draft`, `review`, `approved`, a blocked snapshot, and a mismatched snapshot.
5. `publishProduction` and `approveProduction` must not mutate the object the caller still holds. A thrown call leaves that object byte-for-byte equal to its prior JSON.

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/content/production/workflow.ts` | MODIFY | Add `snapshotMatchesIdentity` and `projectProductionDelivery`. Call `snapshotMatchesIdentity` from `approveProduction` and `publishProduction` when a snapshot is present. |
| `src/lib/content/production/index.ts` | MODIFY | Export `projectProductionDelivery`. |
| `src/lib/content/production/editorial-handoff.ts` | CREATE | `submitReadyEditorialRecord`. Calls `submitProductionForReview` only. |
| `src/lib/content/production/verify-production.ts` | TEST | All new assertions. Existing assertions stay. |
| `CURRENT_STATE.md` | MODIFY | One paragraph: clone-only proof, legacy Geography route unchanged. |
| `src/lib/geography-data.ts` | READ-ONLY | Legacy study payload. |
| `src/app/geography/[topic]/page.tsx` | READ-ONLY | Public route. Still imports `geography-data`. |
| `src/lib/content/delivery.ts` | READ-ONLY | Catalog delivery. Do not use it for this proof. |
| `src/lib/content/review/registry.ts` | READ-ONLY | `getReviewRecords` / `getReviewRecord`. No setter. |
| `src/lib/content/review/projection.ts` | READ-ONLY | `buildReviewProjection`. |
| `src/lib/content/production/batches/geography-water-cycle.ts` | READ-ONLY | Fixture source. Clone it. |
| `src/lib/content-quality/gate.ts` and `validators.ts` | READ-ONLY | Gate stays the blocker source. |
| `src/lib/content-studio/editorial/` | READ-ONLY | Existing `commitMarkReadyForReview` and `commitMarkReadyForApproval`. |
| `src/lib/content-studio/batch-engine/handoff.ts` | READ-ONLY | Inbox marker only. |
| `src/lib/content-studio/editorial/actions.ts` | READ-ONLY | Do not add a publish or approve action. |

`editorial-handoff.ts` is a new file because `workflow.ts` must not import the editorial store, and `src/lib/content-studio/editorial/` must not name `approveProduction` or `publishProduction`. The bridge imports `submitProductionForReview` from `./workflow`, `EditorialDraftRecord` from `../content-studio/editorial/types`, and batch types from `../content-studio/batch-engine/types`. It must not import `./index` or `../content-studio/editorial/index`.

No registry writer is added. Canonical functions already return a new object. The caller replaces its variable only after the return. That is the atomicity mechanism.

## Shared fixture the tests must use

In `verify-production.ts`, add this helper and do not export it:

```ts
function waterCycleDraft(): ProductionRecord {
  return evaluateProductionQuality(createProductionDraft(structuredClone(geographyWaterCycleProductionPackage)));
}
```

`verify-review.ts` already asserts that this evaluation has `qualitySnapshot.report.overall === "pass"`, `contentId === "topic/geography/water-cycle"`, and `contentVersion === 1`. `createProductionDraft` forces topic and unit `lifecycle` to `draft` even though the package literal says `published`. Use the helper, not the raw package lifecycle.

`passedReviews(record)` appends two rows through `recordProductionReview`: `type: "editorial"`, `outcome: "passed"`, `reviewerId: "reviewer/editorial-1"`, `reviewedAt: "2026-09-23T00:00:00.000Z"`; then `type: "academic-source"`, `outcome: "passed"`, `reviewerId: "reviewer/academic-1"`, `reviewedAt: "2026-09-23T00:01:00.000Z"`. Call it only after `submitProductionForReview`.

Error prefix already used by `workflow.ts` is `Canonical content production: `.

## Task 1: Confirm contracts before editing

**Files:** read-only paths in the file map.

- [ ] Read `approveProduction`, `publishProduction`, `submitProductionForReview`, `recordProductionReview`, `createProductionCorrection`, `isProductionDeliveryEligible`, and `isProductionAiEligible` in `workflow.ts`.
- [ ] Confirm `getReviewRecord("topic/geography/water-cycle")` is a draft and `projectProductionDelivery` is not defined.
- [ ] Confirm `BatchEditorialHandoff.registeredInContentReview` is the literal `false`.
- [ ] Record `git hash-object src/lib/geography-data.ts`, `src/app/geography/[topic]/page.tsx`, and `src/lib/content/production/batches/geography-water-cycle.ts`. The implementation must leave those hashes unchanged.

No production code in this task.

## Task 2: Failing delivery tests

**Files:** `src/lib/content/production/verify-production.ts`

**Command:** `npm run verify:content-production`

**Expected RED:** `projectProductionDelivery` is not exported from `./index`.

- [ ] Import `projectProductionDelivery` from `./index`.
- [ ] Case `delivery draft`: `projectProductionDelivery(waterCycleDraft())` is `undefined`.
- [ ] Case `delivery review`: submit the draft, then the projection is `undefined`.
- [ ] Case `delivery approved`: submit, `passedReviews`, `approveProduction`. Projection is `undefined`. `isProductionDeliveryEligible` is false. `contentVersion` is `1`.
- [ ] Case `delivery published`: `publishProduction(approved, "2026-09-23T00:02:00.000Z")`. Projection is that returned object. `workflowState` is `published`. `contentVersion` is `1`.
- [ ] Case `delivery blocked`: on a published clone, replace `qualitySnapshot.report.overall` with `"blocked"`. Projection is `undefined`.
- [ ] Case `delivery mismatched version`: on a published clone, set `qualitySnapshot.contentVersion` to `2`. Projection is `undefined`.
- [ ] Case `delivery mismatched id`: on a published clone, set `qualitySnapshot.contentId` to `"topic/other"`. Projection is `undefined`.
- [ ] Case `delivery editorial status is not consulted`: build the approved record above and assert `workflowState` is `approved` while a local `editorialStatus` constant `"ready_for_approval"` is not read by the projection. The projection call uses only the `ProductionRecord`.

`ready_for_approval` is not a `workflowState`. The draft and review cases cover records that an editor would still be authoring. Do not add that string to `ProductionWorkflowState`.

Run the command and keep the failure before Task 3.

## Task 3: Implement `projectProductionDelivery`

**Files:** `src/lib/content/production/workflow.ts`, `src/lib/content/production/index.ts`

- [ ] Add and export:

```ts
export function projectProductionDelivery(record: ProductionRecord): ProductionRecord | undefined {
  return isProductionDeliveryEligible(record) ? record : undefined;
}
```

- [ ] Re-export it from `index.ts`.
- [ ] Do not branch on editorial status, inbox lane, or `geography-data`.
- [ ] Run `npm run verify:content-production`. Expected result: the existing production script prints `Canonical content production verification passed.` and the new delivery assertions pass.

## Task 4: Failing snapshot and review tests

**Files:** `src/lib/content/production/verify-production.ts`

**Command:** `npm run verify:content-production`

**Expected RED:** a published or approved record whose snapshot `contentVersion` was changed is still accepted by `publishProduction` or `approveProduction`. Today both functions trust a present snapshot and only reject `overall === "blocked"`.

- [ ] Case `approve one review`: `review` plus only the `editorial` passed row. `assert.throws` matches `/editorial and academic-source reviews must pass before approval/`. `JSON.stringify` of the input is unchanged.
- [ ] Case `approve academic only`: the same with only `academic-source`. Same error. Input unchanged.
- [ ] Case `approve failed editorial`: both types present, editorial `outcome: "failed"`. Same error. Input unchanged.
- [ ] Case `approve mismatched version`: both passed rows, snapshot `contentVersion` set to `2` before `approveProduction`. Throws `/quality snapshot does not match content identity/`. `workflowState` on the input stays `review`.
- [ ] Case `approve mismatched id`: snapshot `contentId` set to `"topic/other"`. Same new error. Input unchanged.
- [ ] Case `approve missing snapshot`: delete `qualitySnapshot` and `qualityReport` after the two passed reviews. `approveProduction` returns `workflowState` `approved`, `contentVersion` `1`, and a snapshot with `contentId` `topic/geography/water-cycle` and `contentVersion` `1`. The input object's `qualitySnapshot` is still `undefined`.
- [ ] Case `approve blocked evaluation`: on a review with both passed rows, set `content.topic.contentVersion` to `0` and remove the snapshot. `approveProduction` throws `/quality blockers prevent approval/`. Input `workflowState` stays `review`.
- [ ] Case `publish mismatched snapshot`: take a valid published-ready `approved` record, set snapshot `contentVersion` to `2`, call `publishProduction(record, "2026-09-23T00:02:00.000Z")`. Throws `/quality snapshot does not match content identity/`. Input stays `approved`.
- [ ] Case `publish empty timestamp`: `publishProduction(approved, "")` throws `/publication timestamp is required/`. Input unchanged.
- [ ] Case `publish from review`: `publishProduction(reviewRecord, "2026-09-23T00:02:00.000Z")` throws `/only approved content can be published/`.

Run the command and keep the mismatch failure before Task 5.

## Task 5: Snapshot identity on the existing approval and publication functions

**Files:** `src/lib/content/production/workflow.ts`

- [ ] Add:

```ts
function snapshotMatchesIdentity(record: ProductionRecord): boolean {
  const snapshot = record.qualitySnapshot;
  if (!snapshot) return false;
  return snapshot.contentId === record.content.topic.id
    && snapshot.contentVersion === record.content.topic.contentVersion
    && snapshot.report.contentId === snapshot.contentId
    && snapshot.report.contentVersion === snapshot.contentVersion;
}
```

- [ ] At the start of the snapshot-present branch in `approveProduction` and `publishProduction`, when `record.qualitySnapshot` is defined and `snapshotMatchesIdentity(record)` is false, throw `quality snapshot does not match content identity` before `evaluateProductionQuality` and before `transition`.
- [ ] When `qualitySnapshot` is absent, keep the current call to `evaluateProductionQuality`. Do not synthesize `overall: "pass"`.
- [ ] Do not change the blocked-overall errors or the two-review requirement.
- [ ] Run `npm run verify:content-production`. Expected: Task 2 and Task 4 assertions pass.

## Task 6: Failing bridge, provenance, and atomicity tests

**Files:** `src/lib/content/production/verify-production.ts`

**Command:** `npm run verify:content-production`

**Expected RED:** `submitReadyEditorialRecord` is not exported.

- [ ] Import `submitReadyEditorialRecord` from `./editorial-handoff`.
- [ ] Build a memory batch with `createMemoryBatchJobStore` and `createPersistentBatch` using batch number `901`, one topic whose `topicSlug` is `water-cycle`, title `The Water Cycle`, subject slug `geography`, and source text `Water Cycle canonical clone.` Set that item to `succeeded`, `executions: 1`, `result.completedAt` `2026-09-23T00:00:00.000Z`, `result.pipelineOk` true, `result.qualityOverall` `"pass"`, and `result.draft` equal to `waterCycleDraft()`.
- [ ] Open it with `createMemoryEditorialDraftStore` and the existing `commitMarkReadyForReview` then `commitMarkReadyForApproval`. `expectedRevision` starts at `0`. `updatedAt` and `evaluatedAt` are `2026-09-23T00:00:00.000Z`. Assert editorial status becomes `ready_for_approval` and `content.topic.contentVersion` stays `1`.
- [ ] Case `bridge submits`: `submitReadyEditorialRecord` returns `workflowState` `review` and lifecycle `review`. `getReviewRecord("topic/geography/water-cycle").workflowState` is still `draft`.
- [ ] Case `bridge refuses blocked`: set the draft snapshot `overall` to `"blocked"` and editorial status is still `ready_for_approval` only if you bypass the CMS advance. Call the bridge on a `ready_for_approval` record whose production snapshot overall is `"blocked"`. It throws `/quality blockers prevent canonical submission/`. Registry draft is unchanged.
- [ ] Case `bridge refuses dangling provenance`: on a clone, set `claims[0].sourceReferenceIds` to `["ref/missing"]`, re-evaluate, and store that as the editorial production and the batch draft at `ready_for_approval`. The bridge throws `/quality blockers prevent canonical submission/`.
- [ ] Case `bridge refuses snapshot mismatch`: snapshot `contentVersion` `2` on an otherwise ready record. Throws `/quality snapshot does not match content identity/`.
- [ ] Case `bridge refuses unequal copies`: change only `result.draft.content.topic.title` after the editorial save. Throws `/Editorial workspace: persistence failure/`. Editorial file remains. Registry draft remains.
- [ ] Case `handoff flag stays false`: call `recordEditorialHandoff` on the succeeded unblocked item, then the bridge. The stored handoff's `registeredInContentReview` is `false`.
- [ ] Case `publish does not mutate`: `const before = JSON.stringify(approved)`; `publishProduction(approved, "")` throws; `JSON.stringify(approved) === before`.
- [ ] Case `assign only after return`: `let slot = approved`; inside try, `const next = publishProduction(slot, "")`; assignment to `slot` is after the call. After the throw, `slot.workflowState` is `approved`.

Run the command and keep the missing-export failure before Task 7.

## Task 7: Implement `submitReadyEditorialRecord`

**Files:** `src/lib/content/production/editorial-handoff.ts`

Signature:

```ts
export function submitReadyEditorialRecord(input: {
  editorial: EditorialDraftRecord;
  batchDraft: ProductionRecord;
  canonical: ProductionRecord;
}): ProductionRecord
```

- [ ] Require `editorial.editorialStatus === "ready_for_approval"`. Otherwise throw `Canonical content production: editorial record is not ready for canonical review`.
- [ ] Deep-compare `editorial.production` and `batchDraft` with `JSON.stringify`. On mismatch throw `Editorial workspace: persistence failure`. Do not merge and do not delete.
- [ ] Require `canonical.workflowState === "draft"`. Otherwise throw `Canonical content production: invalid transition ${canonical.workflowState} -> review`.
- [ ] Require `canonical.content.topic.id === editorial.production.content.topic.id` and all three `contentVersion` numbers equal. Otherwise throw `Canonical content production: stale content version`.
- [ ] If `canonical.qualitySnapshot` is present and `contentId` or `contentVersion` mismatches, throw `Canonical content production: quality snapshot does not match content identity`.
- [ ] If the snapshot is absent, set `const evaluated = evaluateProductionQuality(canonical)`. If it is present and matches, use `canonical`. If `evaluated.qualitySnapshot.report.overall === "blocked"`, throw `Canonical content production: quality blockers prevent canonical submission`.
- [ ] Return `submitProductionForReview(evaluated)`.
- [ ] Do not call `approveProduction`, `publishProduction`, `recordEditorialHandoff`, or `getReviewRecords`.
- [ ] Run `npm run verify:content-production`. Expected: Task 6 assertions pass.
- [ ] Run `npm run verify:editorial-workspace`. Expected: still prints `Editorial workspace verification passed.` The editorial directory must still contain no `approveProduction` or `publishProduction` string.

## Task 8: Version N and draft N+1

**Files:** `src/lib/content/production/verify-production.ts`

The correction behavior already exists in `createProductionCorrection`. This task adds Water Cycle clone assertions. Extend the verifier first; the implementation is the existing function. If an assertion fails, stop and fix only a real contract bug. Do not change the Water Cycle source file.

**Command:** `npm run verify:content-production`

- [ ] Publish a Water Cycle clone at version `1`. `const before = JSON.stringify(published)`.
- [ ] Build `corrected` with `structuredClone(published.content)`, then set `topic.contentVersion`, every knowledge-unit `contentVersion`, and every assessment-alignment `contentVersion` to `2`.
- [ ] `createProductionCorrection(published, corrected)` returns `workflowState` `draft`, `contentVersion` `2`, and `supersedesVersion` `1`.
- [ ] `JSON.stringify(published) === before`. `projectProductionDelivery(published)` still returns `published`. `projectProductionDelivery(correction)` is `undefined`.
- [ ] `createProductionCorrection(published, { ...corrected, topic: { ...corrected.topic, contentVersion: 3 } })` throws `/correction must increment content version by exactly one/`. `published` JSON stays `before`.
- [ ] A second editorial save against the N+1 memory record uses `expectedRevision: 0` twice. The second throws `/Editorial workspace: stale edit/`. The published clone JSON stays `before`.
- [ ] Stale canonical version: `submitReadyEditorialRecord` with editorial `contentVersion` `1` and canonical `contentVersion` `2` throws `/stale content version/`. Neither object changes `workflowState`.

## Task 9: Water Cycle clone lifecycle

**Files:** `src/lib/content/production/verify-production.ts`

**Command:** `npm run verify:content-production`

- [ ] At the start of the case, `const registryBefore = JSON.stringify(getReviewRecord("topic/geography/water-cycle"))`.
- [ ] `const packageBefore = readFileSync` of `src/lib/content/production/batches/geography-water-cycle.ts`.
- [ ] `const legacyBefore = readFileSync` of `src/lib/geography-data.ts` and `src/app/geography/[topic]/page.tsx`.
- [ ] Clone with `waterCycleDraft()`. Assert `workflowState` `draft`, `contentVersion` `1`, snapshot overall `pass`, `reviews` length `0`.
- [ ] Drive editorial status with the Task 6 memory batch: `needs_editing` on open (`openEditorialDraft` returns `editorialStatus` `needs_editing`, `persisted` false, and the editorial store load is `null`), then `commitMarkReadyForReview` yields `ready_for_review`, then `commitMarkReadyForApproval` yields `ready_for_approval`.
- [ ] `submitReadyEditorialRecord` yields `review`.
- [ ] `passedReviews` yields two rows. `buildReviewProjection` on that object has `lifecycle.workflowState` `review`, `lifecycle.deliverable` false, and `lifecycle.aiGroundable` false.
- [ ] `approveProduction` yields `approved`, `contentVersion` `1`, `isProductionDeliveryEligible` false, `projectProductionDelivery` `undefined`.
- [ ] `publishProduction(approved, "2026-09-23T00:02:00.000Z")` yields `published`. `projectProductionDelivery` returns that object. `isProductionAiEligible` is true only on that object.
- [ ] `JSON.stringify(getReviewRecord("topic/geography/water-cycle")) === registryBefore`.
- [ ] The three `readFileSync` snapshots equal their `before` values.
- [ ] The published clone is local to the test. Do not pass it to `getReviewRecords` and do not write a file.

## Task 10: Search, AI, assessment, and learner isolation

**Files:** `src/lib/content/production/verify-production.ts`, source text of `editorial-handoff.ts` and `workflow.ts`

**Command:** `npm run verify:content-production`

- [ ] On the draft, review, and approved Water Cycle clones, `buildReviewProjection(...).lifecycle.aiGroundable` is false and `.lifecycle.deliverable` is false.
- [ ] `buildReviewProjection(draft).integrations.search.eligible` may be true because the gate passed. Assert that this does not call a search indexer: `editorial-handoff.ts` and the new `projectProductionDelivery` function body do not contain `src/lib/search`, `learner-intelligence`, `assessment-engine`, or `geography-data`.
- [ ] The published clone's `assessmentAlignments[0].id` is still `alignment/geography-production/water-cycle` and `assessmentSetId` is still `pilot/geography/water-cycle`. No second alignment id appears.
- [ ] `npm run verify:search`, `npm run verify:assessment-scoring`, and `npm run verify:learner-intelligence` pass without edits to those directories. Expected: each script's existing success line and exit 0.

## Task 11: Browser verification of the boundary

Do this after Tasks 3, 5, and 7. Do not add UI.

- [ ] Start `npx next dev --port 3467` from this worktree.
- [ ] Open `http://127.0.0.1:3467/content-studio`. Expect HTTP 200 and the text `DRAFT — NOT CANONICAL`.
- [ ] Open `http://127.0.0.1:3467/content-review`. Expect HTTP 200. Water Cycle, if listed, is a draft record from `getReviewRecords`, not a published production page.
- [ ] Open `http://127.0.0.1:3467/geography/physical-geography` or the first legacy topic the page already generates. Expect the legacy study page. View source or the document text must not contain `topic/geography/water-cycle` as a production delivery id introduced by this milestone.
- [ ] Seed a gitignored batch under `.data/content-studio/batches` only if an editor URL is required. Use batch `901` and item `001--water-cycle` with the Water Cycle draft clone. Open `/content-studio/editor/901/001--water-cycle`. Expect `needs_editing` and disabled Approve and Publish buttons with no `onClick` in the component source. Delete `.data` afterward.
- [ ] Confirm the browser console has no uncaught exception on those routes.
- [ ] Do not claim `/geography/[topic]` serves the published clone.

## Task 12: CURRENT_STATE paragraph

**Files:** `CURRENT_STATE.md`

- [ ] Add one paragraph under section 61. State that a cloned Water Cycle record can be reviewed, approved, and published in the verifier; `projectProductionDelivery` returns only a published eligible record; `/geography/[topic]` and `geography-data.ts` are unchanged; `registeredInContentReview` remains false; the Editorial CMS still does not call `approveProduction` or `publishProduction`.
- [ ] Do not mark the public Geography route as serving the production package.
- [ ] Run the full command list below.

## Failure matrix

| Failure | Test | Expected result |
|---|---|---|
| Missing snapshot | Task 4 `approve missing snapshot` | Input snapshot stays absent. Returned approval contains a gate snapshot. A blocked evaluation throws and the input stays `review`. |
| Snapshot version mismatch | Task 4 `approve mismatched version` and Task 2 `delivery mismatched version` | Throw `quality snapshot does not match content identity`, or delivery returns `undefined`. |
| Snapshot identity mismatch | Task 4 `approve mismatched id` | Same throw. Input unchanged. |
| Blocked quality | Task 4 `approve blocked evaluation` and Task 6 `bridge refuses blocked` | Throw. No `approved` or `review` write on the input. |
| Missing editorial review | Task 4 `approve academic only` | Throw `editorial and academic-source reviews must pass before approval`. |
| Missing academic-source review | Task 4 `approve one review` | Same throw. |
| Failed review | Task 4 `approve failed editorial` | Same throw. |
| Invalid transition | Task 4 `publish from review` | Throw `only approved content can be published`. |
| Stale editorial revision | Task 8 second save at revision 0 | Throw `Editorial workspace: stale edit`. |
| Stale content version | Task 8 bridge with versions 1 and 2 | Throw `stale content version`. |
| Publication error | Task 6 `publish does not mutate` | Input JSON unchanged. |
| Stored assignment | Task 6 `assign only after return` | `slot` stays `approved`. |
| Published N correction | Task 8 | Published JSON unchanged. Delivery still returns N. |
| Draft N+1 | Task 8 | Separate `draft` at version 2 with `supersedesVersion` 1. Delivery `undefined`. |
| Draft delivery | Task 2 `delivery draft` | `undefined`. |
| Approved unpublished delivery | Task 2 `delivery approved` | `undefined`. |
| Published delivery | Task 2 `delivery published` | The published clone is returned. |
| Invalid provenance | Task 6 dangling `ref/missing` | Throw `quality blockers prevent canonical submission`. |
| Unequal editorial copy | Task 6 | Throw `Editorial workspace: persistence failure`. |

## Verification commands

Run from `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas-editorial-cms` after Task 12:

```bash
npm run verify:content-production
npm run verify:content-review
npm run verify:content-quality
npm run verify:editorial-workspace
npm run verify:content-studio
npm run verify:batch-engine
npm run verify:batch-control
npm run verify:batch-recovery
npm run verify:search
npm run verify:assessment-scoring
npm run verify:learner-intelligence
npx tsc --noEmit --pretty false
npm run diff:check
npm run build
npm run lint
```

No new npm script is required. `verify:content-production` is the publication verifier.

`git diff --name-only -- src/lib/geography-data.ts src/app/geography src/lib/content/production/batches/geography-water-cycle.ts src/lib/content/review/registry.ts` must be empty.

`npm run lint` may exit 1 only for the three Global Constraints findings. Any other lint path fails the task.

## Spec coverage

| Spec section | Task |
|---|---|
| 1 Purpose and clone proof | Task 9 |
| 2 Layers A–E | Tasks 5, 7, and the read-only file map |
| 2.F Delivery projection and legacy route | Tasks 2, 3, 9, 11 |
| 3 Separate axes | Tasks 2 and 9 |
| 4 Handoff versus `getReviewRecords` | Tasks 6 and 7 |
| 5 Approval and snapshot identity | Tasks 4 and 5 |
| 6 Publication and N versus N+1 | Tasks 6 and 8 |
| 7 Version and CAS | Task 8 |
| 8 Water Cycle fixture | Task 9 |
| 9 Assessment, learner, search, AI | Task 10 |
| 10 Failure table | Failure matrix |
| 11 Module boundaries | File map |
| 12 Tests | Tasks 2, 4, 6, 8, 9, 10 |
| 13 Browser checks | Task 11 |
| 14 and 15 Non-goals | Global Constraints |

## Self-review

- `projectProductionDelivery` matches `isProductionDeliveryEligible` and does not read the legacy route.
- `submitReadyEditorialRecord` does not approve, publish, or flip `registeredInContentReview`.
- Missing snapshot follows the existing evaluate path and is not stamped `pass` by hand.
- Mismatched snapshot is a new throw on the existing functions, not a new workflow state.
- No `CanonicalReview`, `CanonicalReviewStore`, or delivery registry is introduced.
- The plan names every test case, file, symbol, and command. No open question is left in a task.

## Implementation handoff

Work on `feature/editorial-cms-workspace` in `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas-editorial-cms`. Start at Task 2. Do not edit the read-only files. Do not commit until the verification commands pass and the Geography diff is empty. Do not push.
