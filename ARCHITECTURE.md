# SAJIB ATLAS — DOCUMENT CONTROL

**Architecture Baseline:** V10.6  
**Master Vision:** `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`  
**Document Set:** V10.6  
**Status:** Active / synchronized  
**Repository:** Implementation source of truth  
**Authority Rule:** Repository/runtime/test evidence overrides strategic assumptions.

> This document is part of the V10.6 documentation constitution. If a document
conflicts with the Master Vision, the conflict must be resolved explicitly and
the affected documents must be synchronized. Do not silently maintain divergent
versions.

# ARCHITECTURE.md — V10.6 PLATFORM ARCHITECTURE

## 1. Target Model

```text
WEB / ANDROID / iOS
        ↓
EXPERIENCE LAYER
        ↓
DOMAIN PLATFORM
        ↓
INTELLIGENCE
        ↓
PLATFORM SERVICES
        ↓
DATA
        ↓
INFRASTRUCTURE
```

## 2. Experience Layer

- Study
- Practice
- Mock
- Research
- AI
- Community
- Creator
- Institution
- Commerce

## 3. Domain Layer

```text
identity
knowledge
taxonomy
assessment
learning
progress
personalization
search
ai
commerce
entitlements
research
resources
creator
institution
community
growth
analytics
notifications
```

## 4. Knowledge Model

```text
Discipline
  → Subject
    → Topic
      → Concept
        → Theory
          → Application
            → Question
            → Resource
            → Source
```

Canonical knowledge should be addressable independently of exam context.

## 5. Assessment Model

Question metadata should be extensible for:

- country
- examination
- institution
- year
- subject
- topic
- concept
- difficulty
- type
- language
- source
- explanation
- trap
- tags

Practice modes:

- topic
- exam
- random
- timed
- mock
- adaptive
- mistake review
- spaced repetition
- confidence-based

## 6. Learning & Personalization

```text
GOAL → CURRICULUM → PROGRESS → ACCURACY → SPEED → WEAKNESS → MEMORY → RECOMMENDATION
```

Personalization may use confidence, accuracy, speed, errors, and revision
history.

## 7. Community Architecture

```text
QUESTION
→ PEER / AI RESPONSE
→ RATING
→ MODERATION
→ VERIFIED KNOWLEDGE CANDIDATE
```

Community reputation and canonical knowledge trust must remain separate.

## 8. Growth Architecture

```text
LEARN
→ ACHIEVE
→ MICRO-WIN
→ OPTIONAL SHARE
→ DISCOVERY
→ ACTIVATION
→ LEARNING
```

Referral, squad, creator, and community loops are secondary growth systems
built around genuine value.

## 9. Commerce Architecture

```text
PLAN / PURCHASE / LICENSE
          ↓
      ENTITLEMENT
          ↓
      FEATURE ACCESS
```

Payment providers sit behind a commerce abstraction.

## 10. AI Cost Architecture

```text
REQUEST
→ AUTH
→ ENTITLEMENT
→ RATE LIMIT
→ MODEL ROUTING
→ RETRIEVAL
→ INFERENCE
→ USAGE LOG
→ COST ATTRIBUTION
```

## 11. Institutional Architecture

```text
Organization
├── Departments
├── Admins
├── Teachers
├── Learners
├── Content
├── Licenses
├── Analytics
└── Policies
```

Tenant isolation is mandatory when institutional functionality is implemented.

## 12. Mobile Contract Principle

Mobile clients consume shared platform contracts. Business logic must not be
reimplemented separately in Android/iOS.

## 13. Architecture Evolution

Start with a modular monolith.

Extract services only when justified by:

- scale
- reliability
- organizational ownership
- security boundary
- independent deployment needs
- measurable operational benefit
