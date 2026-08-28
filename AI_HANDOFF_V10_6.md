# SAJIB ATLAS — V10.6 AI HANDOFF

## READ FIRST

This handoff is the entry point for any AI coding/development agent working
on the Sajib Atlas repository.

Read the documentation in this order:

1. `AGENTS.md`
2. `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
3. `ARCHITECTURE.md`
4. `CURRENT_STATE.md`
5. `DEVELOPMENT_RULES.md`
6. `ROADMAP.md`
7. `SECURITY.md`
8. `DOCUMENT_MAP.md`
9. `README.md`

Then inspect the repository itself.

The repository/runtime/tests are the implementation source of truth.
The Master Vision is the strategic North Star.

---

# 1. DOCUMENTATION BASELINE

**Documentation Baseline: V10.6**

All documents in the active documentation set must remain synchronized to
V10.6 unless a deliberate version migration is being performed.

Canonical set:

```text
AGENTS.md
SAJIB_ATLAS_Universal_Master_Vision_v10_6.md
ARCHITECTURE.md
CURRENT_STATE.md
DEVELOPMENT_RULES.md
ROADMAP.md
DOCUMENT_MAP.md
SECURITY.md
README.md
AI_HANDOFF_V10_6.md
```

Do not silently introduce V10.4, V10.5, or older architecture references.

If the architecture version changes, update the complete documentation graph.

---

# 2. SOURCE-OF-TRUTH RULE

Use this authority order:

1. Repository/runtime/test evidence
2. Current implementation and data contracts
3. `CURRENT_STATE.md`
4. `ARCHITECTURE.md`
5. `DEVELOPMENT_RULES.md`
6. `SECURITY.md`
7. `ROADMAP.md`
8. `DOCUMENT_MAP.md`
9. `AGENTS.md`
10. `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`

The Master Vision defines the intended destination.

It does NOT prove that a feature is currently implemented.

Never convert planned functionality into a claim of existing functionality.

---

# 3. PRODUCT CONSTITUTION

Sajib Atlas is an AI-native, multi-platform knowledge and learning ecosystem
connecting:

**Knowledge + Learning + Assessment + Research + Discovery + AI +
Personalization + Community + Commerce + Institutions**

It is not merely:

- a BCS website
- an MCQ website
- a notes platform
- an AI chatbot
- a blog
- a mobile app
- a marketplace

The long-term platform equation is:

**ONE CORE PLATFORM → MANY EXPERIENCES → MANY MARKETS → MANY REVENUE STREAMS**

The strategic system is:

**KNOWLEDGE → CONTEXT → LEARNING → PRACTICE → ASSESSMENT → PERSONALIZATION → ACTION → VALUE**

---

# 4. MULTI-PLATFORM CONSTITUTION

Web, Android, and iOS are client surfaces over one platform.

```text
WEB
ANDROID
iOS
  ↓
SHARED PLATFORM CONTRACTS
  ↓
DOMAIN + DATA + ENTITLEMENT + AI + ANALYTICS
```

Do not create:

- duplicated user systems
- duplicated subscription logic
- duplicated scoring logic
- duplicated canonical knowledge
- duplicated AI business logic

Business logic must not become trapped inside one client.

The current implementation priority remains Web.

Mobile is a future client target that must be architecturally enabled without
prematurely building unnecessary infrastructure.

---

# 5. ARCHITECTURE CONSTITUTION

Preferred foundation:

**MODULAR MONOLITH + API-READY DOMAIN BOUNDARIES + MOBILE-READY CONTRACTS**

Core domains include:

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

Do not introduce microservices simply because future scale is anticipated.

Extract services only when there is a demonstrated operational, security,
organizational, or scalability reason.

---

# 6. KNOWLEDGE CONSTITUTION

Core model:

**CORE KNOWLEDGE → CONTEXT → EXPERIENCE**

Knowledge is reusable.

```text
CANONICAL KNOWLEDGE
      ↓
BCS / IELTS / UNIVERSITY / RESEARCH / PROFESSIONAL
      ↓
CONTEXT-SPECIFIC EXPERIENCE
```

A subject is not an exam.

An exam is not a subject.

A language is not a separate copy of the same concept.

Avoid unnecessary duplication of canonical knowledge.

---

# 7. LEARNING + ASSESSMENT INTELLIGENCE

The platform should eventually connect:

**GOAL → CURRICULUM → PROGRESS → ACCURACY → SPEED → WEAKNESS → MEMORY → RECOMMENDATION**

Assessment should support:

- topic practice
- exam practice
- random practice
- timed practice
- mock exams
- adaptive practice
- mistake review
- spaced repetition
- confidence-based practice
- weak-topic queues

Personalization may use:

- accuracy
- response time
- confidence
- error patterns
- revision history
- mastery

The objective is durable learning, not decorative analytics.

---

# 8. AI CONSTITUTION

AI is an assistive intelligence layer, not an uncontrolled authority.

Preferred flow:

**AUTH → ENTITLEMENT → RATE LIMIT → RETRIEVE → GENERATE → VERIFY → LOG**

Potential AI products:

- AI Study Assistant
- Screenshot → Question Solver
- AI Explanation
- Personalized Revision
- AI Study Planner
- Viva Simulator
- IELTS Speaking Evaluator
- Research Assistant
- Document Analysis

Never fabricate:

- sources
- citations
- official facts
- exam information
- payment state
- institutional information

Every expensive AI capability requires usage and cost controls.

---

# 9. COMMERCE + ENTITLEMENT CONSTITUTION

Always distinguish:

**PAYMENT EVENT ≠ PURCHASE ≠ ENTITLEMENT ≠ FEATURE ACCESS**

Commercial access must be based on verified entitlement state.

Potential revenue layers:

1. Freemium
2. B2C Premium
3. AI Monetization
4. Exam Products
5. Creator / Resource Commerce
6. Professional
7. Institutional Licensing
8. B2B / API
9. Legitimate Affiliate / Referral Commerce

The business goal is diversified recurring and transactional revenue from
the same reusable infrastructure.

Revenue growth must not override trust, security, or unit economics.

---

# 10. COMMUNITY CONSTITUTION

Future community systems may include:

- study groups
- peer doubt solving
- Q&A
- Study Squads
- contributor reputation
- moderation
- collaborative revision

Important rule:

**COMMUNITY CONTENT ≠ CANONICAL VERIFIED KNOWLEDGE**

Preferred correction flow:

**REPORT → TRIAGE → SOURCE CHECK → REVIEW → CORRECTION → VERSIONING → AUDIT**

User reports must not directly mutate canonical knowledge.

---

# 11. RESPONSIBLE GROWTH CONSTITUTION

Growth mechanisms may include:

- Micro-Wins
- commitment cards
- verified social proof
- streaks
- badges
- progress graphics
- contextual rankings
- two-sided referrals
- Study Squad loops
- creator/community loops

Preferred growth equation:

**VALUE → SUCCESS → IDENTITY → OPTIONAL SHARING → DISCOVERY → ACTIVATION → VALUE**

Behavioral science may improve motivation and product discovery.

It must not be used to create psychological dependency.

Never implement:

- fake scarcity
- fake user counts
- fake rankings
- deceptive paywalls
- forced sharing
- shame-based retention
- hidden cancellation
- notification spam

The user should remain in control.

---

# 12. VIRAL LOOP CONSTITUTION

Five long-term loops:

```text
ACHIEVEMENT
LEARN → ACHIEVE → SHARE → DISCOVERY → NEW USER

REFERRAL
USER → INVITE → ACTIVATION → REWARD → NEW USER

SQUAD
SQUAD → COLLABORATION → PROGRESS → REWARD → INVITATION

COMMUNITY
QUESTION → ANSWER → REPUTATION → DISCOVERY → CONTRIBUTION

CREATOR
CREATE → PUBLISH → DISCOVER → PURCHASE → CREATOR REWARD → MORE CREATION
```

Measure qualified acquisition, not raw invitations.

Potential metrics:

- K-factor
- invite conversion
- share-to-signup
- activation
- squad retention
- referral conversion
- creator activation

---

# 13. GAMIFICATION CONSTITUTION

Gamification may include:

- streaks
- milestones
- badges
- levels
- challenges
- leaderboards
- points
- group goals

Reward meaningful learning behavior.

Do not optimize for screen time as the primary objective.

**RETENTION ≠ ADDICTION**

Learning gain, mastery, retention, satisfaction, and productive session quality
are more important than raw engagement volume.

---

# 14. HUMAN FRESHNESS + REFLECTION LAYER

Sajib Atlas may eventually include a distinct human-facing layer for:

- literature
- art
- culture
- nature
- philosophy
- creativity
- curiosity
- reflective writing
- life skills
- personal growth
- contemplative content

Optional reflection/spirituality experiences may support:

- meaning
- gratitude
- resilience
- ethical living
- contemplation
- philosophical inquiry
- spiritual exploration

The platform must remain pluralistic and must not pressure users toward a
particular worldview.

This layer exists to support a healthier relationship with learning and life,
not to create another engagement trap.

---

# 15. ACCESSIBILITY + LOCALIZATION

Accessibility is a first-class requirement.

Consider:

- semantic HTML
- keyboard navigation
- screen-reader support
- accessible forms
- contrast
- scalable text
- reduced motion
- focus management
- captions/transcripts
- alternative text
- color-independent state communication

Internationalization should be architectural.

Potential language layers:

- Bangla
- English
- Hindi
- future strategically justified languages

Keep:

**CONTENT / LANGUAGE / LOCALE / CULTURAL CONTEXT / EXAM CONTEXT**

conceptually separate.

---

# 16. SECURITY CONSTITUTION

Protect:

- identity
- authorization
- user data
- proprietary content
- answer keys
- payment state
- entitlements
- institutional data
- creator data
- AI usage
- secrets

Consider:

- XSS
- injection
- SSRF
- IDOR
- privilege escalation
- insecure uploads
- data leakage
- scraping
- prompt injection
- retrieval poisoning
- tool abuse
- AI cost attacks
- referral fraud
- leaderboard manipulation

Never treat client-side hiding as a security boundary.

Never claim 100% security.

Security is:

**THREAT MODEL → CONTROL → TEST → MONITOR → IMPROVE**

---

# 17. CURRENT DEVELOPMENT RULE

The current repository is the reality.

Before making meaningful changes:

1. inspect repository
2. inspect current documentation
3. inspect current state
4. understand existing behavior
5. identify affected contracts
6. design the smallest reusable change
7. implement incrementally
8. test
9. verify runtime behavior
10. update documentation if reality changed

Do not rebuild working functionality merely because the Master Vision describes
a more advanced future state.

---

# 18. FIRST MISSION FOR A NEW AI AGENT

Do NOT immediately generate large amounts of content or pages.

First:

1. audit the repository
2. verify the V10.6 documentation chain
3. inspect package/tooling configuration
4. determine the current application boundary
5. read `CURRENT_STATE.md`
6. identify what is actually implemented
7. identify the smallest production-grade next step
8. implement one coherent end-to-end improvement
9. test/build it
10. verify it
11. update `CURRENT_STATE.md`
12. report evidence

The objective is not to recreate an old application.

The objective is to progressively build the platform described by V10.6 while
preserving repository reality.

---

# 19. DOCUMENT SYNCHRONIZATION RULE

If a development change affects architecture, product state, security, or
roadmap:

```text
CHANGE
 ↓
IMPLEMENT
 ↓
VERIFY
 ↓
UPDATE AFFECTED DOCS
 ↓
CHECK CROSS-REFERENCES
 ↓
FINAL REPORT
```

At minimum, review:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DOCUMENT_MAP.md`

For security-sensitive changes also review:

- `SECURITY.md`
- `AGENTS.md`
- `DEVELOPMENT_RULES.md`

Never leave contradictory version names or architecture descriptions.

---

# 20. DEFINITION OF DONE

A meaningful feature is not done merely because code exists.

Done means:

- implementation exists
- intended behavior is tested
- build/type checks pass where applicable
- runtime behavior is verified
- security implications are considered
- accessibility implications are considered where relevant
- performance implications are considered where relevant
- documentation is synchronized when required
- `CURRENT_STATE.md` reflects reality

Report evidence.

Do not report assumptions as completion.

---

# 21. FINAL HANDOFF PRINCIPLE

The AI agent should think in this order:

**UNDERSTAND → INSPECT → DESIGN → IMPLEMENT → TEST → AUDIT → VERIFY → DOCUMENT → REPORT**

And the platform should evolve in this order:

**WEB FOUNDATION → SHARED PLATFORM CONTRACTS → LEARNING INTELLIGENCE → AI → RESPONSIBLE GROWTH → MOBILE → COMMERCE EXPANSION → COMMUNITY → CREATOR → INSTITUTIONAL → B2B/API**

The exact sequence may change when repository evidence, user demand, economics,
security, or operational constraints justify it.

---

# 22. FINAL NORTH STAR

> **Build the reusable machine once.**
>
> **Distribute it across Web, Android, and iOS.**
>
> **Connect knowledge, learning, assessment, AI, community, research, and commerce.**
>
> **Grow through genuine user value and responsible viral loops.**
>
> **Monetize value at multiple layers.**
>
> **Protect trust, privacy, security, and learning quality.**
>
> **Scale only when evidence justifies scale.**

**SAJIB ATLAS V10.6 — ONE PLATFORM, MANY EXPERIENCES, MANY MARKETS, MANY REVENUE STREAMS.**
