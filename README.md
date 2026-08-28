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
3. **Android & iOS Clients:** Native mobile clients consuming the shared platform contracts.
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
```

---

## 5. Environment Handling

- Environment variables are template-driven via `.env.example`.
- Local development environment configurations are stored in `.env.local` (ignored by git).
- Never commit secrets or private keys to source control.

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

---

## 7. Repository-as-Source-of-Truth Principle

The **repository source code, runtime behavior, and test suites are the absolute implementation source of truth**.  
The Master Vision defines the strategic destination and architecture boundaries, but planned features must not be claimed as implemented unless verified in code.


