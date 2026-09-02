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

# DEVELOPMENT_RULES.md — V10.6 ENGINEERING RULES

## 1. General

- Preserve working functionality.
- Prefer small, reversible changes.
- Avoid speculative infrastructure.
- Keep domain logic out of presentation components.
- Avoid duplicated canonical data.
- Use TypeScript types consistently.
- Validate inputs at boundaries.
- Keep secrets out of source control.

## 2. Repository Discipline

Before editing:

1. inspect relevant files
2. identify current behavior
3. identify dependencies
4. understand data flow

After editing:

1. run appropriate tests
2. run build/type checks
3. inspect affected runtime behavior
4. update docs if architecture changed

## 3. Component Rules

Components should be responsible for presentation and interaction.

Domain logic should live in reusable modules.

Do not make UI state the only source of truth for:

- scoring
- entitlements
- purchases
- security
- AI quotas
- canonical knowledge

## 4. Data Rules

Use one canonical representation where possible.

Do not duplicate:

- topics
- concepts
- question metadata
- subscription state
- user identity

without a clear reason.

The Universal Topic Engine (`src/lib/topic-engine/`) orchestrates existing
canonical topics. Do not create a second topic registry, a Geography-only
topic engine, or subject-specific copies (BCS/English/etc.).

Search documents in `src/lib/search/` must reuse canonical ids. Do not
create a second search identity system or copy Geography payloads into
the index.

## 5. Assessment Rules

Scoring must be deterministic and testable.

Question answer keys must not depend solely on client-side hidden state.

## 6. AI Rules

AI is an intelligence layer, not a knowledge database.

- Canonical catalogs, Search, Assessment Engine, and Learner Intelligence
  remain authoritative.
- Consume Phase 5 retrieval; do not scan `geography-data.ts`.
- Do not score assessments or mutate `completedTopics`.
- Distinguish grounding references from generated output.
- Keep the provider interface vendor-agnostic; do not leak SDK objects.
- Provider adapters live in `src/lib/ai-providers/` and must be server-only.
- Credentials use `XAI_API_KEY`, never `NEXT_PUBLIC_*`.
- Grounded answers require Phase 5 retrieval above the documented score
  threshold; otherwise return `insufficient_context` without calling the model.
- Retrieval for AI goes through `KnowledgeRetriever`. Do not add a second
  search index. Future semantic/vector retrievers must implement that interface.
- Grounding states are retrieval-derived (`grounded` / `weakly-grounded` /
  `insufficient-context`), never fake model confidence.
- At most one provider invocation per request. No agent/tool loops.
- Do not introduce embeddings, vector databases, chat UI, or `/api/ai`
  in Phase 6C.
- The `/ai` experience must call AI only through the platform boundary
  (Server Action and/or thin Route Handler). The browser must never
  import the provider adapter or read `XAI_API_KEY`.
- Public AI requests must be validated before invocation. Do not forward
  arbitrary client objects, untrusted assessment results, or provider
  fields into AI Intelligence.
- One incoming request may create at most one provider call. Do not
  implement agent/tool loops, conversation memory, or AI-owned learner
  writes.
- Keep current AI functionality public/free. Do not invent subscription
  gating in Phase 6D.
- Gemini is the default primary provider; xAI is eligible fallback only.
  Do not fallback on authentication, configuration, invalid request, or
  policy blocks. Missing `GEMINI_API_KEY` must not silently use xAI.
- Worst-case provider calls per request = 2. No LiteLLM, no provider
  selection in the UI, no provider-specific prompts in AI Intelligence.

Every paid or expensive AI feature must have:

- entitlement check
- rate/usage control
- cost attribution
- failure handling

## 7. Growth Rules

Growth functionality must be:

- measurable
- privacy-aware
- reversible
- resistant to abuse

Never implement fake metrics.

## 8. Accessibility

Use:

- semantic structure
- keyboard support
- focus management
- accessible labels
- non-color-only state communication
- scalable text
- reduced-motion consideration

## 9. Internationalization

Avoid hard-coding user-facing language where future localization is plausible.

Keep:

**CONTENT / LANGUAGE / LOCALE / EXAM CONTEXT**

conceptually separate.

## 10. Performance

Prefer:

- server-side work when appropriate
- caching where safe
- lazy loading
- efficient data fetching
- pagination for large collections

Do not optimize blindly. Measure first.

## 11. Documentation

Architecture-changing work must update the relevant V10.6 documentation.

## 12. No Silent Breaking Changes

Before changing a public/shared contract, identify consumers and migrate them
coherently.

## 13. Search Rules

Search is a retrieval projection of canonical knowledge.

- Identity comes from existing catalogs, not generated search ids.
- Query normalization is lexical (whitespace/case), not semantic.
- Ranking must be explicit and deterministic; canonical `id` is the
  final tie-breaker.
- Empty queries return no results unless an explicit discovery API exists.
- Do not scan `geography-data.ts` at query time.
- Do not leak answers, explanations, payload pointers, learner state,
  entitlement, or commerce fields.
- Do not introduce embeddings, vector databases, or external search
  providers in the Phase 5 foundation.
- Preserve `searchTopics` public behavior for existing UI.

## 14. Identity Rules

Canonical learner identity is owned by `src/lib/identity/`.

- Local identity is `learner/local`. Do not hash, replace, or UUID it.
- Authentication ≠ identity resolution ≠ learner profile ≠ learner state.
- LearnerProfile consumes identity. Identity does not depend on profile.
- Email, phone, username, provider subject, and tokens must never become
  `learnerId`.
- Future authenticated ids are opaque `learner/{opaque-id}`.
- External provider identity is not canonical learner identity.
- Public identity reads expose `learnerId`, `mode`, and `status` only.
- Do not introduce auth providers, sessions, JWT, login UI, cookies for
  auth, or a user database in Phase 7A.
- Keep the identity module client-safe and storage-independent.
- Do not replace `sajib_atlas_learner_state`.

## 15. Entitlement & Access Rules

Access is decided by entitlement, not by payment or UI.

- Canonical id is `entitlement/{scope}/{targetId}`.
- Matching is exact `scope` + `targetId`. Do not inherit subject → topic
  or topic → assessment set unless a later phase defines it.
- Catalog subjects, topics, and assessment sets are public. Features are
  protected and fail closed.
- If `entitlement.learnerId` is present it must equal the current
  canonical learner id. Email/phone/provider identity cannot authorize.
- Evaluate `startsAt`/`expiresAt` with an injectable clock. Invalid
  ranges are rejected. Missing clock with a window is deny.
- Malformed, expired, revoked, wrong-learner, wrong-scope, and
  wrong-target grants deny. Do not repair invalid records.
- Payment, order, or subscription fields must not grant access.
- Do not add entitlement persistence, paywalls, or checkout in Phase 7B.

## 16. Commerce Rules

Keep Product, Order, Purchase, and Payment separate.

- Product identity is an opaque Phase 1I token. It is not a learner,
  payment, or knowledge id and has no price in access logic.
- Order is commercial intent (`order/{opaque}`). Status remains
  `pending | confirmed | cancelled | failed`. Orders do not carry
  amount, currency, or card data.
- Purchase is successful acquisition (`purchase/{opaque}`). Only
  `completed` purchase of a `confirmed` order may propose entitlement.
- Payment supports an order (`payment/{opaque}`). Captured payment must
  not produce `allowed: true`.
- Commerce calls `proposeEntitlementGrant`; it does not decide access.
- Do not store card numbers, CVV, tokens, API keys, or raw provider
  payloads. Public payment reads omit provider internals.
- No gateway SDK, checkout, webhooks, invoices, or commerce database
  in Phase 7C.

## 17. Phase 7 Integration Rules

- Identity → Learner. Entitlement may consume identity. Identity must
  not import entitlement or commerce.
- Commerce → Entitlement proposal. Entitlement must not import commerce.
- Entitlement → Access. Payment and Purchase must not call `decideAccess`.
- Topic Engine, Assessment Engine, Search, and AI must not become
  authorization authorities.
- Client UI must not be the authority for identity, entitlement, access,
  purchase, or payment.
- Phase 7D hardens these boundaries. It does not add auth, database,
  checkout, API routes, or mobile.

## 18. Platform Rules (Phase 8A design)

- Clients are Web, Android, and iOS over one contract. Do not fork
  scoring, identity, entitlement, or catalogs per client.
- Reuse Phase 1J `PlatformReadResult`, contract versions, and read error
  codes. Do not create a second envelope.
- Client surface (`web` | `android` | `ios` | `api`) is not `learnerId`.
  Canonical learner remains `learner/local`.
- Platform maps domain errors. It does not replace domain modules.
- Topic Engine capabilities stay topic-scoped. Platform capability
  discovery is a separate availability read.
- Search `limit` stays the search bound. Optional cursors are additive.
- API/platform code must call existing engines. No duplicated business
  logic. `geography-data.ts` is not a public API.
- Phase 8B TypeScript lives in `src/lib/platform/` and reuses Phase 1J.
- Phase 8C HTTP transport is GET `/api/v1` only. Handlers must call
  existing platform/domain helpers. Do not add `/api/ai`, auth,
  database, checkout, or mobile apps.
- Phase 8D: serve contract `v1` only; reject malformed requests and
  non-local learner claims; cap pagination with Search limits; check
  topic access with `decideAccess`.
- Phase 8E is the integration gate. Keep
  `Client → HTTP → Platform Contracts → Existing Domain Engines`.
  Do not copy engines into HTTP handlers. Do not add Android/iOS,
  authentication, extra product APIs, or `/api/ai` in this gate.

## 19. Mobile Client Rules (Phase 9A design)

- Web, Android, and iOS consume the same Phase 8 contracts. Do not fork
  scoring, identity, entitlement, or catalogs per client.
- Required mobile flow: Client → Platform API Contracts → `/api/v1` →
  existing engines.
- Client layers are API client, state/cache, navigation, and domain
  projection only. No mobile domain engine.
- Local learner state is not server-read cache. Cached catalog is not
  access. Protected features fail closed offline.
- Device id, advertising id, and email are not `learnerId`.
- Do not implement Android/iOS apps, React Native, Flutter, native SDKs,
  authentication, database, push providers, or new product APIs in 9A.
- Notes: `docs/MOBILE.md`.
- Phase 9B TypeScript lives in `src/lib/client/` and reuses Phase 8
  contracts. It must not add `/api/v1` routes, score MCQs, or persist
  learner state. Do not add Android/iOS apps in 9B.
- Phase 9C client state is in-memory only. Server-read cache is not local
  learner state. Do not cache secrets, payload, or protected content.
  Offline protected features fail closed. Do not add Android/iOS apps
  in 9C.
- Phase 9D is the Web integration gate. Web UI must not become
  entitlement, commerce, or scoring authority. Navbar search may use
  `src/lib/client/web.ts` but must keep search-data behavior. Do not
  add Android/iOS apps in 9D.
- Phase 9E is the client foundation integration gate. Keep
  `Web/Android/iOS → shared client → /api/v1 → engines`. Do not ship
  Android/iOS apps, authentication, or extra product APIs in this gate.
