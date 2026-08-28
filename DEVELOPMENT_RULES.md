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

## 5. Assessment Rules

Scoring must be deterministic and testable.

Question answer keys must not depend solely on client-side hidden state.

## 6. AI Rules

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
