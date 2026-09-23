# Editorial CMS implementation ledger

**Date:** 2026-09-23
**Worktree:** `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas-editorial-cms`
**Branch:** `feature/editorial-cms-workspace`
**Commit / push:** not done.

## Rulings

1. No git commit contains the batch engine, studio, spec, or plan. They were untracked on `feature/content-production-studio`. This worktree was created from commit `893cb1a` and those files were copied in as the working base. They were not committed here. The original workspace was not committed either.

2. Spec over plan for `replayEditorialWriteThrough`. The spec file map names that function on `commit.ts` and says `write-through.ts` calls `updateBatchItemDraft`. The plan keeps the function in `write-through.ts`. The function stays in `write-through.ts` (it calls `updateBatchItemDraft`) and `commit.ts` re-exports it. Commit itself also calls `updateBatchItemDraft` for the save path.

3. `npm run build` (Turbopack, Next 16.3.2 default) exits 1 because `node_modules` is a junction to `C:\Users\Lenovo\Documents\SajibAtlas\sajib-atlas\node_modules` and Turbopack reports `Symlink [project]/node_modules is invalid, it points out of the filesystem root`. `npx next build --webpack` exits 0 and typechecks. The editor route is present as `ƒ /content-studio/editor/[batchId]/[itemId]`. `next.config.ts` was not changed.

4. `npx tsc --noEmit` before any Next type generation fails only on `LayoutProps` in `src/app/layout.tsx` and `src/app/layout.backup.tsx` (`next-env.d.ts` is gitignored and `.next/types` did not exist). After the webpack build generated those types, `npx tsc --noEmit` exits 0. Those layout files were not edited.

5. `npm run lint` exits 1 only on pre-existing findings. Those files were not edited:
   - `src/components/content-studio/StudioForm.tsx` `react-hooks/set-state-in-effect` at the `setLibrary(loadStudioDrafts())` effect
   - `src/lib/content-studio/source-packet.ts` unused `_identity`
   - `src/lib/geography-data.ts` unused `banglaSummaries`

6. Tracked diffs in `src/app/globals.css` and `src/lib/ai-intelligence/**` / `src/lib/ai-providers/**` were already in this worktree. This implementation did not edit them.

## RED evidence

| PR | Command | Failure |
|---|---|---|
| 1 | `npm run verify:editorial-workspace` | `ERR_MODULE_NOT_FOUND` for `src/lib/content-studio/editorial/index.ts` |
| 1 | same, after a store that saved without a revision check | `AssertionError: Missing expected exception` at the second `save(..., 0)` (`/Editorial workspace: stale edit/`) |
| 2 | same | `SyntaxError: The requested module './editorial/index' does not provide an export named 'applyEditorialPatch'` |
| 3 | same | `ERR_MODULE_NOT_FOUND` for `src/lib/content-studio/editorial/file-store.ts` (resolved before the missing `commitEditorialSave` export) |
| 4 | same | `does not provide an export named 'commitRequestChanges'` |
| 5 | same | `ENOENT` opening `src/lib/content-studio/editorial/actions.ts` |
| 6 | same | `AssertionError: missing editorial case 16` |

## GREEN evidence

Each of those runs was repeated after the corresponding implementation. The final `npm run verify:editorial-workspace` prints `Editorial workspace verification passed.` and exits 0. Cases 1–25 each contain at least one `assert.`

## Commands

| Command | Exit |
|---|---|
| `npm run verify:editorial-workspace` | 0 |
| `npm run verify:content-studio` | 0 |
| `npm run verify:batch-engine` | 0 |
| `npm run verify:batch-control` | 0 |
| `npm run verify:batch-recovery` | 0 |
| `npm run verify:content-review` | 0 |
| `npm run verify:content-quality` | 0 |
| `npm run verify:content-production` | 0 |
| `npx tsc --noEmit` (after webpack build generated `.next/types`) | 0 |
| `npm run lint` | 1, pre-existing only (ruling 5) |
| `npm run diff:check` | 0 |
| `npm run build` | 1, Turbopack junction panic (ruling 3) |
| `npx next build --webpack` | 0 |

No live Gemini call was made.

## Forbidden paths

`git diff --stat` on these paths was empty:

- `src/lib/geography-data.ts`
- `src/lib/content/geography-data.ts`
- `src/lib/content/production/batches`
- `src/lib/content/review/registry.ts`
- `src/lib/content-quality/gate.ts`
- `src/lib/content-quality/validators.ts`
- `src/lib/content/production/workflow.ts`
- `src/lib/content/pilot/types.ts`
- `src/lib/content/review/projection.ts`
- `src/lib/content-studio/batch-engine/handoff.ts`
- `src/components/content-studio/StudioForm.tsx`
- `src/lib/content-studio/source-packet.ts`

`recordEditorialHandoff` was not edited. The CMS does not import `approveProduction`, `publishProduction`, `submitProductionForReview`, or `createProductionCorrection`.

## Files added for this workspace

- `src/lib/content-studio/editorial/types.ts`
- `src/lib/content-studio/editorial/status.ts`
- `src/lib/content-studio/editorial/store.ts`
- `src/lib/content-studio/editorial/index.ts`
- `src/lib/content-studio/editorial/edit.ts`
- `src/lib/content-studio/editorial/validate.ts`
- `src/lib/content-studio/editorial/commit.ts`
- `src/lib/content-studio/editorial/file-store.ts`
- `src/lib/content-studio/editorial/write-through.ts`
- `src/lib/content-studio/editorial/open.ts`
- `src/lib/content-studio/editorial/notes.ts`
- `src/lib/content-studio/editorial/history.ts`
- `src/lib/content-studio/editorial/actions.ts`
- `src/lib/content-studio/verify-editorial-workspace.ts`
- `src/app/content-studio/editor/[batchId]/[itemId]/page.tsx`
- `src/components/content-studio/EditorialWorkspace.tsx`
- `src/components/content-studio/EditorialHeader.tsx`
- `src/components/content-studio/EditorialContentEditor.tsx`
- `src/components/content-studio/EditorialProvenancePanel.tsx`
- `src/components/content-studio/EditorialQualityPanel.tsx`
- `src/components/content-studio/EditorialNotesPanel.tsx`
- `src/components/content-studio/EditorialHistoryPanel.tsx`

## Files updated for this workspace

- `package.json` — `verify:editorial-workspace` and `diff:check` only, on top of the copied studio scripts
- `CURRENT_STATE.md` — editorial paragraph after the copied section 60
- `src/lib/content-studio/batch-engine/definition.ts` — `updateBatchItemDraft` only
- `src/lib/content-studio/batch-engine/index.ts` — export that function
- `src/lib/content-studio/batch-engine/store.ts` — draft exemption around `scrubStored`
- `src/lib/content-studio/batch-engine/file-store.ts` — same exemption on save
- `src/lib/content-studio/batch-control/types.ts` — `hasDraft`
- `src/lib/content-studio/batch-control/surface.ts` — set `hasDraft`
- `src/components/content-studio/StudioBatchControl.tsx` — one editor link per openable item

`scrubStored` and `FORBIDDEN_KEYS` were not changed.
