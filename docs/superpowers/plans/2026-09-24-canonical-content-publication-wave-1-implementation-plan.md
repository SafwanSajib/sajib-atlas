# Canonical Content Publication Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish eligible real canonical Geography ProductionRecords through the existing production/review/approval/publication pipeline without migrating legacy Geography.

**Architecture:** Reuse the existing Production, Content Review, Quality Gate, and delivery projection authorities. Execute each topic independently and fail closed on missing/mismatched review or quality evidence.

**Tech Stack:** Next.js, TypeScript, existing repository verification scripts, headless Chrome/browser substitute where available.

**Spec:** docs/superpowers/specs/2026-09-24-canonical-content-publication-wave-1-design.md

## Global Constraints

- Work on `feature/editorial-cms-workspace` in `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas-editorial-cms`. Inspected HEAD is `c804dda`. Re-check `git rev-parse HEAD` before editing.
- Do not edit `src/lib/geography-data.ts` or `src/app/geography/[topic]/page.tsx`.
- Do not edit the four package files named in Repository Baseline. Do not regenerate their content.
- Do not add a review store, publication store, database, route, search index, or AI provider call.
- Do not call `submitReadyEditorialRecord` for these four topics. They have no editorial file.
- Do not import `approveProduction` or `publishProduction` from `src/lib/content-studio/editorial/`.
- `recordEditorialHandoff` stays an inbox marker. `registeredInContentReview` stays the literal `false`.
- A test operator packet may exercise `recordProductionReview`. It must be removed from the registry before the verifier process exits. It must not be written into `registry.ts` as if a human reviewed the package.
- The 2026-09-03 audit markdown files are not `ProductionReview` rows.
- Do not push, merge, reset, rebase, or switch branches.
- Lint may keep only `StudioForm.tsx` `react-hooks/set-state-in-effect`, `source-packet.ts` unused `_identity`, and `geography-data.ts` unused `banglaSummaries`.

## Review Focus

1. One passed review type must not satisfy the other.
2. A snapshot whose `contentId` or `contentVersion` disagrees with the topic must not be repaired.
3. Publishing topic A must not restore or deprecate topic B when B blocks.
4. `projectProductionDelivery` must return `undefined` for `draft`, `review`, and `approved`.
5. A test reviewer id must not remain in `getReviewRecords()` after the verifier exits, and must not be described as the 2026-09-03 audit.

Spec section 9 forbids publishing the live registry without an operator packet. That rule wins over the sentence in spec section 15 that would leave `verify-review.ts` asserting `published` from a test packet. `verify-review.ts` keeps asserting `draft` for these four ids.

## Repository Baseline

| Topic | Export | File | Id | Version | Registry state | Snapshot overall | Reviews |
|---|---|---|---|---|---|---|---|
| The Water Cycle | `geographyWaterCycleProductionPackage` | `src/lib/content/production/batches/geography-water-cycle.ts` | `topic/geography/water-cycle` | 1 | `draft` | `pass` | none |
| Latitude and Longitude | `geographyLatitudeLongitudeProductionPackage` | `src/lib/content/production/batches/geography-latitude-longitude.ts` | `topic/geography/latitude-and-longitude` | 1 | `draft` | `pass` | none |
| Atmosphere | `geographyAtmosphereProductionPackage` | `src/lib/content/production/batches/geography-atmosphere.ts` | `topic/geography/atmosphere` | 1 | `draft` | `pass` | none |
| Plate Tectonics | `geographyPlateTectonicsProductionPackage` | `src/lib/content/production/batches/geography-plate-tectonics.ts` | `topic/geography/plate-tectonics` | 1 | `draft` | `pass` | none |

`verify-review.ts` already asserts those four overall values and `workflowState === "draft"`. The package files contain `lifecycle: "published"` on the topic literal. `createProductionDraft` replaces that with `draft`. Use `getReviewRecord`, not the raw literal.

`src/lib/content/review/registry.ts` holds one `localRecords` array. It has `getReviewRecords` and `getReviewRecord`. It has no setter.

## Existing Interfaces

All live in `src/lib/content/production/workflow.ts` and are exported from `src/lib/content/production/index.ts`.

```ts
submitProductionForReview(record: ProductionRecord): ProductionRecord
recordProductionReview(record: ProductionRecord, review: Omit<ProductionReview, "contentVersion">): ProductionRecord
approveProduction(record: ProductionRecord): ProductionRecord
publishProduction(record: ProductionRecord, publishedAt: string): ProductionRecord
projectProductionDelivery(record: ProductionRecord): ProductionRecord | undefined
evaluateProductionQuality(record: ProductionRecord, evaluatedAt?: string, evaluatorVersion?: string): ProductionRecord
createProductionCorrection(published: ProductionRecord, correctedContent: PilotPackage): ProductionRecord
isProductionDeliveryEligible(record: ProductionRecord): boolean
isProductionAiEligible(record: ProductionRecord): boolean
```

`getReviewRecord(topicId: string): ProductionRecord | undefined` lives in `src/lib/content/review/registry.ts`.

`buildReviewProjection(record: ProductionRecord)` lives in `src/lib/content/review/projection.ts`.

Error prefix from `workflow.ts` is `Canonical content production: `.

## Task 1: Repository baseline and real-record inventory

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Read only: the four package files, `registry.ts`, `workflow.ts`, `geography-data.ts`, `src/app/geography/[topic]/page.tsx`

**Interfaces:**

- Consumes: `getReviewRecord`, `projectProductionDelivery`
- Produces: assertions only

- [ ] Step 1: Add assertions named `wave inventory`. For each of the four ids, assert `getReviewRecord(id).content.topic.contentVersion` is `1`, `workflowState` is `draft`, `reviews.length` is `0`, snapshot `contentId` equals the id, snapshot `contentVersion` is `1`, snapshot `report.overall` is `pass`, and `projectProductionDelivery` returns `undefined`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected RED does not apply: these facts are already true. If one assertion throws, stop and report the blocker. Do not edit the package.
- [ ] Step 3: No production change in this task.
- [ ] Step 4: The same command prints `Canonical content production verification passed.`
- [ ] Step 5: Run `npm run verify:content-review`. Expected exit 0.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run. An execution stage may commit only after Task 12 is green, and must not push.

## Task 2: Publication eligibility and readiness

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Create: `src/lib/content/production/wave.ts`
- Modify: `src/lib/content/review/registry.ts`

**Interfaces:**

- Consumes: `getReviewRecord`, `evaluateProductionQuality`, `projectProductionDelivery`
- Produces: `replaceReviewRecord(topicId: string, next: ProductionRecord): void` and `runPublicationWave`

`runPublicationWave` input:

```ts
export type WaveOperatorReview = {
  type: "editorial" | "academic-source";
  outcome: "passed" | "failed" | "warning";
  reviewerId: string;
  reviewedAt: string;
};

export type WaveTopicResult = {
  topicId: string;
  outcome: "published" | "blocked";
  blockers: readonly string[];
  contentVersion: number;
  workflowState: ProductionWorkflowState;
  delivery: "returned" | "undefined";
  aiGroundable: boolean;
  editorialFile: "no editorial file";
};
```

`replaceReviewRecord` throws `Canonical content production: unknown review record` when the id is absent. It throws `Canonical content production: review record identity mismatch` when `next.content.topic.id` differs. It replaces that one slot and does not append.

- [ ] Step 1: Write `wave missing function` by importing `runPublicationWave` from `./wave`. Call it with the four ids, no `operatorReviews`, and `publishedAt: "2026-09-24T00:00:00.000Z"`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected RED: `Cannot find module` for `./wave`.
- [ ] Step 3: Add `wave.ts` and `replaceReviewRecord`. With no operator reviews, each result is `outcome: "blocked"`, blockers `missing-editorial-review` and `missing-academic-source-review`, `editorialFile: "no editorial file"`, `delivery: "undefined"`, `aiGroundable: false`, and `workflowState: "draft"`. Do not call `publishProduction`. Do not call `replaceReviewRecord`.
- [ ] Step 4: The same command passes and `getReviewRecord` for each id is still `draft`.
- [ ] Step 5: Run `npm run verify:content-review`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 3: Operator-review packet boundary

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Modify: `src/lib/content/production/wave.ts`

**Interfaces:**

- Consumes: `recordProductionReview` signature `Omit<ProductionReview, "contentVersion">`
- Produces: blocker strings, no persisted reviewer

- [ ] Step 1: Case `wave empty reviewer`. Pass one review `{ type: "editorial", outcome: "passed", reviewerId: " ", reviewedAt: "2026-09-24T00:00:00.000Z" }` and one academic-source row with a non-empty reviewer. Expect the Water Cycle result `blocked` and blocker `reviewer and review timestamp are required`. `getReviewRecord("topic/geography/water-cycle").reviews.length` stays `0`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected RED: the empty reviewer is not yet rejected by `runPublicationWave`.
- [ ] Step 3: Before calling `recordProductionReview`, reject a packet that lacks both types, has a blank `reviewerId`, has an unparseable `reviewedAt`, or has `outcome` other than `passed`. Do not read files under `docs/superpowers/reviews/`.
- [ ] Step 4: The empty-reviewer assertion passes. Add case `wave audit file is not a review`: the string `READY WITH WARNINGS` is not consulted, and `reviews.length` stays `0` when `operatorReviews` is omitted.
- [ ] Step 5: Run `npm run verify:content-production` and `npm run verify:content-review`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 4: Water Cycle real-record publication

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Modify: `src/lib/content/production/wave.ts`
- Modify: `src/lib/content/review/registry.ts` only for `replaceReviewRecord`

**Interfaces:**

- Consumes: `submitProductionForReview`, `recordProductionReview`, `approveProduction`, `publishProduction`, `projectProductionDelivery`, `replaceReviewRecord`
- Produces: one in-process published Water Cycle record, restored to `draft` before the verifier returns

Test packet, local to the test, named `waveTestOperatorReviews`:

```ts
[
  { type: "editorial", outcome: "passed", reviewerId: "operator/test-editorial", reviewedAt: "2026-09-24T00:00:00.000Z" },
  { type: "academic-source", outcome: "passed", reviewerId: "operator/test-academic", reviewedAt: "2026-09-24T00:01:00.000Z" },
]
```

- [ ] Step 1: Case `wave publish water cycle`. Save `const before = getReviewRecord("topic/geography/water-cycle")`. Call `runPublicationWave` with only that id, the test packet, and `publishedAt: "2026-09-24T00:02:00.000Z"`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected RED: result is `blocked` because Task 3 never publishes.
- [ ] Step 3: When the packet is complete and the snapshot matches and overall is not `blocked`, call the four workflow functions in order and `replaceReviewRecord` with the published return value. `contentVersion` stays `1`.
- [ ] Step 4: Assert `outcome` is `published`, `delivery` is `returned`, `aiGroundable` is true, `publishedAt` is the supplied timestamp, and both review rows exist with `contentVersion` `1`. Then `replaceReviewRecord` with `before` so the module array is the original draft again. Assert `getReviewRecord(...).workflowState` is `draft` and `reviews.length` is `0`.
- [ ] Step 5: Run `npm run verify:content-production` and `npm run verify:content-review`. The review verifier must still see `draft`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 5: Latitude and Longitude real-record publication

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Modify: `src/lib/content/production/wave.ts` only if the Water Cycle path special-cases an id

**Interfaces:**

- Consumes: the same wave function
- Produces: the same result shape for `topic/geography/latitude-and-longitude`

- [ ] Step 1: Case `wave publish latitude and longitude`. Same packet and timestamp. Capture `before`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected RED only if the wave still filters to Water Cycle. If Task 4 already accepts any of the four ids, this step is GREEN immediately. Do not add a second publisher.
- [ ] Step 3: Remove any Water Cycle-only branch if one was added.
- [ ] Step 4: Assert `published`, version `1`, delivery `returned`, then restore `before`.
- [ ] Step 5: Run `npm run verify:content-production`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 6: Atmosphere real-record publication

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`

**Interfaces:**

- Consumes: `runPublicationWave`
- Produces: result for `topic/geography/atmosphere`

- [ ] Step 1: Case `wave publish atmosphere`. Same packet. Capture `before`. Also assert the pre-wave snapshot overall is `pass`.
- [ ] Step 2: Run `npm run verify:content-production`. Expected result is the existing wave behavior. A throw that names a quality blocker is a reported block, not a gate edit.
- [ ] Step 3: No gate change. If the call throws for a reason other than the known canonical errors, stop.
- [ ] Step 4: Assert `published`, `contentVersion` `1`, delivery `returned`, then restore `before`.
- [ ] Step 5: Run `npm run verify:content-production`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 7: Plate Tectonics real-record publication

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`

**Interfaces:**

- Consumes: `runPublicationWave`
- Produces: result for `topic/geography/plate-tectonics`

- [ ] Step 1: Case `wave publish plate tectonics`. Same packet. Capture `before`.
- [ ] Step 2: Run `npm run verify:content-production`.
- [ ] Step 3: No package edit. A `blocked` overall stops the topic with `quality blockers prevent approval` or `quality blockers prevent publication` and does not restore any other topic.
- [ ] Step 4: Assert the successful path: `published`, version `1`, delivery `returned`, restore `before`. If the gate blocks, assert `outcome` `blocked`, `getReviewRecord` still `draft`, and do not weaken the gate.
- [ ] Step 5: Run `npm run verify:content-production` and `npm run verify:content-quality`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 8: Partial failure, resume, and idempotency

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Modify: `src/lib/content/production/wave.ts`

**Interfaces:**

- Consumes: `runPublicationWave`, `replaceReviewRecord`
- Produces: per-topic results with no cross-topic rollback

- [ ] Step 1: Case `wave isolates latitude`. Publish Water Cycle with the test packet. Call the wave again with both Water Cycle and Latitude and Longitude, passing the packet only when the implementation supports a per-topic packet map. Use this map type:

```ts
operatorReviewsByTopic: Readonly<Record<string, readonly WaveOperatorReview[]>>
```

Water Cycle has the packet. Latitude and Longitude has no entry.

- [ ] Step 2: Run `npm run verify:content-production`. Expected RED: a single shared packet is still applied to every id, or a Latitude failure reverts Water Cycle.
- [ ] Step 3: Read `operatorReviewsByTopic[topicId]`. Missing entry blocks that topic only. After Water Cycle is `published`, a second call does not change its `publishedAt` and does not append another pair of review rows. Latitude stays `draft`.
- [ ] Step 4: Assert Water Cycle `published` and Latitude `blocked` with `missing-editorial-review`. Restore Water Cycle to `before`.
- [ ] Step 5: Run `npm run verify:content-production`.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

Add case `wave publish failure leaves the stored object` in the same task. Clone a Water Cycle draft, set snapshot `contentVersion` to `2`, and call `publishProduction` only after a manual `approveProduction` is impossible because of the mismatch. Assert the clone JSON is unchanged and `projectProductionDelivery` returns `undefined`. This uses the existing throw `quality snapshot does not match content identity`.

Add case `wave blocked quality`. On a clone, set `qualitySnapshot.report.overall` to `"blocked"` after both reviews would have been recorded. `approveProduction` throws `quality blockers prevent approval`. The clone `workflowState` stays `review` if the reviews were applied on the clone, and the registry draft is untouched.

Add case `wave missing snapshot`. Delete `qualitySnapshot` on a clone that is in `review` with both passed rows. `approveProduction` must call `evaluateProductionQuality`. The returned object has a snapshot whose `contentId` is the topic id. The input object's snapshot stays `undefined`. Do not assign `overall: "pass"` in `wave.ts`.

Add case `wave mismatched content id`. Set snapshot `contentId` to `"topic/other"`. Expect `quality snapshot does not match content identity`.

## Task 9: Version 1 and version 2

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`

**Interfaces:**

- Consumes: `createProductionCorrection`, `projectProductionDelivery`, `commitEditorialSave`
- Produces: assertions. The correction function already exists.

- [ ] Step 1: Case `wave version 1 stays 1`. Publish a clone through the existing functions and the test packet. Assert `contentVersion` is `1`. Build corrected content with topic, knowledge-unit, and alignment `contentVersion` set to `2`. `createProductionCorrection` returns `draft`, `supersedesVersion` `1`. `JSON.stringify` of the published clone is unchanged. `projectProductionDelivery` returns the version `1` object and returns `undefined` for version `2`.
- [ ] Step 2: Run `npm run verify:content-production`. The correction behavior already exists in `workflow.ts`. A failure means a real contract bug. Do not edit the package files.
- [ ] Step 3: No function change unless the assertion shows `createProductionCorrection` mutates its first argument.
- [ ] Step 4: Assert version `3` throws `correction must increment content version by exactly one` and the published JSON is unchanged.
- [ ] Step 5: Case `wave stale editorial revision`. Create a memory batch whose draft is `waterCycleDraft()`, call `commitEditorialSave` twice with `expectedRevision: 0`. The second throw matches `Editorial workspace: stale edit`. The published clone from Step 1 is unchanged.
- [ ] Step 6: Run `npm run verify:content-production` and `npm run verify:editorial-workspace`.
- [ ] Step 7: Do not commit in this planning run.

## Task 10: Search, AI, assessment, learner, and legacy Geography isolation

**Files:**

- Modify: `src/lib/content/production/verify-production.ts`
- Read only: `src/lib/search/`, `src/lib/assessment-engine/`, `src/lib/learner-intelligence/`, `src/lib/geography-data.ts`, `src/app/geography/[topic]/page.tsx`

**Interfaces:**

- Consumes: `buildReviewProjection`, `isProductionAiEligible`, `readFileSync`
- Produces: source and byte assertions

- [ ] Step 1: Before each publish assertion, assert `buildReviewProjection(draft).lifecycle.deliverable` is false and `lifecycle.aiGroundable` is false for `draft`, `review`, and `approved`.
- [ ] Step 2: Read `wave.ts` and assert it does not contain `src/lib/search`, `assessment-engine`, `learner-intelligence`, `entitlement`, `commerce`, or `geography-data`.
- [ ] Step 3: Capture `readFileSync` of `src/lib/geography-data.ts`, `src/app/geography/[topic]/page.tsx`, and the four package files at the start of the wave cases. Assert the strings are equal at the end.
- [ ] Step 4: Assert the published clone keeps its existing `assessmentAlignments[0].assessmentSetId` and does not add a second alignment.
- [ ] Step 5: Run `npm run verify:search`, `npm run verify:assessment-scoring`, `npm run verify:learner-intelligence`, and `npm run verify:content-production`. Expected exit 0. Do not edit those suites.
- [ ] Step 6: No documentation change.
- [ ] Step 7: Do not commit in this planning run.

## Task 11: Browser and runtime verification

**Files:**

- No application file.
- A temporary gitignored batch is not required for the legacy route check.

**Interfaces:**

- Consumes: the running `next dev` server
- Produces: a written record of HTTP status and visible text in the execution notes

- [ ] Step 1: Start `npx next dev --port 3467` from this worktree.
- [ ] Step 2: Open these URLs with headless Chrome if `agent-browser` is absent. Record the substitute in the execution notes.
- [ ] Step 3: `http://127.0.0.1:3467/content-studio` returns 200 and contains `DRAFT — NOT CANONICAL`.
- [ ] Step 4: `http://127.0.0.1:3467/content-review` returns 200. Each Wave 1 title is followed by `draft` unless a human operator packet was committed into `registry.ts`. This plan does not commit that packet, so the expected text is `draft`.
- [ ] Step 5: `http://127.0.0.1:3467/geography/physical-geography` returns 200, shows the legacy study page, and does not show `projectProductionDelivery`.
- [ ] Step 6: Open one existing editor route only when `.data` already contains a batch. Do not create a canonical publication from that page. Approve and Publish remain disabled. Console shows no uncaught exception on these routes.
- [ ] Step 7: Stop the server. Do not commit in this planning run.

HTTP 200 is not evidence that the Geography route serves a `ProductionRecord`.

## Task 12: Full regression and CURRENT_STATE

**Files:**

- Modify: `CURRENT_STATE.md` section 61 only

**Interfaces:**

- Consumes: the commands below
- Produces: one paragraph that matches the tests

- [ ] Step 1: Run the command list below.
- [ ] Step 2: `git diff --name-only -- src/lib/geography-data.ts src/app/geography src/lib/content/production/batches/geography-water-cycle.ts src/lib/content/production/batches/geography-latitude-longitude.ts src/lib/content/production/batches/geography-atmosphere.ts src/lib/content/production/batches/geography-plate-tectonics.ts` is empty.
- [ ] Step 3: Add one paragraph. State that Wave 1 can publish a real registry record only when an operator review packet is supplied at execution, that the committed registry still returns `draft` for the four topics, that `projectProductionDelivery` returns a record only after `publishProduction`, and that `/geography/[topic]` still reads `geography-data.ts`.
- [ ] Step 4: Do not write that the four topics are published on the public site.
- [ ] Step 5: Run `npm run verify:content-review` again after the paragraph. Documentation does not change that verifier.
- [ ] Step 6: Lint may exit 1 only for the three Global Constraints findings.
- [ ] Step 7: Do not commit in this planning run. Do not push.

Commands:

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

## Spec coverage

| Spec section | Task |
|---|---|
| 1 Purpose and independent failure | Task 8 |
| 2 Baseline table | Task 1 |
| 3 Scope and registry slot replacement | Tasks 2 and 4 |
| 4 Non-goals | Global Constraints |
| 5 Topic order | Task 2 input list |
| 6 Existing functions | Existing Interfaces |
| 7 Four axes | Tasks 1 and 10 |
| 8 Quality Gate | Task 8 rejection cases |
| 9 Review classes and no fabricated audit row | Task 3 |
| 10 Version 1 and version 2 | Task 9 |
| 11 Partial failure and resume | Task 8 |
| 12 Isolation | Task 10 |
| 13 Evidence fields | `WaveTopicResult` |
| 14 Browser checks | Task 11 |
| 15 Tests | Tasks 1 through 10 |
| 16 Per-record atomicity | Task 8 publish-failure case |
| 17 Deferred public-route switch | Global Constraints and Task 12 |
| 18 Acceptance criteria | this coverage table |
| 19 No second registry | `replaceReviewRecord` in the existing file |

## Self-review

- Every publication call named above exists in `workflow.ts`.
- `runPublicationWave` and `replaceReviewRecord` are the only new symbols. They do not replace `approveProduction` or `publishProduction`.
- No test writes a reviewer id into the committed registry source.
- Quality `pass` is not treated as `approved` or `published`.
- `generated` is not treated as `review`.
- Legacy Geography files are read-only in every task.
