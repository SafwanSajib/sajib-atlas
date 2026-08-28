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

# DOCUMENT_MAP.md — V10.6 DOCUMENTATION GRAPH

## Authority Graph

```text
                    MASTER VISION V10.6
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
   ARCHITECTURE        ROADMAP            PRINCIPLES
        │                  │
        ├──────────┬───────┼───────────┐
        │          │       │           │
   DEVELOPMENT  SECURITY  CURRENT     AGENTS
     RULES                STATE
        │
        └──────────── DOCUMENT MAP
```

## Files

### `SAJIB_ATLAS_Universal_Master_Vision_v10_6.md`
Strategic destination and constitutional product/business architecture.

### `AGENTS.md`
Instructions for AI/software agents working in the repository.

### `ARCHITECTURE.md`
Concrete architectural boundaries and domain relationships.

### `CURRENT_STATE.md`
What is actually implemented now.

### `DEVELOPMENT_RULES.md`
Engineering constraints and implementation discipline.

### `ROADMAP.md`
Prioritized evolution sequence.

### `SECURITY.md`
Security, privacy, AI safety, abuse prevention, and commercial integrity.

### `DOCUMENT_MAP.md`
Relationship and authority map for the documentation set.

## Version Rule

All files in this set are **V10.6**.

If the Master Vision changes version:

1. update the Master Vision
2. update document-control headers
3. review architecture
4. review current state
5. review roadmap
6. review security
7. review agents/rules
8. update this map

No document may silently claim a different architecture baseline.

## Conflict Rule

Implementation reality beats vision.

Security constraints beat convenience.

Canonical knowledge beats duplicated presentation data.

Current state is factual, not aspirational.
