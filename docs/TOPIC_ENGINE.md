# Universal Topic Engine (Phase 2)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/topic-engine/`  
**Verifier:** `npm run verify:topic-engine`

The Topic Engine is a subject-independent domain orchestration layer. It
resolves, inspects, and operates on canonical topics without becoming a
second topic registry.

## Authority

Phase 0A–1J remains closed. Canonical topic identity stays
`${subjectId}/${slug}` in `src/lib/content/manifest.ts`.

```text
Canonical Knowledge / Content Identity
        ↓
Existing Phase 1 Contracts
        ↓
Universal Topic Engine
        ↓
Future Web / API / Mobile / AI consumers
```

The engine consumes existing catalogs and read models. It does not mint
topic ids, copy Geography study payload, embed MCQ arrays, or replace
assessment scoring.

## What it does

- Resolve a topic by canonical id, href, or `subjectId` + `slug`
- Inspect identity existence (`present` / `absent`) without composing payload
- Inspect content availability and publication/lifecycle as independent fields
- Derive lifecycle/state without collapsing existence, availability, and publication
- Discover content, assessment, learner, search, and catalog-access capabilities
- Compose a JSON-safe topic record around existing identity refs
- Navigate previous / next / siblings from canonical-manifest category order
- Inspect a topic for catalog-bound diagnostics
- Search by composing over the existing canonical-manifest substring index

## What it does not do

- HTTP / REST / GraphQL / tRPC
- AI, embeddings, vector search, recommendations
- Adaptive learning or spaced repetition
- Backend persistence, authentication, database
- Payment, checkout, entitlement enforcement
- CMS, question-id migration, Geography payload migration
- New public routes (`/topics/[slug]` remains deferred)

## Lifecycle / state

These remain distinct:

| Field | Meaning | Vocabulary |
| --- | --- | --- |
| `identityExistence` | Canonical catalog membership | `present` \| `absent` |
| `contentStatus` / `contentAvailability` | Payload completeness | `available` \| `partial` \| `planned` |
| `lifecycle` / `publicationState` | Phase 1C content metadata | `CONTENT_LIFECYCLES`: `draft` \| `published` \| `archived` |
| `capabilityAvailability` | Engine operations | `available` \| `unavailable` per capability |
| `operationalState` | Derived rollup | `study-ready` \| `catalog-only` \| `unpublished` \| `retired` |

These layers are independent:

- Identity existence is not content availability. `missing/topic` is **absent**, not `planned`.
- Content availability is not publication. `bcs/english` is **published** and **partial**.
- Content availability is not engine readiness. `contentStatus: "available"` does not mean study is available.
- Publication is not operational readiness. A `draft` with `available` payload is **unpublished**.

Engine capability availability is named per capability (`inspect`, `study`,
`practice`, `complete`, `goal`, `search`).

Do not add `isReady`, `isComplete`, or `isActive` unless each has a precise
architectural meaning. Phase 2 assigns them none, so both `true` and `false`
are invalid.

- `isReady` is not identity, content availability, publication, or capability availability
- `isComplete` is not `contentStatus`, learner completion storage, or `capabilityAvailability.complete`
- `isActive` is not `lifecycle: published`, `operationalState: study-ready`, or `capabilityAvailability.study: available`

A later phase may introduce one of these keys only if it names exactly one
layer and that meaning is documented.

`capabilityAvailability.complete` means the engine can accept a completion
mark. It is not a stored learner-completion flag.

Composed `TopicEngineModel` records keep Phase 1 field names (`contentStatus`,
`lifecycle`) and are always `present`. Use `inspectTopicLifecycle` to observe
absence without inventing availability or publication values.

Composed `TopicEngineModel` records are always `present`. Use
`inspectTopicIdentity` to observe `absent` without composing capabilities.
Malformed ids (concept or assessment-set ids) are `invalid_request`, not
absence.

Today: live Geography study topics are `present` + `study-ready`. BCS/English
catalog stubs are `present` + `catalog-only`. No draft or archived catalog
rows exist yet.

## Topic capability model

One universal model for every subject. Do not add `GeographyCapabilities`
or `BcsCapabilities`.

Prefer explicit enums and capability objects. Do not use `isReady`,
`isComplete`, or `isActive` unless a precise architectural meaning exists.

Phase 1C `contentMetadata.lifecycle` remains the publication authority.

`TopicCapabilityModel` is bound to canonical `topicId` and has two parts:

- **Discovery** — what exists (identity refs and counts; zeros are valid)
  - Content: `contentStatus`, `conceptCount`
  - Assessment: `assessmentSetIds`, `kinds`, `assessmentSetCount`
  - Learner: `localLearnerId` (`learner/local`)
  - Search: `canonical-manifest` index
  - Access: `catalogAccess` (`public` \| `restricted`)
- **Availability** — `available` \| `unavailable` per kind
  `study`, `concepts`, `assessment`, `completion`, `revision`, `search`

Capabilities describe availability. They do not execute study, scoring,
completion, revision, or search.

Resolve with `composeTopicCapabilityModelForTopicId` or `askTopicCapability`.

The engine can answer:

- Does this topic have study content? (`study-content`: `present` \| `absent`)
- Does this topic have concepts? (`concepts`: `present` \| `absent`)
- Does this topic have an assessment set? (`assessment-set`: `present` \| `absent`)
- Is learner completion applicable? (`availability` / `completion`)
- Is revision applicable? (`availability` / `revision`)
- Is search indexing applicable? (`availability` / `search`)
- Is `study` / `concepts` / `assessment` available?
- How many concepts does this topic have?
- What assessment-set identity exists?
- What local learner identity can target this topic?
- Which search index covers this topic?
- Is catalog access public or restricted?

Study content `present` means `contentStatus === "available"`. That is not the
same as study capability availability (which also requires published
lifecycle).

Answers are enums or identity objects. They are not `isReady` or `canStudy`.

Learner hooks do not read `localStorage`. Assessment discovery does not
embed questions.

## Geography compatibility

Earth's Rotation (`geography/earths-rotation`) remains:

- id / href / title unchanged
- four concept identity refs
- one `mcq-practice` assessment-set identity
- study payload and MCQ arrays in `src/lib/geography-data.ts`

BCS and English stubs remain valid topics with empty concept and
assessment lists.

Future subjects (Bangladesh Affairs, Science, ICT, Ethics, academic and
professional exams) use this same engine. Do not add `EnglishTopicEngine`
or `BcsTopicEngine` copies.
