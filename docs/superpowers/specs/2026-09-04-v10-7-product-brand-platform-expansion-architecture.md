# V10.7 Product, Brand & Platform Expansion Architecture

**Date:** 2026-09-04
**Architecture Baseline:** V10.7
**Status:** Active / authoritative detailed specification
**Scope:** Documentation-only product, brand, and platform expansion architecture
**Implementation:** Unchanged. This specification does not modify engineering, domains, deployment, or content.
**High-level summary:** `ARCHITECTURE.md` section 14
**Historical foundation:** V10.6 Phase 0–9F engineering, Universal Content Schema, and canonical content production

This document is the authoritative detailed specification for Sajib Atlas V10.7. `ARCHITECTURE.md` carries the canonical high-level summary and points here. It does not replace the Universal Content Schema, editorial/provenance rules, canonical production pipeline, quality gate, Live Content Review architecture, or the current Geography production workflow.

---

## 1. Purpose and non-goals

V10.7 records how the existing reusable core can support more than one brand surface, product, experience, channel, and market without duplicating engines.

This is:

- a product and brand architecture
- a platform expansion governance model
- a future-optionality map

This is not:

- a coding task
- a content-production task
- a migration task
- a domain-deployment task
- a repository split
- a legal-entity declaration
- an implementation roadmap that converts future ideas into current scope

No DNS, redirects, second application, separate authentication, separate database, API infrastructure, hosting change, routing change, domain purchase, mobile app, B2B/API product, or canonical-content mutation is authorized by this document.

---

## 2. Version relationship

| Layer | Version | Role |
|---|---|---|
| Historical engineering foundation | V10.6 | Phase 0–9F, Universal Content Schema, editorial/provenance, canonical production, Live Content Review, Geography batches |
| Current active architecture | V10.7 | Product, brand, and platform expansion overlay |
| Strategic constitution | V10.6 Master Vision | `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md` remains the long-term North Star; it is not rewritten |
| Immediate execution | Canonical Geography production | Resume from the existing checkpoint; next step is Plate Tectonics publication readiness |

V10.7 does not fabricate an implementation history. Phase 0–9F remain V10.6 engineering history. Audits, reviews, provenance records, and production packages dated under V10.6 remain historical.

Where this specification defines brand surfaces, product layering, expansion governance, and market localization, it is authoritative. Where the V10.6 Master Vision defines the long-term knowledge, learning, assessment, AI, and ecosystem destination, it remains the strategic constitution. Neither document may claim unimplemented capabilities as present. Repository/runtime/test evidence overrides both.

---

## 3. Core philosophy

Primary principle:

> **Start local. Build universal. Scale global.**

Secondary principle:

> **Global by Design. Localized by Market.**

Strategic interpretation:

- Bangladesh is the initial proving ground and launch market.
- Bangladesh is not the architectural boundary.
- South Asia is an important early expansion region, not the ultimate market boundary.
- The platform must be globally capable by design.
- Future markets may include any geography where the product has validated demand.
- Country, curriculum, examination, language, pricing, regulatory, and cultural requirements are localized at the market/product layer.
- Core architecture, knowledge representation, assessment infrastructure, learner intelligence, and reusable platform capabilities remain universal wherever technically appropriate.

Global mission:

> **Make high-quality structured knowledge and learning accessible to learners everywhere.**

Ecosystem formulation:

> **Build trusted, structured knowledge and learning infrastructure that can power educational products, assessment experiences, and knowledge businesses across the world.**

---

## 4. Brand architecture

V10.7 establishes a dual-brand ecosystem. These are brand and deployment surfaces over one shared core. They are not duplicated engineering platforms. SAJIB ATLAS is not described here as a legally established parent company.

### 4.1 SAJIB ATLAS

**Domain (logical):** sajibatlas.com
**Role:** Global Knowledge & Creator Ecosystem

SAJIB ATLAS is the ecosystem, creator, and authority brand.

Primary responsibilities:

- trust
- authority
- research
- public knowledge
- educational philosophy
- long-form guides
- editorial/publication
- creator identity
- media and YouTube ecosystem
- public SEO and discovery
- product discovery
- ecosystem-level communication
- future research and knowledge initiatives

### 4.2 SAJLAS

**Domain (logical):** sajlas.com
**Role:** Flagship Global Learning Product
**Relationship:** SAJLAS is a product identity derived from and belonging to the SAJIB ATLAS ecosystem.

Naming lineage:

```text
SAJIB ATLAS → SAJ + LAS → SAJLAS
```

Preferred relationship wording:

> **SAJLAS by Sajib Atlas**

This establishes product lineage. It does not imply that SAJLAS is technically independent from the core platform.

SAJLAS responsibilities:

- focused learning experience
- structured study
- assessment
- revision
- Learner Intelligence
- AI-assisted learning
- future personalization
- subscription/product experience
- Bangladesh-first launch
- global market expansion through localization

SAJLAS must remain a focused learning product. It is not a generic container for unrelated businesses.

### 4.3 Brand, deployment, and engineering boundaries

These three boundaries are related and not identical.

| Boundary | Meaning | Current V10.7 status |
|---|---|---|
| Brand boundary | Distinct public identities, audiences, and messaging (SAJIB ATLAS vs SAJLAS) | Documented. Not a legal-entity claim. |
| Deployment boundary | Distinct public surfaces, hostnames, or channels that may later present a brand | Logical only. No DNS, hosting, routing, or second app is configured. |
| Engineering boundary | Shared core platform, domain engines, contracts, and content architecture | One modular monolith. Unchanged by V10.7. |

```text
Brand separation does not require engineering duplication.
```

---

## 5. Product architecture

Canonical V10.7 layering:

```text
CORE PLATFORM
     ↓
  PRODUCT
     ↓
 EXPERIENCE
     ↓
  CHANNEL
```

### 5.1 Core Platform

Reusable domain capabilities. The current implemented set is recorded in `CURRENT_STATE.md`. V10.7 does not add engines.

Implemented reusable capabilities include, but are not limited to:

- Universal Content Schema
- Canonical Content Production
- Content Delivery
- Assessment Engine
- Learner Intelligence
- Search
- AI Intelligence / grounded AI
- Identity
- Entitlement
- Commerce foundations
- Platform/API contracts
- Client resilience
- Future reusable platform services, only when later justified

### 5.2 Product

A market-facing business or product built on core platform capabilities.

Initial flagship:

- **SAJLAS** (SAJLAS by Sajib Atlas)

Future options only, unless later implemented and recorded in `CURRENT_STATE.md`:

- SAJLAS Assess
- SAJLAS API
- institutional learning products
- recruitment assessment products
- future specialized learning products

These names are optionality. They are not current products.

### 5.3 Experience

A specific user-facing workflow or application experience. Examples:

- BCS learning
- Geography learning
- English learning
- practice assessment
- revision
- learner dashboard
- institutional assessment

An experience is not a new engine. It composes existing core capabilities for a workflow.

### 5.4 Channel

The delivery surface. Examples:

- Web (current implemented client)
- Android (designed, not implemented as an app)
- iOS (designed, not implemented as an app)
- future APIs
- institutional integrations
- other legitimate delivery channels

Web is the current client. Android and iOS remain future clients of the same contracts (`docs/MOBILE.md`). No native app is implemented.

### 5.5 Intended operating model

```text
One Core Knowledge Platform
        ↓
Multiple Product Surfaces
        ↓
Multiple Experiences
        ↓
Multiple Channels
        ↓
Potentially Multiple Markets
```

This preserves reuse, consistency, maintainability, scalability, product independence, and future optionality.

---

## 6. Platform capability map

Status language is strict:

- **NOW** = implemented and recorded in `CURRENT_STATE.md`
- **NEXT** = logically follows from the current architecture and is not yet implemented
- **FUTURE** = potential platform or business extension; not current scope

Do not treat NEXT or FUTURE items as present.

### 6.1 NOW

- Universal Content Schema
- Canonical Content Production
- Content Delivery
- Assessment Engine
- Learner Intelligence
- Search
- Grounded AI foundation
- Identity
- Entitlement
- Commerce foundations
- Platform read contracts / API foundations
- Web client architecture
- Client resilience

### 6.2 NEXT

Only capabilities that logically follow from the current architecture:

- stronger personalization
- recommendation
- richer revision intelligence
- mobile application delivery
- production content expansion
- additional market localization

Immediate execution remains canonical Geography production. NEXT is not a permission to start Android/iOS apps, extra product APIs, or Batch #5.

### 6.3 FUTURE

Potential platform and business extensions. None of these exist as products:

- B2B Knowledge API
- Assessment-as-a-Service
- institutional learning infrastructure
- recruitment assessment
- content authoring / creator ecosystem
- personalized learning materials
- additional independent products
- other validated platform businesses

Do not implement these under V10.7. Do not imply that they already exist.

---

## 7. Product extension rule

Architectural governance rule:

> **REUSE CORE CAPABILITIES BEFORE CREATING PARALLEL ENGINES.**

Preferred sequence:

```text
Existing Core Capability
        ↓
Extension / Adapter / New Product Experience
        ↓
Only if genuinely necessary:
New Core Capability
```

Do not create duplicate assessment engines, content models, learner-intelligence engines, identity systems, entitlement systems, search systems, or AI grounding systems merely because a new product has a different frontend or market.

A new core capability is justified only when the existing abstraction cannot correctly satisfy the new domain requirement.

This rule applies to future SAJLAS experiences, future products, future APIs, and future independent ventures that choose to share the core.

---

## 8. Business expansion framework

Future ideas may be classified as:

- B2C
- B2B
- B2B2C
- API / Platform
- Digital Product
- Physical Product
- Media
- Marketplace
- Institutional
- Independent Venture

For every future idea, evaluate:

1. Market demand
2. Core capability reuse
3. Operational complexity
4. Brand fit
5. Technical complexity
6. Content dependency
7. Regulatory dependency
8. Revenue potential
9. Strategic defensibility
10. Whether it should remain inside SAJIB ATLAS / SAJLAS or become an independent brand

Core principle:

> **Optionality over premature complexity.**

The architecture should make future businesses possible without requiring those businesses to be built now. This framework is architectural prioritization. It is not a financial model, valuation method, or investment thesis.

### 8.1 Core Reuse Score

A conceptual 0–3 score for architectural fit. It is a decision aid, not a precise metric.

| Score | Meaning | Default path |
|---|---|---|
| 3 | Existing core capability can satisfy the need through an experience, adapter, or product surface | Keep inside the shared core |
| 2 | Existing core can be extended without a parallel engine | Extend, then expose as product/experience |
| 1 | The current abstraction cannot correctly represent the domain | Consider a new core capability only after reuse is exhausted |
| 0 | Weak capability, brand, or operational fit | Independent brand/venture, or do not build |

Use the score with the ten evaluation questions. A high reuse score does not mean “build now.” A low reuse score does not mean “build a second platform.”

### 8.2 Placement decision

Future businesses may exist:

- A. under SAJIB ATLAS
- B. under SAJLAS
- C. as separate brands/products
- D. as independent ventures

Deciding criteria:

- audience overlap
- brand fit
- shared technology
- operational independence
- market positioning
- regulatory risk
- strategic value
- customer-confusion risk

SAJIB ATLAS is an umbrella where appropriate, not a mandatory container for every future business. SAJLAS remains a focused learning product rather than a generic container for unrelated businesses.

---

## 9. Domain and deployment architecture

Logical domain boundary only:

```text
sajibatlas.com
        ↓
Global Knowledge / Creator / Authority Surface

sajlas.com
        ↓
Flagship Learning Product Surface
```

Future logical examples may include:

- `api.sajlas.com`
- `institutional.sajlas.com`
- other product-specific domains or subdomains

These are architectural possibilities. They are not configured, purchased, redirected, or deployed by V10.7.

V10.7 must not:

- configure DNS
- configure redirects
- deploy a second application
- split the repository
- create separate authentication infrastructure
- create separate databases
- create API infrastructure beyond the existing Phase 8 `/api/v1` read foundation
- change hosting
- change routing
- purchase domains
- implement domain redirects

The current engineering system remains one modular monolith with API-ready domain boundaries and mobile-ready contracts. The current Web application remains the implemented client.

---

## 10. Global mission and localization

SAJIB ATLAS is globally oriented.
SAJLAS is globally capable.
Bangladesh is the initial launch and proving market, not the ultimate market boundary.

Do not use “South Asian” as the ultimate platform scope. South Asia may be an important early expansion region.

Core architecture should be universal where appropriate. Localized layers may include:

- language
- curriculum
- examination system
- legal/regulatory context
- cultural context
- pricing
- payment methods
- academic standards
- market-specific UX
- local content
- local partnerships

Localization belongs at the product/market/experience layer. It must not fork canonical knowledge, scoring, identity, entitlement, search, or AI grounding per country unless a genuine domain requirement is proven.

Current execution remains Bangladesh-first. Global capability is architectural, not a claim that multiple markets are live.

---

## 11. Future product ecosystem

Strategic possibility map, not an implementation roadmap:

```text
SAJIB ATLAS
│
├── Public Knowledge / Research / Media
│
├── SAJLAS
│   ├── Learning
│   ├── Assessment
│   ├── Learner Intelligence
│   └── AI
│
├── Future B2B / Institutional Products
│
├── Future API / Platform Services
│
├── Future Publishing / Learning Materials
│
└── Future Independent Ventures
```

Do not convert this map into current scope. Current implemented experiences remain the existing Web learning, assessment, revision, dashboard, Search, and grounded AI surfaces described in `CURRENT_STATE.md`.

---

## 12. Content architecture protection

Brand architecture is a higher-level product and deployment concern. It does not replace or redefine the canonical content architecture.

The following remain authoritative and unchanged by V10.7:

- Universal Content Schema — `docs/superpowers/specs/2026-09-03-universal-content-schema-design.md`
- Editorial & Source/Provenance Specification — `docs/superpowers/specs/2026-09-03-editorial-source-provenance-spec.md`
- Canonical Content Production Pipeline — `docs/superpowers/specs/2026-09-03-canonical-content-production-pipeline.md`
- Automated Content Quality Gate — `docs/superpowers/specs/2026-09-03-automated-content-quality-gate.md`
- Live Canonical Content Review Architecture — `docs/superpowers/specs/2026-09-03-live-canonical-content-review-architecture.md`
- Canonical Geography production workflow and resume checkpoint — `docs/superpowers/reviews/2026-09-03-canonical-development-resume-checkpoint.md`

V10.7 does not alter identity rules, KnowledgeUnits, ContentBlocks, claims, provenance, quality snapshots, workflow states, or review surfaces.

---

## 13. Legacy Geography protection

`src/lib/geography-data.ts` remains **LEGACY / REFERENCE ONLY** according to the established architecture.

V10.7 must not:

- migrate it
- rewrite it
- relabel it as canonical
- delete it
- redesign it
- alter it for brand or product reasons

Legacy Geography is not the canonical quality standard.

---

## 14. Current canonical production protection

V10.7 does not modify or create canonical content. It does not modify:

- Water Cycle
- Latitude & Longitude
- Atmosphere
- Plate Tectonics
- any existing production package
- any audit
- any publication-readiness decision

Current production state remains as recorded in `CURRENT_STATE.md` §58 and the resume checkpoint:

- no package is published
- Batch #5 does not exist
- next exact workflow step is **Plate Tectonics publication readiness / human editorial approval simulation**

The repository must remain ready to resume exactly from that checkpoint.

---

## 15. Implementation boundary

V10.7 changes Markdown documentation only.

It does not change TypeScript, JavaScript, React, Next.js routes, API routes, configuration, package scripts, dependencies, database code, authentication, AI providers, Assessment Engine, Learner Intelligence, Search, Identity, Entitlement, Commerce, client adapters, mobile code, Universal Content Schema implementation, canonical content packages, verification scripts, or tests.

If a non-Markdown file appears to require modification to satisfy this architecture, stop. Report the conflict. Do not change the file.

---

## 16. Architectural verdict

V10.7 establishes the Product, Brand & Platform Expansion Architecture.

- SAJIB ATLAS is the global knowledge and creator ecosystem.
- SAJLAS is the flagship global learning product, beginning with Bangladesh.
- The core engineering architecture remains shared and reusable.
- The architecture is global by design and localized by market.
- Future products and businesses remain possible without forcing premature implementation.
- Canonical content production remains the immediate development path.
