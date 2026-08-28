# SajibAtlas v10 Current State

Last reset checkpoint: 2026-08-28
Branch: `reset/v10-foundation`

## Status

- Infrastructure: preserved and intentionally untouched.
- Legacy application surface: removed from the reset branch.
- v10 application shell: implemented.
- Unified `/subjects` and `/topics` experiences: implemented.
- Normalized content contract: implemented.
- Static content adapter: implemented.
- Canonical topic: `motions-of-earth` implemented.
- Gold-standard topic renderer: implemented.
- Isolated MCQ interaction: implemented.
- AI/search/analytics/commerce/learner boundaries: contracts only.
- CMS/payment/auth/database/AI provider integration: intentionally not implemented.

## Canonical route set

- `/`
- `/subjects`
- `/topics`
- `/topics/motions-of-earth`
- `/robots.txt`
- `/sitemap.xml`

## Intentionally removed

Legacy subject-specific routes, legacy components, legacy learner implementation, duplicated content registries, backup CSS/layout files, generated diagnostic artifacts, and obsolete execution-state files were removed from the active reset branch. Git history remains available for recovery.

## Verification

This checkpoint was assembled through the GitHub repository API. Local `npm run lint`, `npx tsc --noEmit`, `npm run build`, and browser smoke tests still need to be run from the development machine because this session does not execute the repository's local Node toolchain.

## Next engineering checkpoint

1. Run local lint and TypeScript.
2. Run production build and resolve only real build failures.
3. Verify the four canonical routes on mobile and desktop.
4. Validate the topic schema and MCQ UX.
5. Only then expand the content model or add another domain.
