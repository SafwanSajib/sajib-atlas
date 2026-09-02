# Phase 7 Integration Gate (Phase 7D)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/phase7/`  
**Verifier:** `npm run verify:phase7`

Phase 7D does not add a domain. It hardens and composes:

- 7A Identity — `src/lib/identity/`
- 7B Entitlement & Access — `src/lib/entitlement/`
- 7C Commerce — `src/lib/commerce/`

```text
Authentication (not implemented)
        ↓
Identity Resolution
        ↓
Canonical Learner Identity  (learner/local)
        ↓
Learner / Goals / Intelligence

Product → Order → Purchase → Grant Proposal → Entitlement → Access
Order → Payment   (never grants access)
```

## Authorities

| Concept | Canonical module |
| --- | --- |
| LearnerIdentity | `src/lib/identity/types.ts` |
| Entitlement / AccessDecision | `src/lib/entitlement/` |
| Product / Order / Purchase / Payment | `src/lib/commerce/types.ts` |

## Allowed dependencies

Identity → Learner  
Commerce → Entitlement  
Entitlement → Access  

## Forbidden

Payment → Access  
Entitlement → Commerce  
Topic Engine / Assessment / Search / AI → authorization authority  
Client UI → identity / entitlement / commerce authority  

## What it does not do

Authentication, database, payment processing, checkout, API routes,
mobile, or Phase 8.
