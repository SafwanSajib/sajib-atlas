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

# SECURITY.md — V10.6 SECURITY CONSTITUTION

## 1. Security Objective

Protect:

- identity
- authentication
- authorization
- user data
- proprietary content
- answer keys
- payment/entitlement state
- institutional data
- creator data
- AI usage
- secrets

## 2. Threat Areas

Consider:

- XSS
- injection
- CSRF where relevant
- SSRF
- IDOR
- privilege escalation
- insecure uploads
- data leakage
- scraping
- abuse automation
- referral fraud
- leaderboard manipulation
- prompt injection
- retrieval poisoning
- tool abuse
- AI cost attacks
- entitlement manipulation

## 3. Authorization

Use server-authoritative authorization for protected operations.

Canonical learner identity is internally controlled. The local identity is
`learner/local`. Email, phone, OAuth/provider subject, session tokens, and
access tokens must never become the canonical `learnerId`. Authentication
is not implemented in Phase 7A. Public identity reads omit secrets,
credentials, and provider subjects.

Protected access is fail-closed. Entitlement is the access authority.
Payment events, purchase claims, and client-supplied flags must not grant
access. Public catalog resources remain freely readable without
authentication. Entitlement records must not carry secrets, tokens, or
payment instruments.

Commerce payments must never store card numbers, CVV, passwords, API keys,
or raw provider payloads. `providerReference` is opaque. Public payment
reads omit provider internals. A captured payment is not an access grant.

Phase 7D confirms: Identity is not authentication; Entitlement is the
access authority; Commerce proposes grants only; client UI cannot authorize
identity, entitlement, purchase, or payment.

Phase 9A: Web/Android/iOS clients consume Phase 8 contracts. A client
cache is not access. Device id is not `learnerId`. Push (future) is
navigation only, not a grant. Notes: `docs/MOBILE.md`.

Never assume:

- hidden UI
- client-side checks
- obscured endpoints
- disabled buttons

are security controls.

## 4. Commerce Security

Keep separate:

**PAYMENT EVENT → PURCHASE → ENTITLEMENT → ACCESS**

Verify provider events and reconcile state.

Never grant durable paid access solely because a client claims payment success.

## 5. AI Security

AI systems require:

- input validation
- prompt-injection resistance
- retrieval trust boundaries
- tool permission boundaries
- output validation where necessary
- usage limits
- cost controls
- logging
- sensitive-data controls

Do not allow AI to autonomously perform irreversible high-impact actions
without appropriate authorization.

## 6. Community Safety

Protect against:

- spam
- harassment
- misinformation
- malicious links
- impersonation
- coordinated abuse
- reputation manipulation

Use rate limits, moderation, reputation, anomaly detection, and reporting.

## 7. Creator / Content Security

Creator content must have:

- ownership/provenance handling
- moderation
- entitlement controls
- abuse reporting
- access control

Paid content protection must not rely on client-side hiding.

## 8. Institutional Security

When multi-tenancy is implemented:

- enforce tenant isolation
- role-based access
- least privilege
- audit logs
- secure exports
- administrative boundaries

## 9. Privacy

Collect only what is justified.

Use privacy-safe aggregation for social proof and rankings.

Users should control optional public sharing.

## 10. Backups & Recovery

Critical systems require:

- backup
- restore
- rollback
- migration safety
- disaster recovery planning

## 11. Security Verification

Security claims require evidence.

Never claim:

> “100% secure.”

Use:

**THREAT MODEL → CONTROL → TEST → MONITOR → IMPROVE**
