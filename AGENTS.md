<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes ΓÇö APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` ΓÇö verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# ============================================
# SAJIB ATLAS V10.6 — AI DEVELOPMENT RULES
# ============================================
# SAJIB ATLAS — DOCUMENT CONTROL
**Architecture Baseline:** V10.6  
**Master Vision:** `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`  
**Document Set:** V10.6  
**Status:** Active / synchronized
Sajib Atlas is being developed as a reusable multi-platform knowledge,
learning, assessment, AI, community, research, and commerce ecosystem.
## DOCUMENTATION AUTHORITY
Read these documents before major implementation work:
1. `AI_HANDOFF_V10_6.md`
2. `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
3. `ARCHITECTURE.md`
4. `CURRENT_STATE.md`
5. `DEVELOPMENT_RULES.md`
6. `ROADMAP.md`
7. `SECURITY.md`
8. `DOCUMENT_MAP.md`
Repository/runtime/test evidence remains the implementation source of truth.
The Master Vision is the strategic North Star, not evidence that a feature
already exists.
## CORE ARCHITECTURE
Preferred architecture:
**MODULAR MONOLITH + API-READY DOMAIN BOUNDARIES + MOBILE-READY CONTRACTS**
Core domains:
- identity
- knowledge
- taxonomy
- assessment
- learning
- progress
- personalization
- search
- AI
- commerce
- entitlements
- notifications
- research
- resources
- creator
- institution
- community
- growth
- analytics
Do not introduce microservices without demonstrated need.
## MULTI-PLATFORM RULE
Web, Android, and iOS are clients of one shared platform.
Do not duplicate:
- authentication
- subscription logic
- entitlement logic
- scoring
- canonical knowledge
- AI business logic
Current priority:
**WEB → MOBILE-READY CORE → ANDROID → iOS → INSTITUTIONAL / B2B**
Phase 9A designs the client architecture (`docs/MOBILE.md`). Do not
add Android/iOS apps, React Native/Flutter, or native SDKs in 9A.
## KNOWLEDGE RULE
Canonical knowledge must be reusable.
**KNOWLEDGE ≠ EXAM ≠ PRESENTATION**
Do not duplicate the same canonical concept merely because it appears in
different exams, languages, or presentation surfaces.
## AI RULE
AI is an assistive intelligence layer.
Preferred flow:
**AUTH → ENTITLEMENT → RATE LIMIT → RETRIEVE → GENERATE → VERIFY → LOG**
Never fabricate sources, citations, official facts, payment state, or exam
information.
AI usage must have cost controls.
## COMMERCE RULE
Always distinguish:
**PAYMENT ≠ PURCHASE ≠ ENTITLEMENT ≠ FEATURE ACCESS**
Protected access must be server-authoritative.
## COMMUNITY RULE
Community content is not automatically canonical knowledge.
Preferred flow:
**REPORT → REVIEW → VERIFICATION → VERSIONING**
## GROWTH RULE
Growth must be value-led.
Allowed:
- Micro-Wins
- commitment cards
- verified social proof
- referrals
- Study Squads
- meaningful gamification
- shareable progress
- contextual rankings
Never implement:
- fake scarcity
- fake user counts
- fake rankings
- deceptive paywalls
- forced sharing
- shame-based retention
- hidden cancellation
## HUMAN WELL-BEING RULE
Sajib Atlas may eventually include literature, culture, nature, philosophy,
creativity, reflection, personal growth, and optional spirituality.
The purpose is healthier learning and human development.
**RETENTION ≠ ADDICTION**
Do not optimize for compulsive engagement.
## ACCESSIBILITY + LOCALIZATION
Accessibility and internationalization are architectural concerns.
Consider:
- semantic HTML
- keyboard navigation
- screen readers
- contrast
- scalable text
- reduced motion
- captions
- alternative text
- color-independent status
Keep:
**CONTENT / LANGUAGE / LOCALE / CULTURAL CONTEXT / EXAM CONTEXT**
conceptually separate.
## DEVELOPMENT PROTOCOL
Before changing code:
1. inspect repository
2. inspect current state
3. identify affected domain
4. understand existing behavior
5. preserve working functionality
6. make the smallest coherent change
7. test
8. verify
9. update documentation when reality changes
Do not rebuild working functionality simply because the Master Vision describes
a future capability.
## DEFINITION OF DONE
A feature is complete only when:
- implementation exists
- intended behavior is tested
- build/type checks pass where applicable
- runtime behavior is verified
- security implications are considered
- documentation is synchronized when required
- `CURRENT_STATE.md` reflects reality
## FINAL OPERATING PRINCIPLE
**UNDERSTAND → INSPECT → DESIGN → IMPLEMENT → TEST → AUDIT → VERIFY → DOCUMENT → REPORT**
