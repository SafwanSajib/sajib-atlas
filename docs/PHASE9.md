# Phase 9 Integration Gate (Phase 9E)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/client/`  
**Verifier:** `npm run verify:phase9`

Phase 9E does not add a mobile app or product API. It audits:

- 9A design — `docs/MOBILE.md`
- 9B shared adapter — `src/lib/client/`
- 9C state/offline boundary — server-cache vs local-learner
- 9D Web integration — `src/lib/client/web.ts`

```text
Web / future Android / future iOS
  → Shared client layer     src/lib/client/
    → /api/v1               capabilities | identity | topics
      → Platform contracts  Phase 8 envelope / version / error / page
        → Domain engines    Topic, Assessment, Search, Learner Intelligence,
                            AI, entitlement.decideAccess
```

## Authorities

| Concept | Canonical module |
| --- | --- |
| Client surface | `web` \| `android` \| `ios` \| `api` (not `learnerId`) |
| Envelope | Phase 1J / 8B `PlatformReadResult` |
| Learner identity | `learner/local` |
| Web navbar search | `search-data` via `webSearchTopics` |
| Access | `decideAccess` |
| Commerce | records-only; not an access authority |

## Allowed

Shared request headers for web/android/ios  
Web in-process Geography/MCQ/AI (unchanged)  
Public catalog cache offline  
Local learner store for completion/intelligence  

## Forbidden

Android/iOS apps, React Native, Flutter  
Authentication, database, `/api/ai`, extra `/api/v1` routes  
Client UI as entitlement/commerce/scoring authority  
Cache as grant; secrets in cache; payload/answers in cache  

## What it does not do

Ship mobile clients, add login, persist a database, or start the next
product increment.
