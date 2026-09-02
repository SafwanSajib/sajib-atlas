# Entitlement & Access Foundation (Phase 7B)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/entitlement/`  
**Verifier:** `npm run verify:phase7b`

Entitlement is the access-grant record. Access evaluation is a pure
decision over resource identity, learner identity, entitlements, and
time. It is not payment, authentication, or persistence.

```text
Resource
        ↓
Access Classification  (public | protected)
        ↓
Entitlement Evaluation  (exact scope + targetId)
        ↓
Access Decision
```

## Authority

Phase 1H contracts remain canonical:

- id: `entitlement/{scope}/{targetId}`
- scopes: `feature` | `subject` | `topic` | `assessment_set`
- status: `active` | `expired` | `revoked`
- source: `free` | `manual` | `purchase` | `subscription` | `promotional`

Learner identity is Phase 7A `learner/local`.

## Public vs protected

Current catalog subjects, topics, and assessment sets are **public**.
`decideAccess` returns `{ allowed: true, reason: "free", classification: "public" }`
with no entitlements and no authentication.

Features are **protected**. No valid entitlement → `allowed: false`,
`reason: "missing"` (entitlement required).

## Matching

Exact `scope` + `targetId`. No subject → all topics, no topic → all
assessment sets.

## Ownership

If `entitlement.learnerId` is present it must equal the current
`learnerId`. Otherwise deny. Entitlements without `learnerId` keep the
Phase 1H behavior.

## Time

Inclusive window: `startsAt <= now <= expiresAt`.

- before `startsAt` → deny
- after `expiresAt` → deny
- `expiresAt < startsAt` → validation reject
- protected window with no injectable `now`/`asOf` → deny

## Fail closed

Malformed, expired, revoked, wrong learner, wrong target, wrong scope,
and payment-like records do not grant access.

## Future commerce

```text
Product → Order → Purchase → Entitlement → Access
```

Phase 7B stops at Entitlement → Access. `proposeEntitlementGrant` is a
proposal contract only. Payment state cannot authorize.

## What it does not do

- Payment, checkout, subscriptions, paywalls
- Authentication, sessions, JWT
- Database or entitlement persistence
- HTTP `/api` routes or UI gating
- AI, Search, or learner-state mutation
