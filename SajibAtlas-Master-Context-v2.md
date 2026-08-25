# SajibAtlas Master Context Document v2

## 1. Project Identity
- **Project:** SajibAtlas
- **Domain:** `sajibatlas.com`
- **GitHub:** `https://github.com/SafwanSajib/sajib-atlas`
- **Main branch:** `main`
- **Development branch:** `phase4-mcq`
- **Stack:** Next.js + TypeScript + existing CSS/Tailwind setup
- **Current hosting:** Vercel, but the architecture must remain hosting-independent.

### Infrastructure status
- Domain registered and secured.
- `sajibatlas.com` and `www.sajibatlas.com` connected to Vercel.
- Auto-renew ON.
- WHOIS privacy enabled.
- **DNSSEC ACTIVE.**
- Cloudflare account has active 2FA.
- `prerender.txt` is ignored by Git.
- Latest relevant Git checkpoint: `65d7db3 chore: ignore Next.js prerender metadata`.
- **Infrastructure is DONE. Do not revisit it unless an actual problem appears.**

---

## 2. Core Vision

SajibAtlas is a **Knowledge, Growth & Commerce Ecosystem**, not merely an MCQ site.

```text
LEARN → GROW → DISCOVER → COMMERCE
```

**Learn:** BCS, IELTS, concepts, MCQs, written preparation.  
**Grow:** skills, reflection, inner growth.  
**Discover:** editorials, books, analysis.  
**Commerce:** PRO, ads, affiliate, digital products, courses, software/tools, future publications.

Learner trust and learning quality remain primary.

---

## 3. Academic & Exam Intelligence

Initial ecosystem:
- Geography & Environment
- Bangladesh Affairs
- International Affairs
- English
- Bengali
- Science & ICT
- Ethics & Good Governance
- BCS Written
- IELTS

Planned:
- BN/EN toggle
- MCQ practice
- BCS Trap
- Misconceptions
- Explanations
- Written points
- Quick Revision
- Weakness tracking
- Mock tests
- Streaks, points, leaderboard

---

## 4. Premium Content Hub

Future verticals:
- Editorial Digest
- Newspaper/editorial analysis
- BCS Written analysis
- IELTS-oriented analysis
- Storytelling book reviews
- Knowledge articles
- Spiritual / Inner Growth
- Human-centered reflection and personal growth

These use the same core content architecture rather than separate mini-sites.

---

# 5. Master Revenue Model

SajibAtlas should support both **active and passive income**, while keeping education and trust primary.

## 5.1 SajibAtlas PRO

**Free:** basic learning, MCQs, selected revision/resources/articles.

**PRO:** potential future Live Mock Tests, advanced BCS Traps, Weakness Tracker, advanced analytics, premium content, ad-free experience.

Payment/backend is NOT Phase 1/2 work.

## 5.2 Advertising

Future:
- Google AdSense or equivalent
- Non-intrusive placements
- Mobile-safe ad slots
- Reading-first design

Phase 1/2 should support:

```tsx
<AdPlaceholder />
```

Actual ad integration comes later.

## 5.3 Affiliate Commerce

Potential providers:
- Rokomari
- Amazon
- Other legitimate affiliate programs

Future:
```tsx
<AffiliateButton />
<ProductCard />
<BuyCTA />
```

Only UI/placement architecture is needed initially.

## 5.4 Digital Products

Future:
- Digital eBooks
- PDF guides
- BCS revision packs
- IELTS resources
- Premium study materials
- Templates
- Other downloadable educational products

Conceptual architecture:

```text
Digital Product
   ↓
Product Page
   ↓
Purchase / Access
   ↓
Secure Delivery
```

Access control and payment are future-phase work.

## 5.5 Premium Courses

Future:
- Video courses
- Crash courses
- Specialized BCS courses
- IELTS courses

```text
Course
 ├── Curriculum
 ├── Modules
 ├── Lessons
 ├── Progress
 └── Access Level
```

## 5.6 Technology & Software Products

Future:
- Productivity tools
- Study utilities
- Digital software
- Exam-preparation tools
- AI-assisted learner utilities

Keep these as a separate commerce/product layer.

## 5.7 Own Publication / Store

Long-term:
- SajibAtlas books
- Own publication
- Digital products
- Physical products
- Direct sales

---

# 6. Architecture Principles

## Content/Component Separation

```text
Content Source
    ↓
Normalized Content Model
    ↓
Reusable Components
    ↓
Page
```

Never embed large content bodies directly inside UI components.

## CMS Readiness

Current sources may be TypeScript/JSON. Architecture must support MDX and future headless CMS such as Sanity/Strapi.

```text
TS/JSON ┐
MDX     ├→ Content Adapter → Normalized Content → UI
CMS     ┘
```

Do not install a CMS prematurely.

## Hosting Independence / No Vendor Lock-in

Core code must remain portable to AWS, Google Cloud, DigitalOcean, or other Node/Next.js-compatible hosting.

Avoid Vercel-only business logic. If a Vercel-specific feature is introduced, isolate it behind an adapter/integration boundary and document it.

## Rendering

```text
Static / Pre-rendered
        ↓
Fast load
        ↓
SEO
        ↓
ISR where useful
        ↓
Client interaction only where required
```

Prefer Server Components. Use Client Components for MCQs, theme/language toggles, filters and dashboards.

## Global State

Target:
```text
src/store/
```

Start with React Context for small global state; add Zustand only when complexity justifies it.

## Analytics

Target:
```text
src/lib/tracking/
```

Potential events:
- Topic view
- MCQ answer
- Correct/wrong answer
- Search
- Article view
- Book CTA
- Affiliate CTA
- PRO CTA
- Mock completion
- Revision
- Product purchase
- Course enrollment

Use a provider-neutral abstraction. Future providers may include Google Analytics or PostHog.

---

# 7. AI Agents & Automation Pipeline

## Development Automation

Future-compatible tools:
- Cursor
- Windsurf
- GitHub Copilot
- GitHub AI agents
- Devin or similar agents

Preferred workflow:

```text
Task
 ↓
AI Agent / Developer
 ↓
Feature Branch
 ↓
Code Generation
 ↓
Lint / Build / Tests
 ↓
Vercel Preview
 ↓
Human Review
 ↓
Merge to main
 ↓
Production
```

Rules:
- Agents do not work directly on production.
- Changes must be reviewable.
- Secrets must never be unnecessarily exposed.
- Automated changes should pass applicable checks.
- Agents must follow this Master Context Document.

## AI Content Generation Pipeline

Potential specialized agents:
- Research Agent
- Content Writer Agent
- MCQ Agent
- Fact Checker
- BCS Relevance Agent
- Language/Editing Agent
- SEO Agent
- MDX/JSON Formatting Agent

Pipeline:

```text
Topic Queue
     ↓
Research / Source Collection
     ↓
Content Generation
     ↓
MCQ Generation
     ↓
Fact / Consistency Check
     ↓
Formatting
     ↓
MDX / JSON
     ↓
Human Review
     ↓
Audit
     ↓
Publish
```

**AI-generated content is never automatically publishable. Human review remains mandatory for high-impact factual, exam, historical, statistical and current-affairs material.**

> **Automate repetition, not responsibility.**

---

# 8. Target Folder Architecture

```text
src/
├── app/
│   ├── page.tsx
│   ├── topics/
│   ├── subjects/
│   ├── articles/
│   ├── books/
│   └── ...
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── content/
│   ├── learning/
│   ├── assessment/
│   ├── editorial/
│   ├── commerce/
│   └── shared/
├── content/
│   ├── geography/
│   ├── bangladesh/
│   ├── international/
│   ├── english/
│   ├── science/
│   └── ...
├── data/
│   ├── topics/
│   ├── mcqs/
│   └── ...
├── lib/
│   ├── content/
│   │   ├── mdx/
│   │   ├── loaders/
│   │   └── adapters/
│   ├── seo/
│   ├── tracking/
│   └── utils/
├── store/
│   ├── language/
│   ├── theme/
│   └── ...
├── types/
│   ├── content.ts
│   ├── topic.ts
│   ├── mcq.ts
│   └── ...
└── styles/
    ├── globals.css
    └── tokens.css
```

This is the target architecture, not a blind migration instruction.

---

# 9. Component System

Potential reusable components:

```text
TopicHero
ConceptCard
FactGrid
TermList
MisconceptionCard
RelatedTopics
QuickRevision
WrittenPointCard
MCQPractice
MCQOption
FeedbackCard
BCSTrapCard
EditorialCard
EditorialDigest
QuoteBlock
AnalysisBlock
AdPlaceholder
AffiliateButton
ProductCard
BuyCTA
AnalyticsPlaceholder
LanguageToggle
ThemeToggle
```

Future commerce components remain independent of learning components.

---

# 10. UI System v1

## Typography
- Bangla: Hind Siliguri / Noto Sans Bengali
- Editorial Bangla may use Tiro Bangla
- English: Inter
- Prioritize reading comfort, responsive scale, line-height and hierarchy.

## Color
Light: white/off-white, light gray, deep text, restrained primary brand color, semantic states.

Dark: deep background, layered surfaces, soft text, same brand identity.

Avoid noisy/neon coaching-site aesthetics.

## Mobile-first

```text
Mobile → Tablet → Desktop
```

Requirements:
- Comfortable touch targets
- No horizontal overflow
- Excellent MCQ UX
- Fast rendering
- Screenshot-friendly Quick Revision
- Responsive navigation/type

---

# 11. Strict Development Rules

1. No arbitrary direct CSS.
2. No unnecessary inline styling.
3. Separate content from presentation.
4. Use design tokens/reusable classes.
5. Mobile-first.
6. Accessibility from the beginning.
7. Do not over-engineer future features.
8. Avoid unnecessary dependencies.
9. No vendor lock-in in core logic.
10. No blind mass refactoring.
11. Preserve working functionality unless justified.
12. Test before merging to `main`.
13. AI-generated code must be reviewable.
14. AI-generated content requires human review before publication.
15. Production is never the first testing environment.
16. Monetization must not degrade learning quality.

---

# 12. Master Content Template

First master topic:

**পৃথিবীর গতি / Motions of the Earth**

```text
Topic Hero
↓
Bangla Summary
↓
English Summary
↓
Core Concept
↓
Mechanism / How It Works
↓
Key Facts
↓
Key Terms
↓
Examples
↓
Misconceptions
↓
MCQ Practice
↓
Explanation
↓
BCS Trap
↓
Written Points
↓
Geography Connection
↓
Related Topics
↓
Quick Revision
```

Learning philosophy:

```text
LEARN → UNDERSTAND → DETECT MISCONCEPTION → SOLVE → APPLY → REVISE
```

---

# 13. Master Workflow: Phase 1–7

## Phase 1 — UI System v1
Audit current styling, fonts, colors, spacing and components; establish design tokens, typography, light/dark themes, responsive breakpoints, accessibility and placeholder boundaries for ads/commerce/analytics. Refactor only where justified.

**Deliverable:** UI System v1.

## Phase 2 — Component System
Build reusable layout, navigation, content, learning, assessment, editorial placeholders, commerce placeholders, analytics abstraction, language and theme foundations.

**Deliverable:** Reusable Component Library.

## Phase 3 — Master Content
Use “পৃথিবীর গতি”; apply full schema; build topic page; integrate MCQ, BCS Trap, Misconception, Written Points, Quick Revision, related topics; test mobile.

**Deliverable:** One gold-standard Geography topic.

## Phase 4 — Scale & Validation
Create several Geography topics; test consistency, performance, responsiveness, bilingual structure and MCQ consistency; test a small AI-generated content batch.

**Deliverable:** Validated Content System.

## Phase 5 — Content Expansion
Scale to Bangladesh Affairs, International Affairs, English, Bengali, Science & ICT, Ethics and IELTS only after quality controls are validated.

**Deliverable:** Multi-subject Knowledge Base.

## Phase 6 — Growth & Monetization Foundations
Editorial, Book Reviews, Inner Growth, Search, Gamification, PRO UI, Ad slots, Affiliate CTAs, Analytics, Weakness tracking, Mock tests, Digital Products, Premium Courses, Software/Tools.

Backend/payment/access control is added only when requirements are concrete.

**Deliverable:** Growth & Monetization Layer.

## Phase 7 — Audit, SEO & Public Launch
Content audit, AI-content review, technical QA, accessibility, performance, routing, 404, domain/HTTPS, sitemap, metadata, structured data, internal linking, SEO, monitoring and final launch.

**Deliverable:** Public-ready SajibAtlas.

---

# 14. Current Project Status

Approximate project-management estimates:

```text
Infrastructure           98%
Application Foundation  75%
MCQ Foundation          75%
UI System               40%
Master Content          20%
Full Content Library    10–15%
Content Audit           10%
Final Product           ~45%
```

Biggest bottlenecks:
1. UI System
2. Component System
3. Master Geography Page
4. Content quality/scaling
5. Audit

---

# 15. Immediate Next Step

Do not modify domain, Vercel or hosting configuration unless an actual issue appears.

Run:

```powershell
Get-ChildItem -Recurse -File -Include *.css,*.tsx,*.ts | Select-Object FullName
```

Then:

```text
CURRENT CODEBASE AUDIT
        ↓
KEEP / MODIFY / MOVE / CREATE
        ↓
UI SYSTEM v1
        ↓
COMPONENT SYSTEM
        ↓
MASTER GEOGRAPHY PAGE
```

No blind mass refactoring. No premature CMS. No payment system yet. No vendor-specific core logic. No large-scale content generation before the master template is validated.

---

# 16. Handoff Rule

Any future developer or AI assistant must read this document before modifying architecture.

Before a major change, verify:
1. Content/component separation.
2. Hosting portability.
3. Mobile-first behavior.
4. Design-token compliance.
5. No unnecessary vendor lock-in.
6. Current requirement is being solved.
7. Phase 1–7 workflow remains coherent.
8. Human review remains mandatory for high-impact content.
9. Monetization remains subordinate to learning quality.

---

# 17. Product Philosophy

> **A serious knowledge platform, not a noisy coaching website.**

SajibAtlas combines:

```text
Knowledge + Exam Intelligence + Growth + Discovery + Commerce + Automation
```

without allowing monetization or visual decoration to overpower learning.

Long-term loop:

```text
Learn → Practice → Understand → Revise
                 ↓
              Discover
                 ↓
                Grow
                 ↓
       Subscribe / Buy / Return
```

> **Build one excellent system, then scale it.**
>
> **Automate repetition, not responsibility.**
