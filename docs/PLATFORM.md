# Platform Foundation (Phase 8A — Design)

**Architecture Baseline:** V10.6  
**Status:** Phase 8E integration gate complete  
**Code:** `src/lib/platform/` and `src/app/api/v1/`  
**Existing reuse:** `src/lib/contracts/api.ts` (Phase 1J)  
**Verifier:** `npm run verify:phase8b` · `npm run verify:phase8c` · `npm run verify:phase8d` · `npm run verify:phase8`

Phase 8A designed the boundary. Phase 8B implements TypeScript-only
contracts in `src/lib/platform/`. It does not add HTTP, mobile apps,
authentication, a database, or a second domain catalog.

Web, Android, and iOS are clients of one platform. Business logic stays in
existing engines. The platform layer only transports and composes.

```text
WEB / ANDROID / iOS
        ↓
Platform Contract  (envelope, client, version, error, page, capabilities)
        ↓
Existing Domain Contracts  (Phase 1E / 1J / 7A–7C)
        ↓
Existing Engines  (Topic, Assessment, Search, AI, Learner Intelligence)
```

## What already exists (reuse)

Do not recreate these in Phase 8B:

| Need | Canonical source |
| --- | --- |
| Read envelope | `PlatformReadResult` / `PlatformReadSuccess` / `PlatformReadFailure` |
| Contract version | `v1` \| `v2` \| `v3` on the envelope, never on domain ids |
| Transport-facing read errors | `invalid_request` \| `not_found` \| `validation_failure` |
| Topic / concept / assessment reads | Phase 1E + 1J `TopicReadResponse` |
| Canonical learner | `learner/local` in `src/lib/identity/` |
| Identity public read | `IdentityRead` `{ learnerId, mode, status }` |
| Access decision | `decideAccess` in `src/lib/entitlement/` |
| Topic capability availability | Topic Engine `TopicCapabilityModel` |
| Search bound | `limit` default 25, max 100 in `src/lib/search/` |
| AI experience DTO | `src/lib/ai-experience/types.ts` (map at platform boundary; do not rewrite) |

Phase 1J already states: no pagination, no URL parsing, no HTTP, catalogs
remain source of truth, `geography-data.ts` is not a public API.

## Client vs learner identity

These are different authorities.

```text
Platform client surface   web | android | ios | api
        ≠
Canonical learner         learner/local
```

- Client identity names the **surface**. It is not a user account.
- Learner identity remains Phase 7A. Only `local` is active.
- Email, phone, device id, advertising id, and OAuth subject must never
  become `learnerId`.
- Authentication remains unimplemented. A future auth result still flows
  through identity resolution before learner context.

## Envelope

Reuse Phase 1J success/failure. Phase 8B may add **request context** beside
it, not a second result type:

```text
Request context (future TypeScript)
  contractVersion: v1
  client.surface: web | android | ios | api
  learnerId?: learner/local     (resolved identity, not a credential)
  requestId?: opaque platform request id

Response (existing)
  success: true  → { contractVersion, data }
  success: false → { error: { code, message } }
```

Rules:

- Envelope owns version. Domain ids do not.
- `data` is an existing domain/read contract, never a Geography payload,
  MCQ answer key, secret, or raw provider object.
- AI `/ai/ask` stays the experience transport. Platform must not add a
  competing `/api/ai`. If AI is exposed through the platform envelope
  later, map `AiExperienceResult` at the boundary.

## Error model

Transport-facing codes stay the Phase 1J set:

- `invalid_request`
- `not_found`
- `validation_failure`

Domain modules keep their own codes (`invalid_identity`, entitlement
`missing` / `expired` / `revoked`, AI statuses). The platform **maps**
them. It does not replace them.

Do not add `unauthorized` until authentication exists. Protected-feature
denial is an `AccessDecision` payload (`allowed: false`, `reason: "missing"`),
not a login requirement. Public catalog remains free.

Errors must omit stack traces, file paths, secrets, and provider payloads.

## Versioning

- Current: `v1`
- Reserved: `v2`, `v3` (additive)
- Topic, concept, assessment-set, learner, entitlement, and order ids
  must not embed `v1`
- Breaking changes require a new contract version, not new domain ids

## Pagination

Phase 1J collections are unbounded in-process projections of a small
catalog. Search already has `limit`.

Phase 8B may add an **optional** page shape for future collections:

```text
{ items, limit, nextCursor? }
```

- Cursor is opaque. Do not use numeric offsets as the public contract.
- Do not replace Search `limit` / `total`.
- Do not paginate until a collection is large enough to need it.
- Empty catalog remains a valid empty `items` list, not an error.

## Capability discovery

Two layers. Do not merge them.

1. **Topic capabilities** (existing): study, concepts, assessment,
   completion, revision, search — per canonical topic.
2. **Platform capabilities** (future TypeScript, not HTTP): what this
   platform surface exposes.

Conceptual platform capability read:

```text
{
  contractVersion: "v1",
  identity: { mode: "local", learnerId: "learner/local" },
  authentication: false,
  knowledgeRead: true,
  search: true,
  assessmentContracts: true,
  learnerIntelligence: true,
  aiAsk: true,
  entitlement: true,
  commerce: "records-only",
  persistence: "local"
}
```

Capabilities describe availability. They do not execute features, score
MCQs, or grant access.

## Boundary law

```text
Client
  → Platform contract (envelope / client / version / error / page / capabilities)
    → Domain contracts (1E, 1J, 7A–7C)
      → Engines (topic-engine, assessment-engine, search, ai-intelligence,
                 learner-intelligence, entitlement.decideAccess)
```

Forbidden:

- Business logic copied into an API handler or mobile app
- Second topic registry or second learner id
- Payment or purchase as access
- Client UI as entitlement authority
- `/api/v1` routes, Android/iOS apps, auth, or database in 8A/8B

## Phase 8B (implemented)

TypeScript-only `src/lib/platform/` composes Phase 1J.

- envelope: `platformSuccess` / `platformFailure` reuse `PlatformReadResult`
- client: `web | android | ios | api`
- request context: version, client, optional `learner/local`, optional `platform-request/{id}`
- errors: domain codes map to Phase 1J transport codes
- page: `{ items, limit, nextCursor? }`
- capabilities: `defaultPlatformCapabilities()`
- verifier: `npm run verify:phase8b`

HTTP, mobile, auth, and DB remain excluded from 8B.

## Phase 8C (implemented)

Minimal HTTP transport over the 8B contracts.

```text
GET /api/v1/capabilities
GET /api/v1/identity
GET /api/v1/topics?topicId=… | subjectId=… | categoryId=… | limit=…
```

- Headers: `X-Platform-Client` (`web|android|ios|api`, default `api`),
  optional `X-Platform-Request-Id`
- Learner is always `learner/local`. Phase 8D rejects non-local claims.
- JSON body is the Phase 1J envelope. Errors: 400 / 404 / 422. POST → 405.
- Handlers call `readTopic` / `readTopics` / identity / capabilities only.
- AI remains `/ai` + `POST /ai/ask`. There is no `/api/ai`.
- Verifier: `npm run verify:phase8c`

## Phase 8D (implemented)

Hardening of the 8C transport. No new product routes.

- Only contract version `v1` is served. `v2`/`v9` → `invalid_request` / "unsupported contract version"
- Every HTTP body is a Phase 1J envelope; non-envelopes are replaced
- Malformed topicId / client / requestId → `invalid_request` / "malformed request"
- Learner spoof → `invalid_request` / "learnerId must be learner/local"
- Invalid `limit` / numeric `cursor` → `validation_failure`
- Collections are capped with Search default/max limits
- Topic GET calls `decideAccess`; public catalog stays free; protected denies
- Learner is `learner/local`; non-local claims are rejected
- Verifier: `npm run verify:phase8d`

## Phase 8E (implemented)

Integration gate over 8A–8D. No new product routes.

```text
Client → HTTP → Platform Contracts → Existing Domain Engines
```

- Topic Engine, Assessment Engine, Search, Learner Intelligence, and AI
  remain domain authorities. HTTP does not copy them.
- Access stays `decideAccess`. Commerce stays records-only. Payment is
  not an access authority.
- Web Geography/Topic/Search/AI stay in-process and unchanged.
- Verifier: `npm run verify:phase8`
- Notes: `docs/PHASE8.md`

Phase 9A designs the client architecture (`docs/MOBILE.md`). Phase 9B–9D
implement `src/lib/client/`. Phase 9E is the integration gate
(`npm run verify:phase9`). It does not add Android/iOS apps,
authentication, extra product APIs, or `/api/ai`.

## Exclusions (8A–8E)

Authentication, sessions, JWT, database, payment processing, checkout,
subscription billing, `/api/ai`, Android, iOS, AI provider changes,
Geography payload edits, scoring changes.
