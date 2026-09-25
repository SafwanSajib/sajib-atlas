# End-to-end canonical publication loop ledger

**Date:** 2026-09-23
**Worktree:** `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas-editorial-cms`
**Branch:** `feature/editorial-cms-workspace`
**Base:** `027d5350af3970b67eb4d70d24523dd32f89ceab`
**Authority:** `docs/superpowers/specs/2026-09-23-end-to-end-canonical-publication-loop-design.md` wins over the plan if they conflict.
**Plan:** `docs/superpowers/plans/2026-09-23-end-to-end-canonical-publication-loop-implementation-plan.md`

## Rulings

1. A missing quality snapshot is not hand-stamped as a pass. `approveProduction` and `publishProduction` keep the existing call to `evaluateProductionQuality` when the snapshot is absent. The input object stays unevaluated. A blocked evaluation still throws. A present snapshot whose `contentId` or `contentVersion` disagrees is rejected and is not repaired.
2. No registry writer is added. Stored-state atomicity is the caller's assignment after a successful return. Thrown calls do not mutate the input.
3. `getPublishedTopicDelivery` is not the pilot proof. `projectProductionDelivery` reads only a `ProductionRecord`.
4. `recordEditorialHandoff` stays an inbox marker. `registeredInContentReview` stays `false`.

## Task log

5. A correction draft from `createProductionCorrection` includes `supersedesVersion`. The existing editor rejects that field with `malformed draft: immutable field` and does not write. That is existing CMS protection, not a publication overwrite. Stale compare-and-swap is proven on a separate version-1 draft. Published N stays intact.
