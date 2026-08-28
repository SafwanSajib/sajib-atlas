# SajibAtlas v10 Agent Guide

SajibAtlas is a knowledge, learning, discovery, growth, and future-commerce platform. The v10 architecture is the source of truth.

## Non-negotiable rules

- Read `docs/architecture/SAJIB_ATLAS_V10_ARCHITECTURE.md` before changing application structure.
- Keep content separate from presentation.
- Prefer Server Components; use Client Components only for genuine interaction.
- Keep core logic hosting-independent. Vercel-specific integrations must be isolated behind adapters.
- Do not install a CMS, payment system, database, authentication backend, or AI provider merely for future readiness.
- Use design tokens and reusable components. Avoid arbitrary one-off styling.
- Mobile-first, accessible, and SEO-conscious by default.
- Do not mass-generate educational content before the canonical schema and renderer are validated.
- High-impact factual, historical, statistical, current-affairs, and exam content requires human review.
- Never treat an unverified feature as implemented.
- Do not rewrite Git history or force-push `main` as part of normal development.

## Working model

Task → feature branch → implementation → lint → TypeScript → build → route smoke test → review → merge.

The reset work is isolated on `reset/v10-foundation`. Do not modify `main` for reset work.
