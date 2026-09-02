# Mobile Client Architecture (Phase 9A — Design)

**Architecture Baseline:** V10.6  
**Status:** Phase 9E mobile foundation integration gate complete  
**Code:** `src/lib/client/` (no Android, iOS, React Native, Flutter, or native SDK)  
**Verifier:** `npm run verify:phase9`  
**Existing reuse:** Phase 8 `src/lib/platform/`, Phase 1J envelope, `learner/local`  
**Notes:** This document is the 9A gate. It does not add `/api/v1` routes.

Web, Android, and iOS are clients of one platform. Business logic stays in
existing engines. A mobile client transports, caches, navigates, and
projects. It does not score, grant access, or own catalogs.

```text
Sajib Atlas Web | Android | iOS
        ↓
Client layers (API · cache · navigation · projection)
        ↓
Platform API contracts   (Phase 8 envelope, version, error, page, capabilities)
        ↓
/api/v1 transport        (hardened Phase 8C/8D)
        ↓
Existing domain engines  (Topic, Assessment, Search, Learner Intelligence,
                          AI, Entitlement, Commerce)
```

Required mobile flow (this increment designs it; it does not ship an app):

```text
Mobile Client
  → Platform API Contracts
    → /api/v1 Transport
      → Existing Domain Engines
```

## What already exists (reuse)

Do not recreate these in a client:

| Need | Canonical source |
| --- | --- |
| Envelope | Phase 1J / 8B `PlatformReadResult` |
| Version | `v1` current; `v2`/`v3` reserved; never on domain ids |
| Errors | `invalid_request` \| `not_found` \| `validation_failure` |
| Client surface | `web` \| `android` \| `ios` \| `api` ≠ `learnerId` |
| Request context | `contractVersion`, `client.surface`, optional `learner/local`, optional `platform-request/{id}` |
| Pagination | `{ items, limit, nextCursor? }`; Search default 25 / max 100 |
| Identity | `learner/local`; public read `{ learnerId, mode, status }` |
| Topic catalog read | 1J `TopicReadResponse` via `GET /api/v1/topics` |
| Topic capabilities | Topic Engine (not platform capabilities) |
| Assessment delivery/scoring | Assessment Engine; public delivery omits answers |
| Search | `src/lib/search/`; not re-ranked in the client |
| Learner intelligence | `src/lib/learner-intelligence/` |
| AI experience | `AiExperienceView` / `POST /ai/ask`; no `/api/ai` |
| Access | `decideAccess`; public catalog free; protected fail-closed |
| Commerce | records-only; payment is not access |

Current HTTP surface (do not expand in 9A):

```text
GET  /api/v1/capabilities
GET  /api/v1/identity
GET  /api/v1/topics?topicId=… | subjectId=… | categoryId=… | limit=… | cursor=…
POST /ai/ask                  (experience transport; not a platform /api/ai)
```

Search, assessment delivery, learner-intelligence snapshot, and commerce
records are **domain contracts**, not additional product APIs in this
gate. Clients must be typed against those contracts. They must not invent
mobile-only payloads, and 9A must not add routes to expose them.

## Web and mobile consume the same contracts

Web today composes some engines **in-process** (Geography study page,
`search-data`, `TopicStudyPage`, `/ai/ask`). That path is preserved.

It is a composition shortcut over the **same** canonical types, not a
second catalog:

```text
Canonical domain contracts
        ↑
   ┌────┴────┐
   │         │
Web in-process     /api/v1  (Android / iOS / future Web API client)
(UI → 1J/engines)  (UI → API client → envelope → engines)
```

Rules:

- Topic, concept, assessment-set, learner, entitlement, and order ids are
  identical on every surface.
- Android/iOS must not vendor `geography-data.ts` as a second catalog.
- Study paragraphs and MCQ arrays remain internal payload, not a public
  mobile API.
- Scoring, entitlement, and identity stay in existing engines.
- A future Web API client, if added, must use the same adapter types as
  mobile. It must not fork envelopes.

## Minimal client layers

Four layers. No fifth “mobile domain engine.”

### 1. API client

Owns HTTP only.

- Send `X-Platform-Contract-Version: v1` (or omit and accept server `v1`).
- Send `X-Platform-Client: android` \| `ios` \| `web`.
- Optional `X-Platform-Request-Id: platform-request/{opaque}`.
- Do **not** send email, phone, device id, or advertising id as
  `X-Platform-Learner`. Absent claim is correct; server resolves
  `learner/local`. Non-local claims are rejected (Phase 8D).
- Parse **only** Phase 1J envelopes. Reject non-envelope bodies.
- Map HTTP 400 / 404 / 422 / 405 onto existing error codes. Do not add
  `unauthorized` until authentication exists.
- Do not score, search-rank, decide access, or mint ids.

### 2. State / cache boundary

Two stores. Never one blob.

| Store | Holds | Authority |
| --- | --- | --- |
| Server-read cache | Envelope `data` for public catalog reads (capabilities, identity, topics) keyed by resource + `v1` + query | Server. Cache is a copy. |
| Local learner store | Completion, local MCQ outcomes, intelligence snapshot (Web: `sajib_atlas_learner_state`) | Device-local. Not access. Not catalog. |

- Cache public `TopicRead` for offline display.
- Do not cache answer keys, payload pointers, secrets, payment
  instruments, or provider payloads.
- Do not treat a cached `AccessDecision` as a grant. Revalidate when
  online. Fail closed when the resource is protected and the server
  cannot be reached.
- Local completion does not upload. There is no persistence API.

### 3. Navigation boundary

Screens and deep links use **canonical ids**, not a mobile slug scheme.

- Topic: `geography/earths-rotation` (existing `${subjectId}/${slug}`).
- Prefer existing catalog `href` when presenting Web-compatible links.
- Unknown ids are `not_found`, not a client-invented topic.
- Future push and future auth redirects land on this boundary, then
  refresh through the API client. They do not write catalog or grants.

### 4. Domain projection boundary

Maps envelope `data` onto **existing** read types for UI:

- `PlatformCapabilityRead`
- `IdentityRead` / identity read response
- `TopicReadResponse` / `PlatformPage<TopicRead>`

Projection may hide fields for layout. It may not:

- add scoring or correct answers
- add a second topic registry
- turn payment or purchase into `allowed: true`
- rename `learner/local`

`geography-data.ts` study/MCQ payload is not a projection source for
mobile.

## Offline / local vs server state

```text
Online:   UI → cache (optional) → API client → /api/v1 → engines
Offline:  UI → public catalog cache          (read-only copy)
          UI → local learner store           (completion / local attempts)
          protected features                 fail closed
```

- Public catalog remains free and cacheable.
- Protected features require a live `decideAccess` path; offline is
  `allowed: false`.
- Local MCQ outcomes are device history, not Assessment Engine results
  unless produced by that engine.
- Clients must not reimplement `isMcqAnswerCorrect` / Search rank /
  Topic Engine capability discovery in Kotlin/Swift.
- Sync to a user account is **not** designed as a merge in 9A. Future
  auth uses the existing local → authenticated **migration contract**
  (`implemented: false`). Do not copy, merge, or delete local state here.

## Future authentication (not implemented)

Reuse Phase 7A. Do not add login, JWT, sessions, or `/api/auth`.

```text
Authentication provider (future)
        ↓
Authentication result          (opaque; not learnerId)
        ↓
Identity resolution            (server)
        ↓
Canonical learnerId            (today: learner/local)
        ↓
Learner profile / intelligence / entitlements
```

Client slot only:

- A future `Authorization` header may carry an opaque session token.
- Token ≠ `learnerId`. Device id ≠ `learnerId`.
- Email / phone / OAuth subject still must not be sent as
  `X-Platform-Learner`.
- Do not require `unauthorized` in the transport error set until auth
  exists. Protected denial stays `AccessDecision` (`allowed: false`,
  `reason: "missing"`), not a login wall on public catalog.

## Future push notifications (not implemented)

Notifications are a domain in the target architecture. 9A adds no FCM,
APNs, plugin, or service.

Client slot only:

```text
Push provider (future)
  → opaque { type, targetId }     (canonical id, not a grant)
    → navigation boundary
      → API client refresh
```

Forbidden:

- Push body as entitlement, score, payment status, or catalog mutation
- Embedding secrets or answer keys in a notification
- A second notification identity system

## Shared vs platform-specific

**Shared (all clients):**

- Envelope, version `v1`, error codes, page shape
- Canonical ids and `learner/local`
- API client rules and headers
- Cache vs local-store split
- Navigation by canonical id
- Projection onto existing read types
- Entitlement and commerce isolation
- AI via `/ai/ask` mapping, never `/api/ai`

**Platform-specific (later implementation, not 9A):**

| Surface | Allowed to differ | Must not differ |
| --- | --- | --- |
| Web | SSG, in-process composition, CSS/layout, `localStorage` key already in use | Envelope, ids, scoring, access |
| Android | OS navigation, system back, notifications permission UX, language | Envelope, ids, scoring, access |
| iOS | Same as Android at OS chrome only | Envelope, ids, scoring, access |

No React Native / Flutter / native SDK is chosen in 9A. Toolkit choice
is a later implementation increment and must still sit **above** these
layers.

## API consumption model

```text
GET /api/v1/capabilities
  → PlatformCapabilityRead
  → discover what this platform exposes (authentication: false,
    commerce: records-only, persistence: local)

GET /api/v1/identity
  → IdentityRead { learnerId: "learner/local", mode: "local", status: "active" }

GET /api/v1/topics?topicId=geography/earths-rotation
  → TopicReadResponse (identity + concept/assessment-set refs)
  → server already applied decideAccess; public catalog is free

GET /api/v1/topics?subjectId=geography&limit=25
  → PlatformPage<TopicRead> (opaque cursor; not a numeric offset)
```

Headers:

```text
X-Platform-Client: android | ios | web
X-Platform-Contract-Version: v1
X-Platform-Request-Id: platform-request/{opaque}   (optional)
```

Unsupported `v2` / unknown versions → `invalid_request` /
`"unsupported contract version"`. Malformed requests →
`"malformed request"`. Invalid `limit` / numeric `cursor` →
`validation_failure`.

AI, if shown on a client later, stays `POST /ai/ask` and maps
`AiExperienceResult` at the boundary. Do not add `/api/v1/ai`.

## Security boundaries

- Client UI is not identity, entitlement, commerce, or scoring authority.
- Server `decideAccess` remains the access authority for HTTP reads.
- Public catalog is free without login.
- Protected resources fail closed (missing entitlement, or offline).
- Payment / purchase / push / local flags never grant access.
- No secrets, tokens, card data, provider payloads, or MCQ answers in
  client cache or logs.
- `geography-data.ts` is not a public API and must not be shipped as the
  mobile knowledge base.
- Advertising id, device id, and email are not `learnerId`.

## Risks

| Risk | Why it matters | Mitigation in this design |
| --- | --- | --- |
| Incomplete HTTP surface | Search, assessment delivery, intelligence, commerce are not `/api/v1` routes | 9A does not add them. Clients type existing contracts; later increments may expose reads over the same transport |
| Forked mobile catalog | Copying `geography-data` or scoring into Kotlin/Swift | Forbidden. Payload stays internal; scoring stays Assessment Engine |
| Cache as grant | Offline stale `allowed: true` | Protected features fail closed offline; cache is public catalog only |
| Device id as learner | Future auth / analytics shortcuts | Surface ≠ learner; 8D rejects non-local claims |
| Push as authority | Notification body used as entitlement or score | Push is navigation + refresh only |
| Web in-process drift | Web types diverge from envelope `data` | Same 1J/7A types; Web shortcut is composition, not a second model |
| New product APIs under “mobile” | Pressure to add `/api/v1/search` etc. in 9A/9B | Explicitly out of scope until a later designed increment |

## Exclusions (9A)

Android code, iOS code, React Native, Flutter, native SDKs, plugins,
authentication, database, checkout, payment processors, `/api/ai`,
new `/api/v1` routes, Geography payload edits, MCQ/scoring changes.

## Phase 9B (implemented)

TypeScript-only shared client adapter in `src/lib/client/`.

- request headers / envelope parse / dispatch to existing `/api/v1`
- topic, assessment-set identity, search, learner-intelligence, AI map,
  and `decideAccess` reads
- server-cache keys separate from local-learner store
- verifier: `npm run verify:phase9b`

Still no Android/iOS app, React Native/Flutter, auth, database, or new
product APIs.

## Phase 9C (implemented)

In-memory client state boundary.

- server-read cache: public catalog projections only (`platform-cache/v1/…`)
- local learner store: `learner/local` completion / intelligence input
- read status: idle | loading | success | error
- online: engines via Phase 9B reads; offline: public cache; protected/AI fail closed
- verifier: `npm run verify:phase9c`

## Phase 9D (implemented)

Web integration gate over 9B/9C.

- Web surface: `src/lib/client/web.ts`
- Navbar search imports the web client boundary; implementation stays `search-data`
- Geography study/MCQ remain in-process
- `/api/v1` remains the HTTP transport
- Verifier: `npm run verify:phase9d`

## Phase 9E (implemented)

Integration gate over 9A–9D. No Android/iOS app.

```text
Web / future Android / future iOS
  → Shared client layer
    → /api/v1
      → Platform contracts
        → Existing domain engines
```

- Verifier: `npm run verify:phase9`
- Notes: `docs/PHASE9.md`

Phase 9 client foundation is closed. The next increment is not started.
