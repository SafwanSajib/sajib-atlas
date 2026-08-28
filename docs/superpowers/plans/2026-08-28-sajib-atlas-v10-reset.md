# SajibAtlas v10 Architectural Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy SajibAtlas application layer with a clean v10 foundation aligned to the Universal Master Vision, while preserving Git history and external infrastructure.

**Architecture:** Keep the existing Next.js 16 + TypeScript foundation, but rebuild the active application around a domain-neutral knowledge platform. Content is separated from presentation through normalized types and adapters; routes represent experiences, not duplicated subject-specific applications. Future AI, analytics, commerce, CMS, and learner-state capabilities receive explicit boundaries without premature backend dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4/PostCSS, CSS design tokens, Server Components by default.

**Spec:** SajibAtlas Universal Master Vision v10, represented in-repository by `docs/architecture/SAJIB_ATLAS_V10_ARCHITECTURE.md`.

## Global Constraints

- Preserve Git history and the existing repository; do not rewrite `main` during reset.
- Work on `reset/v10-foundation` until verification and review are complete.
- Preserve domain/Vercel/Cloudflare infrastructure; no infrastructure changes are part of this reset.
- Content must remain separate from UI components.
- Core architecture must remain hosting-independent and CMS-ready without installing a CMS now.
- Prefer Server Components; introduce client state only where interaction requires it.
- Mobile-first and accessibility-first.
- Avoid unnecessary dependencies.
- No payment, authentication backend, database, CMS, or AI API integration in this foundation checkpoint.
- No mass content generation until the content schema and gold-standard renderer are validated.
- Deprecated code is removed from the active tree, not copied into a new legacy layer.

---

### Task 1: Establish the v10 source of truth

**Files:**
- Create: `docs/architecture/SAJIB_ATLAS_V10_ARCHITECTURE.md`
- Create: `docs/superpowers/plans/2026-08-28-sajib-atlas-v10-reset.md`
- Modify: `AGENTS.md`
- Modify: `README.md`

**Interfaces:**
- Produces the architecture vocabulary and directory contract used by every later task.

- [x] **Step 1: Record the v10 architecture and reset rules.**
- [ ] **Step 2: Replace generic starter documentation with project-specific operating instructions.**
- [ ] **Step 3: Verify all active paths referenced by the documents are either present or explicitly planned.**

---

### Task 2: Remove the legacy application surface

**Files:**
- Delete legacy subject routes under `src/app/about`, `src/app/bcs`, `src/app/english`, `src/app/explore`, `src/app/geography`, `src/app/international-affairs`, `src/app/research`, `src/app/revision`, and legacy dashboard routes.
- Delete legacy presentation components under `src/components/legacy` and obsolete one-off components.
- Delete backup/reference artifacts such as `globals.backup.css`, `layout.backup.tsx`, `build-output.txt`, `lint-output.txt`, `lint-results.txt`, `tsc-output.txt`, `tsc-results.txt`, `step1-ui.txt`, `step1_code.txt`, `file_list.txt`, `globals-code.txt`, `layout-code.txt`, and the malformed `tatus --short` artifact.
- Delete obsolete `.cline` and `.codex` execution-state artifacts after their useful architectural decisions have been transferred into the new documentation.

**Interfaces:**
- Produces a clean active application tree with no legacy route/component dependencies.

- [ ] **Step 1: Remove legacy paths from the active tree.**
- [ ] **Step 2: Keep only required project configuration and reusable brand assets.**
- [ ] **Step 3: Verify no remaining source file imports deleted modules.**

---

### Task 3: Build the v10 foundation

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/topics/page.tsx`
- Create: `src/app/subjects/page.tsx`
- Create: `src/app/layout.tsx`
- Create/replace: `src/app/globals.css`
- Create: `src/components/layout/SiteHeader.tsx`
- Create: `src/components/layout/SiteFooter.tsx`
- Create: `src/components/content/DomainCard.tsx`
- Create: `src/components/content/SectionHeading.tsx`
- Create: `src/components/shared/Container.tsx`
- Create: `src/components/shared/Placeholder.tsx`

**Interfaces:**
- `DomainCard` consumes normalized domain metadata.
- Layout components are presentation-only and do not own content datasets.
- Pages consume data through the content/domain layer.

- [ ] **Step 1: Add the design-token layer for typography, surfaces, spacing, borders, and semantic states.**
- [ ] **Step 2: Build the responsive shell with mobile-first navigation.**
- [ ] **Step 3: Build a restrained v10 landing page describing Learn → Grow → Discover → Commerce.**
- [ ] **Step 4: Build the initial subjects/topics indexes without duplicating subject-specific applications.**
- [ ] **Step 5: Verify keyboard navigation, responsive overflow, and readable typography.**

---

### Task 4: Establish normalized content contracts

**Files:**
- Create: `src/types/content.ts`
- Create: `src/types/topic.ts`
- Create: `src/types/assessment.ts`
- Create: `src/content/registry.ts`
- Create: `src/content/geography/motions-of-earth.ts`
- Create: `src/lib/content/normalize.ts`
- Create: `src/lib/content/loaders/static-loader.ts`
- Create: `src/lib/content/adapters/content-adapter.ts`

**Interfaces:**
- `ContentSource` is the source-facing contract.
- `NormalizedTopic` is the UI-facing contract.
- The static loader is an implementation of the adapter boundary and can later be replaced by MDX/CMS adapters.
- Assessment data is separate from topic prose.

- [ ] **Step 1: Define the minimal normalized topic schema required by the v10 learning flow.**
- [ ] **Step 2: Implement the static TypeScript content adapter.**
- [ ] **Step 3: Add `পৃথিবীর গতি / Motions of the Earth` as the first canonical topic.**
- [ ] **Step 4: Verify the normalized output is independent of its source format.**

---

### Task 5: Add the gold-standard topic renderer

**Files:**
- Create: `src/app/topics/[slug]/page.tsx`
- Create: `src/components/content/TopicHero.tsx`
- Create: `src/components/content/ConceptSection.tsx`
- Create: `src/components/content/FactGrid.tsx`
- Create: `src/components/content/MisconceptionCard.tsx`
- Create: `src/components/learning/QuickRevision.tsx`
- Create: `src/components/learning/WrittenPointCard.tsx`
- Create: `src/components/assessment/MCQPractice.tsx`
- Create: `src/components/content/RelatedTopics.tsx`

**Interfaces:**
- The route resolves a topic through the content adapter.
- All sections consume normalized topic data.
- Interactive MCQ behavior is isolated in the assessment component.

- [ ] **Step 1: Render the canonical topic with the v10 learning sequence.**
- [ ] **Step 2: Add static SEO metadata and a safe not-found path.**
- [ ] **Step 3: Add MCQ interaction as the first intentionally client-side island.**
- [ ] **Step 4: Verify the topic renders correctly on mobile and desktop.**

---

### Task 6: Add future-system boundaries without implementing future systems

**Files:**
- Create: `src/lib/tracking/events.ts`
- Create: `src/lib/tracking/tracker.ts`
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/commerce/types.ts`
- Create: `src/lib/search/types.ts`
- Create: `src/store/learner/types.ts`
- Create: `src/components/commerce/AdPlaceholder.tsx`
- Create: `src/components/commerce/AffiliateButton.tsx`

**Interfaces:**
- Future providers depend on stable internal contracts, not vendor APIs.
- Placeholder components have no external side effects.

- [ ] **Step 1: Define provider-neutral interfaces.**
- [ ] **Step 2: Add inert UI placeholders where the architecture requires future insertion points.**
- [ ] **Step 3: Verify no payment, analytics, AI, or CMS dependency is introduced.**

---

### Task 7: Validation and handoff

**Files:**
- Modify: `docs/architecture/SAJIB_ATLAS_V10_ARCHITECTURE.md`
- Create: `CURRENT_STATE.md`

- [ ] **Step 1: Run lint.**
- [ ] **Step 2: Run TypeScript validation.**
- [ ] **Step 3: Run production build.**
- [ ] **Step 4: Perform route smoke checks for `/`, `/subjects`, `/topics`, and the canonical topic.**
- [ ] **Step 5: Record actual results and remaining blockers in `CURRENT_STATE.md`.**
- [ ] **Step 6: Review the diff for legacy leakage, unnecessary dependencies, and architecture drift.**

---

## Reset Completion Criteria

The reset is complete when the active tree contains one coherent application architecture, the canonical topic flows through the normalized content adapter, legacy route/component duplication is gone, future integrations have explicit boundaries but no premature infrastructure, and lint/TypeScript/build plus route smoke checks have been run and recorded.
