# Editorial CMS Workspace Implementation Plan

**Date:** 2026-09-23
**Status:** Plan only. Do not implement from this document in the same turn that created it.
**Authority:** `docs/superpowers/specs/2026-09-23-editorial-cms-workspace-design.md`
**Base that must already exist before PR 1:** Content Production Studio, Persistent Batch Engine, Production Inbox, and Batch Control Surface, including `tickBatchWorker`, `recoverFailedBatchItem`, `projectBatchInbox`, `recordEditorialHandoff`, and `createMemoryBatchJobStore`.

This plan does not add code. It tells a later agent exactly what to build, in what order, and what must fail before each implementation.

`generated` is **not** an `EditorialStatus`. The approved spec closed that question. Opening an inbox draft with no editorial file yields an in-memory view whose status is `needs_editing` and whose `revision` is `0`. That view is not written. Do not add `generated`, `quality_blocked`, `approved`, or `published` to the editorial enum.

## 1. Implementation Overview

Build a development-only editorial workspace that edits the existing batch-item `ProductionRecord`. It does not generate, approve, publish, or register canonical content.

```text
Studio generation
  → Persistent Batch Engine (BatchItemState)
  → Production Inbox (lanes, including ready_for_editorial_review)
  → Editorial CMS Workspace (EditorialStatus, stops at ready_for_approval)
  → future Approval (ProductionWorkflowState approved) — not this plan
  → future Publication (published) — not this plan
  → Canonical Content (/content-review registry) — not written by this plan
```

Six PRs. Each PR starts by extending `src/lib/content-studio/verify-editorial-workspace.ts` until the new assertions fail for the missing behavior, then adds the smallest domain code that makes those assertions pass, then refactors only names and structure. No PR expands behavior during refactor.

Work happens in a new git worktree. Do not edit the current dirty workspace. Do not commit unrelated files. Do not push.

## 2. Current Architecture Reused

Use these symbols. Do not reimplement them.

| Concern | Existing authority | Do not replace with |
|---|---|---|
| Package shape | `PilotPackage` in `src/lib/content/pilot/types.ts` | A second content schema |
| Block types | `PilotBlockType` (twelve values) | exam-note, classification, quick-revision, source-note, objective-as-block |
| Draft record | `ProductionRecord` in `src/lib/content/production/types.ts` | A parallel studio package type |
| Quality | `evaluateProductionQuality` | `validateContentQuality` called on a draft lifecycle, or a React copy of the gate |
| Review preview | `buildReviewProjection` from `src/lib/content/review/projection.ts` | Importing `src/lib/content/review/index.ts` or `registry.ts` from the editorial domain |
| Canonical list | `getReviewRecords` | Any insert of a studio draft. The verifier may import it only to snapshot ids |
| Item states | `BatchItemState` | An editorial write that changes `state` |
| Inbox lanes | `projectBatchInbox` / `lanesFor` | Treating `ready_for_editorial_review` as `ready_for_review` |
| Handoff | `recordEditorialHandoff` | A CMS call that sets `registeredInContentReview: true` |
| Identity | `batchIdFor`, `batchItemId`, `canonicalBatchNumber`, `resolveStudioIdentity` | Encoding slash-bearing storage ids into one route segment |
| Batch persistence | `BatchJobStore`, `createMemoryBatchJobStore`, `createFileBatchJobStore` | A new queue or database |
| Secret scrub of traces | `scrubStored` in `src/lib/content-studio/batch-engine/sanitize.ts` | Running `scrubStored` on `production` or on note `body` |
| Publication | `approveProduction`, `publishProduction` | Any import of those functions from `src/lib/content-studio/editorial/` |

`evaluateProductionQuality` is the only quality entry. It evaluates a private published candidate and returns the original draft content. Persist that returned record only after asserting lifecycle and `workflowState` are still `draft`. Never persist the candidate.

Direct `validateContentQuality` on a draft lifecycle is a false block. Do not call it from the editorial domain.

## 3. PR Dependency Graph

```text
PR 1 types + memory store + verifier script
  → PR 2 patch + shape errors + in-memory advance predicate
    → PR 3 commit + file store + updateBatchItemDraft
      → PR 4 open + notes + history + demotion
        → PR 5 route + panels + one inbox link
          → PR 6 registry snapshot + CURRENT_STATE + diff:check script
```

PR 2 cannot persist. PR 3 cannot call `openEditorialDraft`. PR 4 cannot add the route. PR 5 adds no domain function. PR 6 adds no behavior except the registry assertion and the documentation note.

## 4. PR 1 Plan

### Objective

Introduce the editorial envelope, the four-status transition table, and an in-memory store whose `save(record, expectedRevision)` is compare-and-swap inside an in-process queue.

### Exact files to create

- `src/lib/content-studio/editorial/types.ts`
- `src/lib/content-studio/editorial/status.ts`
- `src/lib/content-studio/editorial/store.ts`
- `src/lib/content-studio/editorial/index.ts`
- `src/lib/content-studio/verify-editorial-workspace.ts`

### Exact existing files to modify

- `package.json` — add only:

```json
"verify:editorial-workspace": "node --experimental-strip-types --import ./scripts/register-ts-alias.mjs src/lib/content-studio/verify-editorial-workspace.ts"
```

### Exact symbols to add

In `types.ts`:

- `EDITORIAL_SCHEMA_VERSION = "studio-editorial-draft/v1"`
- `EDITORIAL_LIMITS` as in the spec (`operators: 1`, `recordsPerBatchItem: 1`, `maxJsonBytes: 1_048_576`, `maxChanges: 200`, `maxNotes: 50`, `lock: "revision-compare-and-swap"`)
- `EditorialStatus` = `needs_editing | ready_for_review | changes_requested | ready_for_approval`
- `EditorialNote`, `EditorialChange`, `EditorialDraftRecord`, `EditorialDraftStore`

In `status.ts`:

- `EDITORIAL_TRANSITIONS` matching the spec table
- `assertEditorialTransition(from: EditorialStatus, to: EditorialStatus): void`
- Throws `Error` whose message is `Editorial workspace: invalid editorial transition`

Legal edges only:

- `needs_editing` → `ready_for_review`
- `ready_for_review` → `ready_for_approval`
- `ready_for_review` → `changes_requested`
- `ready_for_approval` → `changes_requested`
- `changes_requested` → `needs_editing`
- `ready_for_review` → `needs_editing`
- `ready_for_approval` → `needs_editing`

Same-status is not a transition. Content-save demotion is a later commit rule, not a second table.

In `store.ts`:

- `createMemoryEditorialDraftStore(): EditorialDraftStore`
- `load(batchId, itemId)` returns a clone or `null`
- `save(record, expectedRevision)` queues on that store instance
- Missing record is revision `0`. `expectedRevision` must be `0`, and `record.revision` must be `1`
- Existing record: re-read inside the queue; `expectedRevision` must equal stored `revision`; `record.revision` must equal `expectedRevision + 1`
- Mismatch throws `Editorial workspace: stale edit` and does not write
- Success replaces the one record for that `(batchId, itemId)`
- `list()` returns clones sorted by `batchId` then `itemId`
- Two overlapping `save` calls cannot both observe the same revision. Serialize them with a promise chain on the store. Do not use a database lock.

`index.ts` exports the symbols above. It does not export a file store. It does not export approve or publish.

### Dependencies

None, other than the already-landed batch engine. This PR does not import the batch engine.

### TDD — RED

Write `verify-editorial-workspace.ts` first. It imports `assertEditorialTransition` and `createMemoryEditorialDraftStore` from `./editorial/index`.

Expected failure: `ERR_MODULE_NOT_FOUND` for `src/lib/content-studio/editorial/index.ts`.

That failure proves the public module does not exist. The import path is the planned entry, not a typo. Do not stub the module before seeing this failure.

After the module exists but before `save` checks revisions, the next failure must be the assertion that a second save with `expectedRevision: 0` throws `stale edit` and leaves revision `1`. That proves compare-and-swap is not implemented yet.

Assertions in this PR:

- The four status strings exist and `generated` is not one of them.
- Every legal edge above succeeds.
- `needs_editing` → `ready_for_approval` throws `invalid editorial transition`.
- `needs_editing` → `changes_requested` throws.
- `changes_requested` → `ready_for_review` throws.
- First save with `expectedRevision: 0` stores revision `1`.
- Second save with `expectedRevision: 0` throws `stale edit` and `load` still returns revision `1` and the first body.
- Two saves started together: the first wins at revision `1`; the second, still passing `expectedRevision: 0`, throws `stale edit`. The stored revision is `1`, not `2`, unless the second call used `expectedRevision: 1`.
- A call that passes `expectedRevision: 1` after the first save stores revision `2`.

Use a minimal hand-built `EditorialDraftRecord`. Do not build a `ProductionRecord` yet. Do not call the quality gate.

### GREEN

Add only the types, the transition function, and the memory store described above. No patch applier, no file IO, no batch write.

### Refactor

After green, rename only if a name collides. Do not add notes, history, or UI.

### Verification

- `npm run verify:editorial-workspace`
- `npx tsc --noEmit`
- `npx eslint` on the five new files and `package.json` is not linted as TS; lint the four `editorial/*.ts` files and the verifier
- `git diff --check`

`npm run diff:check` does not exist yet. Do not add it in this PR. Run `git diff --check` directly. PR 6 adds the npm alias.

Do not run `npm run build` in this PR. There is no route.

### Forbidden side effects

No React. No `node:fs`. No batch-engine edit. No quality-gate edit. No workflow edit. No Geography edit. No registry edit. No provider import.

### Completion criteria

The verifier passes. `save` is compare-and-swap. Illegal editorial edges throw. `git status` shows only the files listed above.

## 5. PR 2 Plan

### Objective

Apply a typed content patch to a copy of a baseline `ProductionRecord`, reject illegal shapes, and decide in memory whether Mark Ready for Review or Mark Ready for Approval would pass. Do not write either store.

### Exact files to create

- `src/lib/content-studio/editorial/edit.ts`
- `src/lib/content-studio/editorial/validate.ts`

### Exact existing files to modify

- `src/lib/content-studio/editorial/index.ts` — export the new functions
- `src/lib/content-studio/verify-editorial-workspace.ts` — cases 1–9, 13, and the non-writing halves of 20, 23, 24, and 25

### Exact symbols to add

- `EditorialPatch` — one optional field per editable path in spec section 8. Unknown keys are a type-level and runtime rejection.
- `applyEditorialPatch(baseline: ProductionRecord, patch: EditorialPatch): ProductionRecord`
- `assertEditablePackage(record: ProductionRecord): void` — shape and relationship errors from spec section 16. Does not call the gate.
- `previewEditorialAdvance(record: ProductionRecord, evaluatedAt: string): ProductionRecord` — runs the 13-step predicate in spec section 6 and returns the evaluated record. Throws `editorial_quality_blocked` or `invalid editorial transition`. Does not save.

Error helper, used by every later module:

```text
function fail(message: string): never {
  throw new Error(`Editorial workspace: ${message}`);
}
```

Editable fields, and only these, on existing ids:

- Topic: `title`, `summary`, `audience`, `level` (`foundational | intermediate`), `provenanceStatus` (`verified | corroborated | synthesized | disputed`), optional `categoryId`
- Concepts: `title`, `aliases`. Naming `concept.knowledgeUnitIds` throws `malformed draft`
- When `knowledgeUnits/${id}/conceptIds` changes, update the inverse `knowledgeUnitIds` on concepts that already exist. Do not mint a concept. Do not reorder other ids
- Objectives: `verb` (`explain | distinguish | apply | analyze`), `statement`, `level`
- Knowledge units: `title`, `summary`, `audience`, `level`, `scope`, `validity`, `extension`, and id arrays that may point only at existing ids
- Blocks: `type` in `PilotBlockType`, `order`, non-empty `payload`, `interpretationStatus`, `claimIds`, `sourceReferenceIds`
- Claims: `statement`, `kind`, `interpretationStatus`, `supportStatus`, `sourceReferenceIds`, `scope`, `validity`, `conflictGroupId`
- Sources: `type`, `title`, `publisherOrOrganization`, `reference`, `language`, `publicationDate`, `accessedDate`, `scope`
- Source references: `sourceId` among existing sources, `supportType`, `citation`, `locator`, `quote`

Immutable: every id, `disciplineId`, `subjectId`, `topic.id`, topic membership arrays, `contentVersion`, `lifecycle`, `workflowState`, `reviews`, `publishedAt`, `supersedesVersion`, and the whole assessment-alignment collection. A title edit must not call `slugFromTitle`.

Provenance suffixes, and no others:

- Unknown `sourceId`, or a source patch id not on the package → `missing source`
- Absent `sourceId` field is an unknown `sourceId` → `missing source`
- Unknown reference id, blank `citation`, or `supportType` outside `direct | synthesized | contextual` → `invalid source reference`
- Empty claim `sourceReferenceIds`, unknown reference id on a claim, or `disputed` without `conflictGroupId` → `broken claim relationship`

`source-backed` is not coerced. `assertEditablePackage` throws `malformed draft` and the message does not contain `immutable field`.

Advance predicate steps 1–13 from the spec. The must-not-be-blocked set is every result, not the first match, for: `identity-structure`, `knowledge-unit`, `content-block`, `objective`, `claim`, `provenance`, `classification`, `time-scope`, `version-lifecycle`, `assessment-alignment`, `universal-core`. Leave out `publication-readiness`, `search-eligibility`, `ai-grounding`, and `learner-compatibility`. Step 9 still rejects `overall === "blocked"`.

Import `evaluateProductionQuality` from `src/lib/content/production/workflow.ts`, not from `src/lib/content/production/index.ts` (that barrel re-exports Geography packages). Import `buildReviewProjection` from `src/lib/content/review/projection.ts`, not from `src/lib/content/review/index.ts`. Do not edit `projection.ts`. Loading it pulls the production barrel today. That is accepted. Do not "fix" it here.

### Dependencies

PR 1.

### TDD — RED

Extend the verifier before editing `edit.ts` or `validate.ts`.

Expected failure after PR 1 is green: `applyEditorialPatch is not a function` or `ERR_MODULE_NOT_FOUND` if the test imports `./editorial/edit` directly. Prefer importing from `./editorial/index`. The failure must be a missing export, then, once a function exists that returns the baseline unchanged, the assertion that a topic title patch changes `topic.title` and leaves `topic.id` unchanged.

Cases in this PR, all in memory, no `EditorialDraftStore.save` and no `BatchJobStore.save`:

1. Unknown patch key, and `workflowState: "review"`, each throw `malformed draft`. No store write because there is no store call.
2. `knowledgeUnits: []` throws `missing knowledge unit`.
3. A unit with `blocks: []` throws `missing required block`.
4. `type: "exam-note"` and `type: "classification"` each throw `invalid block type`.
5. Unknown `sourceId` throws `missing source` and does not throw `invalid source reference`.
6. Blank `citation` throws `invalid source reference` and does not throw `missing source`.
7. Empty `sourceReferenceIds`, and a `disputed` claim without `conflictGroupId`, throw `broken claim relationship`.
8. A package whose `evaluateProductionQuality` overall is `blocked` makes `previewEditorialAdvance` throw `editorial_quality_blocked`. The report `overall` is still `blocked`. No override field exists on the record.
9. `overall: "pass"` allows the predicate to return. A fixture that is not passed through the predicate is still described as `needs_editing` by the caller, not by a hidden status write. `overall: "warning"` passes the predicate only when every must-not-be-blocked dimension result is unblocked. Construct the warning case from the real gate if a pilot-shaped package warns; do not hand-build a fake `QualityStatus`.
13. `previewEditorialAdvance` is not Mark Ready for Approval from `needs_editing`. Add `assertEditorialTransition("needs_editing", "ready_for_approval")` and expect `invalid editorial transition`. Also assert the module source of `editorial/` does not contain `approveProduction` or `publishProduction`.
20. Non-writing half: `assertEditablePackage` throws `malformed draft` for `provenanceStatus: "source-backed"`, and the message does not contain `immutable field`.
23. Non-writing half: adding `payload.body` when the baseline payload has no `body` throws `malformed draft`.
24. Non-writing half: a patch object that includes `knowledgeUnitIds` on a concept throws `malformed draft`.
25. Non-writing half: `actorLabel` longer than 80 characters is rejected by a small `assertActorLabel` exported from `validate.ts`. A package whose unit `contentVersion` differs from the topic throws `malformed draft` on `assertEditablePackage`.

Build fixtures with `createProductionDraft` on an in-memory package copied from `pilotPackages[2]` and remapped to a studio identity, then `evaluateProductionQuality` with a fixed `evaluatedAt`. Do not write Geography files. Do not call a provider.

### GREEN

Implement `applyEditorialPatch` and `assertEditablePackage` and `previewEditorialAdvance` only. Inverse concept membership is applied inside `applyEditorialPatch` when `conceptIds` change. Duplicate block `order` is not an `assertEditablePackage` throw. The gate, when later saved, will block it. This PR does not save, so case 21 waits for PR 3.

### Refactor

Extract path constants only if the same string appears in both edit and the later history module. Do not add history yet.

### Verification

- `npm run verify:editorial-workspace`
- `npm run verify:content-quality` — must still pass. This PR must not edit the gate. The command proves it.
- `npx tsc --noEmit`
- `npx eslint` on `editorial/` and the verifier
- `git diff --check`

### Forbidden side effects

No file store. No `updateBatchItemDraft`. No status write. No `Date.now`. The predicate takes `evaluatedAt` as an argument.

### Completion criteria

Cases listed above pass. A blocked report cannot be turned into a passing predicate result by any exported function. `git diff` does not touch `src/lib/content-quality/` or `src/lib/content/production/workflow.ts`.

## 6. PR 3 Plan

### Objective

Commit a legal package into `EditorialDraftStore` and copy that same `ProductionRecord` onto `item.result.draft` without changing batch item state, executions, source text, or handoffs.

### Exact files to create

- `src/lib/content-studio/editorial/commit.ts`
- `src/lib/content-studio/editorial/file-store.ts`
- `src/lib/content-studio/editorial/write-through.ts`

### Exact existing files to modify

- `src/lib/content-studio/editorial/index.ts`
- `src/lib/content-studio/batch-engine/definition.ts` — add `updateBatchItemDraft` only
- `src/lib/content-studio/batch-engine/index.ts` — export it
- `src/lib/content-studio/batch-engine/store.ts` — draft exemption inside `clone`
- `src/lib/content-studio/batch-engine/file-store.ts` — the same exemption on save
- `src/lib/content-studio/verify-editorial-workspace.ts`

Do not change `scrubStored` or `FORBIDDEN_KEYS`. Exempt the draft around the call.

### Exact symbols to add

```typescript
export function updateBatchItemDraft(
  store: BatchJobStore,
  input: {
    batchId: string;
    itemId: string;
    draft: ProductionRecord;
    qualityOverall: "pass" | "warning" | "blocked" | undefined;
    expectedState: BatchItemState;
    expectedCompletedAt: string;
    expectedHandoffs: readonly BatchEditorialHandoff[];
  },
): BatchJobRecord
```

Behavior:

- `load` the job inside the function. Ignore any job object the caller already holds.
- Item must exist. `state` must be `succeeded` or `quality_blocked`. Otherwise throw `Editorial workspace: persistence failure`.
- `result.draft` must exist. `result.completedAt` must equal `expectedCompletedAt` by string equality. `state` must equal `expectedState`. `handoffs` must be deeply equal to `expectedHandoffs`. Any miss throws `persistence failure` for state, missing item, or missing draft, and `stale content version` when `completedAt` differs.
- Replace only `items[i].result.draft` and `items[i].result.qualityOverall` on the freshly loaded job.
- Do not change `state`, `executions`, `sourceText`, `sourceFingerprint`, `handoffs`, or `registeredInContentReview`.
- Then `store.save`.

`createMemoryBatchJobStore` and `createFileBatchJobStore` must scrub the job except `items[].result.draft`. Implementation: copy each draft off, delete those fields, run `scrubStored`, then put the original draft objects back. `load` and `list` use the same `clone`. Provider-trace keys `apiKey`, `authorization`, and `rawText` stay scrubbed. Existing `verify-batch-engine` secret assertions must still pass.

`createFileEditorialDraftStore(directory)`:

- Does not call `scrubStored`.
- Path: `{directory}/{batchNumber}/{ordinal}--{topicSlug}.json`
- Directory for the app later: `.data/content-studio/editorial`. Tests use `mkdtempSync`.
- `save(record, expectedRevision)` queues in process, re-reads, rejects a stale revision with `stale edit`, rejects a JSON payload larger than `EDITORIAL_LIMITS.maxJsonBytes` with `persistence failure`, then writes with the same best-effort temp + `rmSync` + `renameSync` as `replaceFile`. Document in a one-line comment that this is not crash-atomic on Windows. Do not call it atomic.
- Unknown `schemaVersion` on load throws `persistence failure`. Do not guess fields.

`commitEditorialSave`, `commitMarkReadyForReview`, and `commitMarkReadyForApproval` in `commit.ts`:

1. Checks in memory, including `assertEditablePackage` on the post-patch package.
2. Build the next envelope. `revision === expectedRevision + 1`.
3. Content patch from `ready_for_review`, `ready_for_approval`, or `changes_requested` sets status to `needs_editing`. This demotion is implemented here even though the history rows land in PR 4. Until PR 4, record the status on the envelope and append no history rows. PR 4 fills `changes`. Do not leave demotion for PR 4 if the status would otherwise stay `ready_for_review` after a content save. The spec's PR 4 owns the history assertion of demotion. PR 3 must still persist the demoted status, or PR 3's save would violate section 6. Implement the status demotion in PR 3. PR 4 adds the history row and the note-only path.
4. `editorialStore.save(next, expectedRevision)`.
5. `updateBatchItemDraft`.
6. Return the envelope only if step 5 returns.

If step 4 throws `stale edit`, do not call step 5 and do not relabel it. Any other store throw is `persistence failure`. If step 5 throws, throw `persistence failure` and do not return a success view. The editorial record from step 4 stays.

`replayEditorialWriteThrough(editorialStore, batchStore, batchId, itemId)`:

- Not called by `load`.
- Copies `production` onto `result.draft` only when state is `succeeded` or `quality_blocked`, `result.completedAt === sourceCompletedAt`, `result.draft` exists, and both topic `contentVersion` values equal the envelope `contentVersion`.
- Does not change `handoffs` or `BatchItemState`.
- Guard failure: `persistence failure` for state or missing draft; `stale content version` for `completedAt` or topic version mismatch.
- Does not delete the editorial file.

Save Draft of a blocked but well-formed package succeeds and stores `needs_editing`. It does not throw `editorial_quality_blocked`. Duplicate `order` is that case: Save stores the blocked snapshot; the advance throws `editorial_quality_blocked` and does not write.

A Save that leaves `provenanceStatus` as `source-backed` throws `malformed draft` before any write. A Save that sets it to `synthesized` in the same patch commits. Do not coerce.

Empty content patch and empty note delta: if the baseline is legal, return the current envelope and do not increment `revision`. If the baseline still has `source-backed` or mismatched internal `contentVersion`, throw `malformed draft` instead of the no-op.

### Dependencies

PR 2.

### TDD — RED

Add the case assertions before `commit.ts` exists.

Expected failure: `commitEditorialSave is not a function` from the index. Then, once a commit function writes the editorial store but skips `updateBatchItemDraft`, case 15 fails because `result.draft` is not deep-equal after `createMemoryBatchJobStore.load`.

Cases:

10. Change the batch draft `contentVersion` or `result.completedAt` after the baseline was read. Commit throws `stale content version`. Editorial revision is unchanged.
11. Overlapping saves. First commit wins. Second with the old `expectedRevision` throws `stale edit`. Stored revision is the first commit's revision. Body is the first body.
12. A store whose `save` throws, and a batch store whose `save` throws on write-through, both surface `persistence failure`. The function does not return a view. If write-through throws after editorial save, `load` still returns the new editorial record.
15. Content save keeps `contentVersion`, unit versions, alignment versions, `workflowState: "draft"`, lifecycle `draft`, and `BatchItemState`. After memory-store `load`, `result.draft` deep-equals `production`, including a baseline `payload.body`.
20. Writing half: replace `source-backed` with `synthesized` and the commit succeeds.
21. Save of duplicate block `order` commits `needs_editing` with `overall: "blocked"`. Mark Ready throws `editorial_quality_blocked`. Orders are not renumbered.
22. Non-open half only. After editorial save, a batch save that throws leaves the editorial record. `load` on the editorial store does not call `replayEditorialWriteThrough`. Calling `replayEditorialWriteThrough` copies `production` when guards match and does not change `handoffs`. When `completedAt` differs, it throws and leaves the editorial record. Do not import or call `openEditorialDraft`.
23. Writing half: a newly added `payload.body` throws and does not write. A whole-payload replace that changes an existing `body` string commits and keeps the key. A title-only save on a package that already has `payload.body` commits. After `createMemoryBatchJobStore.load`, the key is in `result.draft`. The file editorial adapter round-trips the same key. A payload key `text` round-trips. Assert the editorial file JSON was not passed through `scrubStored` by checking `body` survived. Also assert a provider trace on the batch job that contains `apiKey` is still removed, so the exemption is not "scrub nothing".
24. Writing half: a unit `conceptIds` change updates inverse membership on existing concepts and does not mint a concept id.

Also re-run `npm run verify:batch-engine` and `npm run verify:batch-recovery` as the RED-to-GREEN safety net for the scrub change. If those fail, the exemption is too wide.

### GREEN

The functions above. No `open.ts`. No notes. No route.

### Refactor

Share one `patchDraftOnFreshJob` helper inside `definition.ts` if `updateBatchItemDraft` and `replay` would duplicate the reload-and-compare block. `replay` stays in `write-through.ts` and calls `updateBatchItemDraft`.

### Verification

- `npm run verify:editorial-workspace`
- `npm run verify:batch-engine`
- `npm run verify:batch-recovery`
- `npm run verify:batch-control`
- `npx tsc --noEmit`
- `npx eslint` on the touched files
- `git diff --check`

### Forbidden side effects

Do not change `tickBatchWorker`, `recoverFailedBatchItem`, `isAutomaticallyEligible`, or `recordEditorialHandoff`. Do not flip `BatchItemState`. Do not set `registeredInContentReview`. Do not delete an editorial file on write-through failure.

### Completion criteria

A saved editorial `production` survives `createMemoryBatchJobStore.load` inside `result.draft`. A stale revision does not write. A failed write-through does not delete the editorial record. Batch-engine secret tests still pass.

## 7. PR 4 Plan

### Objective

Open is pure. Notes and history record editorial operations without becoming `contentVersion`. Content save demotion is visible in history. The 200-row cap refuses the commit.

### Exact files to create

- `src/lib/content-studio/editorial/open.ts`
- `src/lib/content-studio/editorial/notes.ts`
- `src/lib/content-studio/editorial/history.ts`

### Exact existing files to modify

- `src/lib/content-studio/editorial/commit.ts`
- `src/lib/content-studio/editorial/index.ts`
- `src/lib/content-studio/verify-editorial-workspace.ts`

### Exact symbols to add

- `openEditorialDraft(batchStore, editorialStore, batchId, itemId): EditorialWorkspaceView`
  - If the item has no `result.draft`, or state is not `succeeded` or `quality_blocked`, throw `persistence failure`.
  - If no editorial file, return `revision: 0`, `persisted: false`, `editorialStatus: "needs_editing"`, `expectedRevision: 0`. Do not call `save` on either store.
  - If both exist and `production` is not deep-equal to `result.draft`, throw `persistence failure`. Do not merge. Do not delete.
  - `source-backed` still returns. Internal `contentVersion` mismatch still returns. Neither writes.
- `noteIdFor(batchId, itemId, revision, index)` → `note/${batchId}/${itemId}/${revision}/${index}`
- `appendHistory(...)` used only by `commit.ts`. One row per changed content path whose `JSON.stringify` differs, lexicographic path order, then one row per new note, then one row when `editorialStatus` changes. `previousValue` and `newValue` are `JSON.stringify` of the field. Status path is `editorialStatus`. Note path is `notes/${noteId}`, previous `JSON.stringify(null)`.
- `redactSecrets` from `src/lib/content-studio/batch-engine/sanitize.ts` runs on note bodies and on `previousValue`, `newValue`, and `reason` only.

Note-only save writes, increments revision, and does not change `editorialStatus`.

Request Changes from `ready_for_review` or `ready_for_approval` moves to `changes_requested`. Return to Editing from those two and from `changes_requested` moves to `needs_editing`. Neither requires a note. Optional `reason` is stored on the status row.

Cap: if `changes.length` would exceed 200, or notes would exceed 50, throw `persistence failure` before any write. Do not drop rows.

`actorLabel` longer than 80 characters throws `malformed draft` before write. The message does not contain `immutable field`.

### Dependencies

PR 3. Case 22's open assertion is new in this PR. Do not move it back into PR 3.

### TDD — RED

Expected failure: `openEditorialDraft is not a function`. Then case 14 fails if open writes a file or changes batch bytes.

Cases:

14. Open on a succeeded draft with no editorial file does not change batch-store bytes and does not create an editorial record. Open of `source-backed` writes nothing.
17. Notes change, content does not. Revision increments. Status unchanged. One history row path `notes/${noteId}`. `noteId` is `note/${batchId}/${itemId}/${revision}/0`. Request Changes with no note moves `ready_for_review` to `changes_requested`.
18. Content patch from `ready_for_review` commits `needs_editing`, one row per changed content path, and one `editorialStatus` row. Values are `JSON.stringify` of the previous and next field. Return to Editing does not require a note.
19. A commit that would exceed 200 changes throws `persistence failure`. The previous `changes` array is unchanged.
22. Open half: unequal editorial `production` and `result.draft` throws `persistence failure` and the editorial file is still `load`able.
25. Open half: internal version mismatch still returns and does not write.

### GREEN

The three modules and the commit.ts history/demotion/note branches. No route.

### Refactor

If `commit.ts` grew past a single screen of branching, split private helpers in the same file. Do not add a second commit entry point.

### Verification

- `npm run verify:editorial-workspace`
- `npm run verify:batch-engine`
- `npx tsc --noEmit`
- `npx eslint` on the touched files
- `git diff --check`

### Forbidden side effects

No `contentVersion` increment. Notes are not fields of `PilotPackage`. History is not a canonical version. No approve or publish function.

### Completion criteria

Open of a missing editorial file is byte-stable. A content save from `ready_for_review` both demotes and records the status row. The 201st change does not write.

## 8. PR 5 Plan

### Objective

Development-only route and focused panels. One inbox link per openable item. The UI calls server actions. It does not contain gate rules, publication, or provider calls.

### Exact files to create

- `src/lib/content-studio/editorial/actions.ts` — first line `"use server"`
- `src/app/content-studio/editor/[batchId]/[itemId]/page.tsx`
- `src/components/content-studio/EditorialWorkspace.tsx` — shell and workflow buttons only
- `src/components/content-studio/EditorialHeader.tsx` — subject, topic, content version, lifecycle, generation state, quality overall, editorial status, `updatedAt`
- `src/components/content-studio/EditorialContentEditor.tsx` — topic fields, concepts, objectives, knowledge units, blocks
- `src/components/content-studio/EditorialProvenancePanel.tsx`
- `src/components/content-studio/EditorialQualityPanel.tsx` — read-only
- `src/components/content-studio/EditorialNotesPanel.tsx`
- `src/components/content-studio/EditorialHistoryPanel.tsx` — read-only list

The spec names four panel files plus the workspace. This plan splits the header, the content editor, and history out of `EditorialWorkspace.tsx` so the workspace does not become the editor. Those three extra files are the same PR, not a new phase. They do not add domain functions.

### Exact existing files to modify

- `src/lib/content-studio/batch-control/types.ts` — `hasDraft: boolean` on `BatchControlItemView`
- `src/lib/content-studio/batch-control/surface.ts` — `hasDraft` is `item.result?.draft !== undefined`
- `src/components/content-studio/StudioBatchControl.tsx` — one link on the item row when `hasDraft` is true and `state` is `succeeded` or `quality_blocked`

Do not modify `editorial/index.ts` unless a domain function is added. This PR must not add one.

### Exact symbols to add

Server actions, each throwing `Editorial workspace is disabled in production.` when `NODE_ENV === "production"`:

- `openEditorialAction(batchNumber: string, itemParam: string)`
- `saveEditorialDraftAction`
- `validateEditorialDraftAction` — returns the report, does not persist
- `markReadyForReviewAction`
- `requestChangesAction`
- `returnToEditingAction`
- `markReadyForApprovalAction`
- `replayEditorialWriteThroughAction`

No `approveEditorialDraftAction`. No `publishEditorialDraftAction`.

Route params:

- `batchId` matches `/^[0-9]{3,4}$/`. Resolve with `batchIdFor`.
- `itemId` matches `/^[0-9]{3}--[a-z0-9]+(?:-[a-z0-9]+)*$/`. Split on the first `--`. Resolve with `batchItemId`.
- Anything else calls `notFound()`.
- Example: `/content-studio/editor/001/001--plate-tectonics` → `studio-batch/001` and `studio-batch/001/item/001/plate-tectonics`.
- Production `notFound()`, same as `src/app/content-studio/page.tsx`. Do not set `maxDuration`.

`actions.ts` is the only module that constructs `createFileEditorialDraftStore` and the file batch store for this workspace. Pass `join(process.cwd(), ".data", "content-studio", "editorial")` as a static path, not a variable, so the Next build does not trace the whole repo. The page and client components call actions only.

Component data flow:

```text
page (server, notFound in production)
  → openEditorialAction
  → EditorialWorkspace view
      → EditorialHeader (read-only view fields)
      → EditorialContentEditor (local patch state, Save calls saveEditorialDraftAction)
      → EditorialProvenancePanel (same patch, claim → reference → source)
      → EditorialQualityPanel (snapshot from the view; Validate calls validateEditorialDraftAction)
      → EditorialNotesPanel (note text, Save)
      → EditorialHistoryPanel (changes array)
      → buttons call the matching action
```

Approve and Publish are `<button disabled aria-disabled="true">` with text `Not available. Approval and publication are not part of this workspace.` No `onClick`. No `formAction`.

The quality panel displays `overall`, every dimension result including both `identity-structure` rows, issue code, severity, path, message, `evaluatedAt`, and `evaluatorVersion`. It does not compute a new status.

The inbox link is one `<Link>` per item row, not per lane row. Handoff, recover, pause, resume, and source replacement stay as they are.

Banner copy on the workspace: `DRAFT — NOT CANONICAL`. Also state that a quality pass is not human approval and that `ready_for_approval` is not publication.

### Dependencies

PR 4.

### TDD — RED

This PR is UI. The domain verifier already covers behavior. Add a source assertion to `verify-editorial-workspace.ts` or `verify-batch-control.ts` before editing the components:

- `StudioBatchControl.tsx` contains `hasDraft`.
- It does not contain a second editor form.
- `editorial/actions.ts` contains `"use server"`.
- `editorial/actions.ts` does not contain `approveProduction`, `publishProduction`, `generateStudioBatchAction`, or `createServerRoutedProvider`.
- The page contains `notFound`.
- The workspace source contains `aria-disabled` and the not-available sentence.
- The workspace source does not contain `onClick` on the approve or publish control. Implement that by giving those buttons no handler and asserting the file does not contain `approveEditorial` or `publishEditorial`.

Expected failure: `ENOENT` on `editorial/actions.ts` or the assertion `hasDraft` is absent. That proves the link and the action module are not there yet.

Do not add a browser test runner. After GREEN, if a dev server is already the project's verification habit, load `/content-studio/editor/001/001--plate-tectonics` only when the page is wired and `NODE_ENV` is not production. A missing batch calls `notFound` or the action's persistence error. Do not call Gemini to create a draft for this check. A memory-free file store can be empty.

Update `verify-batch-control.ts` only if its existing source assertions reject the new link. Do not weaken its rule that the control surface does not call `generateStudioBatchAction`.

### GREEN

The files above. Panels receive the view and a patch callback. They do not import `evaluateProductionQuality`.

### Refactor

Move a repeated field `<label>` into the content editor only. Do not merge panels back into one file.

### Verification

- `npm run verify:editorial-workspace`
- `npm run verify:batch-control`
- `npm run verify:content-studio`
- `npx tsc --noEmit`
- `npx eslint` on the new components, the page, `actions.ts`, and the batch-control files
- `npx next build`
- `git diff --check`

`npm run lint` may still fail on the pre-existing `StudioForm.tsx` effect and the unused-variable warnings in `source-packet.ts` and `src/lib/geography-data.ts`. Do not edit those files to silence lint. Record the pre-existing failure if it is still the only lint error.

### Forbidden side effects

No Navbar. No sitemap. No domain rule inside a component. No provider. No `localStorage`. No `fs` import in a client component. No handoff behavior change.

### Completion criteria

The route exists and is `notFound` in production. A succeeded or quality-blocked item with a draft has one editor link. Approve and Publish cannot submit. `npx next build` passes.

## 9. PR 6 Plan

### Objective

Lock the axis split against the canonical registry and write the current-state note. Add the missing npm alias for whitespace check.

### Exact files to create

None.

### Exact existing files to modify

- `src/lib/content-studio/verify-editorial-workspace.ts` — case 16 and a closing assertion that cases 1–25 are implemented as real assertions, not headings
- `CURRENT_STATE.md` — one short paragraph: the workspace exists, it does not approve, publish, or register canonical review
- `package.json` — add `"diff:check": "git diff --check"` only if PR 1 did not add it. Do not add a second `verify:editorial-workspace` line.

### Exact symbols to add

None. Case 16 calls existing `getReviewRecords` and `recordEditorialHandoff` only to prove they were not changed:

- Topic ids at the end equal the snapshot taken at process start.
- A handoff written by the existing inbox function still has `registeredInContentReview: false`.
- The string `ready_for_editorial_review` is never assigned to `editorialStatus`.
- A `quality_blocked` item stays `quality_blocked` after an edit that clears blockers and reaches `ready_for_review`.
- `recordEditorialHandoff` still throws for that item.

The closing check is a list of case names in the verifier source, each followed by at least one `assert.` in that case's block. A heading with no assertion fails this check.

### Dependencies

PR 5. Case 16 can be written earlier, but it stays in this PR so the UI work cannot accidentally register a draft and still claim the plan is unfinished.

### TDD — RED

Add case 16 before editing `CURRENT_STATE.md`.

If the workspace never touches the registry, case 16 passes as soon as it is written. That is acceptable. The RED that must still be seen in this PR is the closing coverage assertion: before every case 1–25 has an assertion, the new coverage check fails. If PR 5 already left all 25 in place, write the coverage check first against a temporary expected name `case-26-not-present` is wrong. Instead, delete nothing. The coverage check is added first while one required case name is absent from a local constant that lists required names, and the verifier's source is scanned. Expected failure: `missing editorial case 16` until the case block exists.

Do not fail the build by importing Geography packages into the verifier except through `getReviewRecords`, which already loads them. Do not edit those packages.

### GREEN

Case 16 and the `CURRENT_STATE.md` paragraph. No new behavior.

### Refactor

None. This PR is the lock.

### Verification

The full set:

- `npm run verify:editorial-workspace`
- `npm run verify:content-studio`
- `npm run verify:batch-engine`
- `npm run verify:batch-control`
- `npm run verify:batch-recovery`
- `npm run verify:content-review`
- `npm run verify:content-quality`
- `npm run verify:content-production`
- `npx tsc --noEmit`
- `npm run lint` — pre-existing failures outside this work are not a license to edit `StudioForm.tsx`, `source-packet.ts`, or `geography-data.ts`
- `npm run diff:check` after the script exists; until the script is added, `git diff --check`
- `npm run build`

### Forbidden side effects

No second edit to Geography. No registry package-list edit. No approve or publish.

### Completion criteria

Case 16 passes. `CURRENT_STATE.md` says the workspace does not approve, publish, or register canonical review. The full command list above has been run and the results recorded. Any lint failure is quoted and shown to be on a file this plan forbids.

## 10. Domain Ownership Matrix

| Axis | Values | Owner | Who may write it in this plan |
|---|---|---|---|
| Quality | `pass`, `warning`, `blocked` | `evaluateProductionQuality` | Save and advance persist the snapshot the function returns. Nothing else writes `overall`. |
| Editorial | `needs_editing`, `ready_for_review`, `changes_requested`, `ready_for_approval` | `commit.ts` and `status.ts` | Only those functions. UI sends an action name. |
| Batch item | `pending`, `running`, `succeeded`, `quality_blocked`, `source_insufficient`, `rate_limited`, `failed` | Batch engine | CMS does not write `state`. Recovery of `failed` stays `recoverFailedBatchItem` on the inbox. |
| Inbox lane | `generated`, `ready_for_editorial_review`, `quality_blocked`, `source_insufficient`, `rate_limited`, `failed` | `projectBatchInbox` | Read-only in the workspace header. |
| Canonical workflow | `draft`, `review`, `approved`, `published`, `deprecated`, `archived` | `src/lib/content/production/workflow.ts` | Not called. Studio drafts stay `workflowState: "draft"`. |
| Canonical registry | `getReviewRecords` | `registry.ts` | Not modified. |
| Handoff | `registeredInContentReview: false` | `recordEditorialHandoff` | Not called by the CMS. |

## 11. State Transition Matrix

Stored editorial edges:

| From | Action | To | Writes | Quality rule |
|---|---|---|---|---|
| no file | Open | in-memory `needs_editing` | No | None |
| `needs_editing` | Save content | `needs_editing` | Yes, if shape is legal | Blocked report is stored |
| any | Save notes only | unchanged | Yes | Shape must already be legal |
| any | Validate | unchanged | No | Returns the report even when blocked |
| `needs_editing` | Mark Ready for Review | `ready_for_review` | Yes | `overall === "blocked"` throws `editorial_quality_blocked` |
| `ready_for_review` | Mark Ready for Approval | `ready_for_approval` | Yes | Same predicate |
| `ready_for_review` or `ready_for_approval` | Request Changes | `changes_requested` | Yes | Note not required |
| `changes_requested`, `ready_for_review`, or `ready_for_approval` | Return to Editing | `needs_editing` | Yes | Note not required |
| `ready_for_review`, `ready_for_approval`, or `changes_requested` | Save content | `needs_editing` | Yes | Demotes even when the new report passes |
| any | Approve or Publish | none | No | `invalid editorial transition` |

There is no stored transition `generated → needs_editing`. Open synthesizes `needs_editing` without a write.

`ready_for_approval → approved → published` is not implemented. Those names are not `EditorialStatus` values.

## 12. Persistence Model

```text
React panels
  → server actions in editorial/actions.ts
    → commit / open / replay  (no fs import)
      → EditorialDraftStore interface
          → createMemoryEditorialDraftStore   (verifier)
          → createFileEditorialDraftStore     (actions only)
      → updateBatchItemDraft
          → BatchJobStore
```

- Domain modules do not import `node:fs`, `localStorage`, or `STUDIO_STORAGE_KEY`.
- One editorial record per `(batchId, itemId)`.
- First commit writes revision `1` when `expectedRevision` is `0`.
- File path: `.data/content-studio/editorial/{batchNumber}/{ordinal}--{topicSlug}.json`.
- `schemaVersion` must be `studio-editorial-draft/v1` or load throws.
- Notes and `changes` are on the envelope, never inside `PilotPackage`.
- `contentVersion` is the package integer. `revision` is the CAS counter. A history row's `revision` is the commit that appended it. Ordinary edits do not change `contentVersion`.
- The original generation remains recoverable only as the previous `result.draft` until the first successful write-through replaces that pointer. This plan does not keep a second copy of the generation. `replayEditorialWriteThrough` restores the editorial `production`, not an older generation. Say that in the PR 3 verifier comment so an implementer does not invent a shadow draft.
- Inbox projection changes only because `result.draft` and `result.qualityOverall` change. `lanesFor` still reads `BatchItemState` first. A generation-time `quality_blocked` item that later has a passing snapshot stays in the `quality_blocked` lane. The header shows both strings.

## 13. Concurrency Model

- `save(record, expectedRevision)` re-reads inside an in-process queue.
- Mismatch throws `stale edit` and does not write.
- The record's `revision` must be `expectedRevision + 1`.
- Two tabs: the first commit wins. The second must reload. No silent merge.
- Two OS processes are unsupported. There is no file lock.
- `updateBatchItemDraft` reloads the job immediately before `BatchJobStore.save`.
- Compare `state` and `completedAt` by string. Compare `handoffs` by deep equality. `load` returns a new object, so `!==` on the array is wrong.
- A handoff that arrives between the editorial check and the batch replace causes `persistence failure` and is not dropped.
- Duplicate commit: the same `expectedRevision` twice. The second throws `stale edit`.
- Empty legal patch: no write, same revision.
- `replayEditorialWriteThrough` is a separate action. Open and `load` do not call it.
- Timestamps are arguments. Verifiers pass fixed stamps. Server actions may pass `new Date().toISOString()`.

## 14. Failure Matrix

Every row throws `Editorial workspace: ` plus the suffix, writes nothing, and does not invent fields. Save of a well-formed blocked package is the one quality exception: it stores `needs_editing` and does not throw.

| Failure | Operation | Suffix | Writes |
|---|---|---|---|
| Unknown patch key, non-draft `workflowState`, bad enum, `source-backed` left in place, `actorLabel` over 80 characters, internal `contentVersion` mismatch, patch names `concept.knowledgeUnitIds`, new forbidden payload key | Save and both advances | `malformed draft` | No |
| No knowledge units, or unknown unit id | Save and mark ready | `missing knowledge unit` | No |
| Unit with no blocks, or empty payload | Save and mark ready | `missing required block` | No |
| `exam-note`, `classification`, any type outside `PilotBlockType` | Save and mark ready | `invalid block type` | No |
| Unknown `sourceId` | Save and mark ready | `missing source` | No |
| Unknown reference id, blank `citation`, bad `supportType` | Save and mark ready | `invalid source reference` | No |
| Empty claim `sourceReferenceIds`, or `disputed` without `conflictGroupId` | Save and mark ready | `broken claim relationship` | No |
| `overall === "blocked"`, including duplicate block `order` | Mark Ready for Review and Mark Ready for Approval | `editorial_quality_blocked` | No |
| Duplicate block `order` | Save | none | Yes, status `needs_editing`, report blocked |
| Batch `contentVersion` or `completedAt` changed | Commit | `stale content version` | No |
| Wrong `expectedRevision`, including a duplicate submit | `save` | `stale edit` | No |
| Store throw, byte cap, note cap, change cap, write-through refusal, unequal copies on open | Commit or open | `persistence failure` | No success view. Editorial file not deleted |
| Missing batch item, missing draft, state other than `succeeded` or `quality_blocked` | Open or write-through | `persistence failure` | No |
| Mark Ready for Approval from `needs_editing`, Approve, Publish, projection flags deliverable | Advance | `invalid editorial transition` | No |
| Attempt to change `getReviewRecords` | Not a function | Verifier snapshot fails the PR | No registry edit is allowed as a fix |
| Corrupted editorial JSON or wrong `schemaVersion` | `load` | `persistence failure` | No |

UI actions show the message. They do not retry generation and do not call `recoverFailedBatchItem`.

## 15. TDD Matrix

| Case | PR of first RED | Proves missing when |
|---|---|---|
| 1–7 shape and provenance | PR 2 | `applyEditorialPatch` / `assertEditablePackage` missing, then a title patch does not stick or a bad `sourceId` does not throw `missing source` |
| 8–9 quality predicate | PR 2 | Advance of a blocked package returns success |
| 13 illegal edge and no approve symbol | PR 1 for the edge, PR 2 for the source scan | Transition returns, or `approveProduction` appears under `editorial/` |
| 10–12 stale and persistence | PR 3 | Commit writes after `completedAt` changes, or a thrown batch save still returns a view |
| 15 version freeze and `payload.body` round-trip | PR 3 | `load` drops `body` or changes `contentVersion` |
| 20 `source-backed` | PR 2 reject, PR 3 legal replace | Save coerces the string or refuses the legal replacement |
| 21 duplicate order | PR 3 | Save throws a new suffix or renumbers |
| 22 replay, non-open | PR 3 | Failed write-through deletes the editorial file or `load` calls replay |
| 22 open half | PR 4 | Open renders the unequal body |
| 23 forbidden key | PR 2 throw, PR 3 round-trip | A new `body` is stored, or an existing `body` is stripped |
| 24 concept inverse | PR 2 throw, PR 3 commit | `concept.knowledgeUnitIds` is accepted as a patch field |
| 25 actor and version | PR 2 throw, PR 4 open | Open writes, or the domain rewrites the numbers |
| 14 open is pure | PR 4 | Open creates a file |
| 17–19 notes, demotion, cap | PR 4 | Note-only save demotes, or the 201st row is stored |
| 16 registry | PR 6 | Topic ids differ, or `ready_for_editorial_review` is assigned to `editorialStatus` |
| Store CAS | PR 1 | Second save with revision 0 overwrites |
| UI source | PR 5 | `hasDraft` or `"use server"` absent |

Order inside each PR: add the assertions, run the verifier, see the failure, then implement. Do not implement first.

## 16. Verification Matrix

| Command | Exists today | First PR that must run it | Final PR 6 |
|---|---|---|---|
| `npm run verify:editorial-workspace` | No. Add in PR 1 | PR 1 and every later PR | Yes |
| `npm run verify:content-studio` | Yes | PR 5 | Yes |
| `npm run verify:batch-engine` | Yes | PR 3 | Yes |
| `npm run verify:batch-control` | Yes | PR 3 and PR 5 | Yes |
| `npm run verify:batch-recovery` | Yes | PR 3 | Yes |
| `npm run verify:content-review` | Yes | PR 6 | Yes |
| `npm run verify:content-quality` | Yes | PR 2 | Yes |
| `npm run verify:content-production` | Yes | PR 6 | Yes |
| `npx tsc --noEmit` | Yes | Every PR | Yes |
| `npm run lint` | Yes. May already fail outside this work | PR 5 and PR 6, without editing forbidden files | Yes, with pre-existing failures quoted |
| `git diff --check` | Yes, as a git command | Every PR | Yes |
| `npm run diff:check` | No. Add `"diff:check": "git diff --check"` in PR 6 | PR 6 | Yes |
| `npm run build` | Yes (`next build`) | PR 5 and PR 6 | Yes |

Do not call a live Gemini provider in any of these commands.

## 17. Exact File Map

Create, in PR order:

- PR 1: `editorial/types.ts`, `status.ts`, `store.ts`, `index.ts`, `verify-editorial-workspace.ts`
- PR 2: `editorial/edit.ts`, `validate.ts`
- PR 3: `editorial/commit.ts`, `file-store.ts`, `write-through.ts`
- PR 4: `editorial/open.ts`, `notes.ts`, `history.ts`
- PR 5: `editorial/actions.ts`, `src/app/content-studio/editor/[batchId]/[itemId]/page.tsx`, `EditorialWorkspace.tsx`, `EditorialHeader.tsx`, `EditorialContentEditor.tsx`, `EditorialProvenancePanel.tsx`, `EditorialQualityPanel.tsx`, `EditorialNotesPanel.tsx`, `EditorialHistoryPanel.tsx`

Modify:

- PR 1: `package.json` script `verify:editorial-workspace` only
- PR 3: `batch-engine/definition.ts`, `batch-engine/index.ts`, `batch-engine/store.ts`, `batch-engine/file-store.ts`
- PR 5: `batch-control/types.ts`, `batch-control/surface.ts`, `StudioBatchControl.tsx`
- PR 6: `verify-editorial-workspace.ts`, `CURRENT_STATE.md`, `package.json` `diff:check` only

`editorial/index.ts` is updated in every PR that adds a public function (PR 1 through PR 4).

## 18. Forbidden Changes

Do not modify:

- `src/lib/geography-data.ts` (the spec text also says `src/lib/content/geography-data.ts`; that path is not the repository file. The real file is `src/lib/geography-data.ts`. Do not modify either path.)
- `src/lib/content/production/batches/` including water cycle, latitude and longitude, atmosphere, and plate tectonics
- The package list inside `getReviewRecords` in `src/lib/content/review/registry.ts`
- `src/lib/content-quality/gate.ts` and `validators.ts`
- `src/lib/content/production/workflow.ts`
- `src/lib/content/pilot/types.ts`
- `src/lib/content/review/projection.ts`
- `recordEditorialHandoff` and the `registeredInContentReview !== false` check
- Assessment engine, learner state, search, public AI Ask, provider adapters, provider selection, platform APIs
- Supabase, any database client, authentication, RBAC, commerce, mobile
- Navbar, sitemap
- `STUDIO_STORAGE_KEY` consumers

Do not call `approveProduction`, `publishProduction`, `submitProductionForReview`, `createProductionCorrection`, `deprecateProduction`, or `archiveProduction`.

Do not import an AI provider from `src/lib/content-studio/editorial/`.

Do not set `registeredInContentReview` to `true`.

Do not change `BatchItemState` from the CMS.

Do not mint ids, invent sources, invent URLs, or silently repair a draft.

Do not persist the quality gate's published lifecycle candidate.

Do not store notes inside `PilotPackage`.

Do not use `localStorage`.

Do not start a worker by saving JSON.

## 19. Future Extension Boundary

Intentionally deferred. A later design may add them. These PRs must not:

- `ready_for_approval` → `approved` → `published`
- `approveEditorialDraft` or `publishEditorialDraft`
- `submitProductionForReview` from the workspace
- Human `editorial` and `academic-source` reviews via `recordProductionReview`
- Changing a generation-time `quality_blocked` item to `succeeded` so handoff can run
- `createProductionCorrection` as a wrapper around this editor
- Id minting
- A database-backed `EditorialDraftStore`
- Cross-process file locks
- Authentication for `actorLabel`
- Navbar entry
- Making `isProductionAiEligible` true for a draft

The extension points that must stay stable are `EditorialDraftStore`, `EditorialPatch`, `EditorialStatus`, and `updateBatchItemDraft`'s two-field write.

## 20. Implementation Order

1. Confirm the batch engine, inbox, and control surface are already on the branch you will branch from. If they exist only as uncommitted files in the dirty workspace, stop. Do not commit that dirty tree as part of this work. Do not implement in that workspace.
2. Create a new worktree and branch `feature/editorial-cms-workspace` from a commit that already contains that base. Use a new directory. Do not reuse an existing inspection worktree. Do not switch the current workspace's branch.
3. Execute PR 1 through PR 6 in order. Each PR is one commit, and only after its verification commands pass.
4. Do not push.
5. Do not reset, rebase, or merge.

Worktree example, for the later agent, not for this turn:

```text
git worktree add ../sajib-atlas-editorial-cms -b feature/editorial-cms-workspace <commit-that-contains-the-batch-engine>
```

If that commit does not exist, stop and report that the base is still uncommitted.

## 21. Definition of Done

The implementation is done only when all of the following are true:

- `EditorialStatus` has exactly four values, and `generated` is not one of them.
- A blocked quality report cannot be overridden and cannot become `ready_for_review`.
- `ready_for_review` and `ready_for_editorial_review` remain different strings with different owners.
- Save, validate, mark ready, request changes, return to editing, and mark ready for approval behave as the transition matrix says.
- Approve and Publish are visible, disabled, and have no handler.
- Open does not write. Stale revisions do not merge. A failed write-through does not delete the editorial file.
- `contentVersion` does not change on an ordinary edit.
- `result.draft` after a successful commit deep-equals the editorial `production` through `createMemoryBatchJobStore.load`, including an existing `payload.body`.
- `getReviewRecords` topic ids are unchanged. `registeredInContentReview` is still false.
- Canonical Geography files and `src/lib/geography-data.ts` have an empty diff.
- The verification matrix commands for PR 6 have been run.
- No live Gemini call was required or made.
- No commit contains files outside that PR's file list.
- Nothing has been pushed.

Until those are true, do not describe the workspace as implemented.
