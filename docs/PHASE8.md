# Phase 8 Integration Gate (Phase 8E)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/platform/` and `src/app/api/v1/`  
**Verifier:** `npm run verify:phase8`

Phase 8E does not add a domain or product API. It audits:

- 8A design — `docs/PLATFORM.md`
- 8B contracts — `src/lib/platform/`
- 8C HTTP transport — `GET /api/v1/capabilities|identity|topics`
- 8D hardening — version, envelope, pagination, fail-closed access

```text
Client
  → HTTP transport          src/lib/platform/http.ts
    → Platform contracts    envelope / client / version / error / page / capabilities
      → Domain contracts    Phase 1E / 1J / 7A–7C
        → Existing engines  Topic, Assessment, Search, AI, Learner Intelligence,
                            entitlement.decideAccess
```

## Authorities

| Concept | Canonical module |
| --- | --- |
| Envelope / version / errors | Phase 1J `src/lib/contracts/api.ts` |
| Learner identity | `learner/local` in `src/lib/identity/` |
| Topic capabilities | Topic Engine `src/lib/topic-engine/` |
| Assessment scoring/delivery | Assessment Engine `src/lib/assessment-engine/` |
| Search retrieve/rank | `src/lib/search/` |
| Learner intelligence | `src/lib/learner-intelligence/` |
| AI experience HTTP | `POST /ai/ask` |
| Access | `decideAccess` in `src/lib/entitlement/` |
| Commerce records | `src/lib/commerce/` (not an access authority) |

## Allowed

HTTP → platform contracts → 1J compose / identity / capabilities  
HTTP → `decideAccess`  
Platform page → Search `limit` bounds  
Platform envelope → map `AiExperienceResult` at the boundary  

## Forbidden

HTTP → Topic Engine / scoring / Search rank / intelligence ingest / AI providers  
Payment → Access  
`/api/ai`  
Client UI as entitlement or commerce authority  
Android / iOS apps, authentication, database, extra product APIs in 8E  

## What it does not do

Add routes, mobile clients, auth, persistence, Geography payload edits,
MCQ/scoring changes, or the next product increment.
