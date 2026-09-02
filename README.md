# Sajib Atlas — V10.6 Architecture Baseline

> **Multi-Platform EdTech, AI, Community, Responsible Growth, Knowledge Commerce & Institutional Ecosystem**

Sajib Atlas is an AI-native, multi-platform knowledge and learning infrastructure designed to connect academic disciplines, competitive examinations, professional certifications, AI assistance, research, and resource commerce from a unified platform architecture.

---

## 1. Architecture Baseline (V10.6)

This repository is built and structured around the **V10.6 Architecture Baseline**.  
The strategic North Star for all product evolution and design is:
`SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`

---

## 2. Platform Direction & Multi-Platform Strategy

Sajib Atlas follows a **Web-First → Mobile-Ready Platform** evolution path:
1. **Web Foundation:** Robust Next.js learning and MCQ practice web application.
2. **Platform Core & API Boundaries:** Reusable domain services, shared identity, and assessment models.
3. **Android & iOS Clients:** Native mobile clients consuming the shared platform contracts. Phase 9A design: `docs/MOBILE.md`. No mobile app is implemented.
4. **Institutional & B2B Expansion:** Enterprise and institutional tenancies.

---

## 3. High-Level Platform Architecture

The platform uses a **Modular Monolith + API-Ready Domain Boundaries + Mobile-Ready Contracts** pattern:
- **Experience Layer:** Web, Android, iOS clients.
- **Domain Layer:** Identity, knowledge, taxonomy, assessment, learning, progress, personalization, search, AI, commerce, entitlements, notifications, research, resources, creator, institution, community, growth, and analytics.
- **Data & Infrastructure:** Server-authoritative data handling with secure isolation.

---

## 4. Development Commands

Ensure Node.js (>= 20/22) is installed.

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type check and build verification
npm run build

# Run linter
npm run lint

# Verify learner completion contracts
npm run verify:learner

# Verify knowledge concept contracts
npm run verify:knowledge

# Verify content metadata/version contracts
npm run verify:content

# Verify assessment-set identity contracts
npm run verify:assessment

# Verify knowledge read contracts
npm run verify:read-contracts

# Verify analytics event identity contracts
npm run verify:analytics

# Verify learner profile/goals contracts
npm run verify:learner-profile

# Verify entitlement identity contracts
npm run verify:entitlement

# Verify commerce order identity contracts
npm run verify:commerce

# Verify unified platform read API contracts
npm run verify:api-contracts

# Verify universal topic engine
npm run verify:topic-engine

# Verify assessment domain contracts (Phase 3A)
npm run verify:assessment-contracts

# Verify universal MCQ scoring boundary (Phase 3B)
npm run verify:assessment-scoring

# Verify universal MCQ payload adapter (Phase 3C)
npm run verify:assessment-adapter

# Verify universal MCQ delivery (Phase 3D)
npm run verify:assessment-delivery

# Verify assessment session lifecycle (Phase 3E)
npm run verify:assessment-session

# Verify assessment result/outcome boundary (Phase 3F)
npm run verify:assessment-result

# Verify Assessment Engine composition (Phase 3G)
npm run verify:assessment-engine

# Verify Assessment Engine integration gate (Phase 3H)
npm run verify:assessment-integration

# Verify learner intelligence (Phase 4)
npm run verify:learner-intelligence

# Verify learner intelligence integration gate (Phase 4B)
npm run verify:learner-intelligence-integration

# Verify search & knowledge retrieval foundation (Phase 5)
npm run verify:search

# Verify AI intelligence foundation (Phase 6A)
npm run verify:ai-intelligence

# Verify AI provider + grounded answering (Phase 6B)
npm run verify:ai-provider

# Verify grounded AI experience + RAG readiness (Phase 6C)
npm run verify:ai-grounded-answering

# Verify AI experience integration (Phase 6D)
npm run verify:ai-experience

# Verify multi-provider routing (Phase 6E)
npm run verify:ai-provider-routing

# Verify identity foundation (Phase 7A)
npm run verify:identity

# Verify entitlement & access foundation (Phase 7B)
npm run verify:phase7b

# Verify commerce foundation (Phase 7C)
npm run verify:phase7c

# Verify Phase 7 identity/entitlement/commerce integration gate (Phase 7D)
npm run verify:phase7

# Verify platform contracts (Phase 8B)
npm run verify:phase8b

# Verify HTTP transport (Phase 8C)
npm run verify:phase8c

# Verify API foundation hardening (Phase 8D)
npm run verify:phase8d

# Verify Phase 8 integration gate (Phase 8E)
npm run verify:phase8

# Phase 9A is design-only (docs/MOBILE.md). No mobile verifier.

# Verify shared client adapter (Phase 9B)
npm run verify:phase9b

# Verify client state and offline boundary (Phase 9C)
npm run verify:phase9c

# Verify Web client integration gate (Phase 9D)
npm run verify:phase9d

# Verify Phase 9 mobile foundation integration gate (Phase 9E)
npm run verify:phase9
```

---

## 5. Environment Handling

- Environment variables are template-driven via `.env.example`.
- Local development environment configurations are stored in `.env.local` (ignored by git).
- Never commit secrets or private keys to source control.
- Phase 6B provider: server-only `XAI_API_KEY` (optional `AI_PROVIDER_MODEL`,
  `AI_PROVIDER_TIMEOUT_MS`, `AI_PROVIDER_MAX_OUTPUT_TOKENS`). Never
  `NEXT_PUBLIC_*`.
- Phase 6D Ask experience: `/ai` (UX) and POST `/ai/ask` (JSON transport).
  The browser never calls a provider. Current AI functionality is public/free.
- Phase 6E routing: Gemini (`gemini-2.5-flash`) is primary; xAI is eligible
  fallback. Server-only `GEMINI_API_KEY` and `XAI_API_KEY`. Missing primary
  key shows unavailable and does not silently fallback. Never `NEXT_PUBLIC_*`.

---

## 6. Documentation Map

All active documentation is synchronized to the **V10.6** baseline:
- `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md` — Strategic North Star & Master Vision
- `AI_HANDOFF_V10_6.md` — Operational entry point and instructions for AI agents
- `ARCHITECTURE.md` — Concrete platform domains and architecture boundaries
- `CURRENT_STATE.md` — Actual repository reality (implemented vs. planned)
- `DEVELOPMENT_RULES.md` — Engineering constraints and development discipline
- `DOCUMENT_MAP.md` — Complete documentation graph and relationship guide
- `ROADMAP.md` — Phased evolution from Web Foundation to Mobile & Enterprise
- `SECURITY.md` — Threat model, security boundaries, and data protection rules
- `AGENTS.md` — AI development rules and Next.js / Sajib Atlas integration guidelines
- `CLAUDE.md` — Clean AI entry point for Claude agents
- `CONTRIBUTING.md` — Contribution standards and synchronization rules
- `docs/TOPIC_ENGINE.md` — Phase 2 Universal Topic Engine implementation notes

---

## 7. Repository-as-Source-of-Truth Principle

The **repository source code, runtime behavior, and test suites are the absolute implementation source of truth**.  
The Master Vision defines the strategic destination and architecture boundaries, but planned features must not be claimed as implemented unless verified in code.


