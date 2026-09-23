# Automated Content Quality Gate

**Date:** 2026-09-03  
**Status:** Phase 10 machine-verifiable content safety firewall

## 1. Purpose

The Automated Content Quality Gate validates canonical content packages before
publication. It detects machine-verifiable structural, provenance, lifecycle,
assessment-separation, projection-safety, learner-reference, and universal-core
violations.

It is not a CMS, AI evaluator, publication UI, or replacement for human
editorial and academic review. A passing report means only that mandatory
machine checks passed.

## 2. Architecture

```text
CanonicalContent/PilotPackage
        ↓
independent validators
        ↓
ContentQualityReport
```

The gate consumes content and produces a deterministic report. It does not own
canonical content, scoring, learner state, Search ranking, AI generation,
authentication, commerce, or publication UI.

Implementation is in `src/lib/content-quality/`. The gate consumes the
approved pilot package under `src/lib/content/pilot/` and can be reused for
future packages using the same canonical model.

## 3. Validation Dimensions

The gate reports independent dimensions:

1. identity/structure;
2. KnowledgeUnit integrity;
3. ContentBlock integrity;
4. Objective integrity;
5. Claim integrity;
6. Source/provenance integrity;
7. Fact/interpretation classification;
8. time/scope metadata;
9. version/lifecycle;
10. assessment alignment;
11. Search eligibility;
12. AI grounding eligibility;
13. learner compatibility;
14. universal-core integrity;
15. publication readiness.

Each dimension contains stable issue code, severity, path, and message.

## 4. Blocker vs Warning Model

`blocker` prevents publication. `warning` records a non-blocking deficiency.
Dimension status is `pass`, `warning`, or `blocked`; overall status is blocked
when any blocker exists.

Blockers include missing identity/version, invalid lifecycle, duplicate IDs,
malformed units/blocks, dangling claims or sources, missing evidence for
material claims, invalid assessment references, answer/scoring leakage,
unpublished AI content, invalid learner references, private-data leakage, and
presentation-specific fields in the universal core.

Warnings include optional enrichment such as absent aliases. The gate does not
invent warnings for academic judgments it cannot determine.

## 5. Publication Decision

```text
BLOCKED  → cannot publish
WARNING  → policy may permit publication after editorial decision
PASS     → machine-verifiable mandatory requirements passed
```

Human editorial and academic review remains authoritative for truth, clarity,
disciplinary correctness, source quality, safety, and interpretation.

## 6. Determinism

Validators are pure and use no network, current time, random values, AI calls,
external services, or mutable environment state. The same package produces the
same report, dimensions, issue order, projections, and eligibility decisions.
Future freshness checks must receive an explicit reference date.

## 7. Human-Review Boundary

The gate validates declared structure and editorial metadata. It does not infer
truth from prose, decide whether a source is academically correct, resolve
historical disagreement, grade pedagogy, or replace source/academic review.
Those decisions remain in the approved Editorial + Source/Provenance process.

## 8. Search Boundary

Search eligibility checks that published content can produce a safe deterministic
projection and rejects answer keys, learner state, private fields, secrets, and
unsupported payload. Search normalization, ranking, and retrieval remain owned
by the Search subsystem.

## 9. AI Boundary

AI grounding eligibility requires published content, valid structure,
provenance, no blockers, and safe grounding projection. Draft, failed, disputed,
or unsupported material is not authoritative AI grounding. The gate never calls
an LLM, provider, vector store, or external retrieval service.

## 10. Assessment Boundary

Assessment checks validate reference-only alignments to topic/concept/unit
identities and content version. They reject answer keys, correctness, scores,
formulas, response state, and attempts. Assessment Engine remains the sole
delivery, correctness, scoring, session, and result authority.

## 11. Learner Boundary

Learner checks validate only stable `KnowledgeUnit@version` references produced
from canonical content. The gate never reads, mutates, scores, or derives
learner state. Learner completion, assessment history, performance, and
revision remain their existing authorities.

## 12. Cross-Subject Rules

The gate uses universal identity, semantic blocks, objectives, claims,
provenance, lifecycle, projections, and references for Geography, English, and
History. It does not hardcode Geography fields. Subject-specific fields must
remain explicitly namespaced extensions and cannot become required core fields.

Presentation terms such as HTML, sidebar, page section, accordion, exam note,
and quick revision are not universal content fields.

## 13. Test Strategy

`npm run verify:content-quality` loads the three pilot packages and asserts:

- all pilot packages pass;
- Search and AI eligibility are deterministic;
- legacy Geography-shaped input is not accepted;
- missing identity;
- duplicate KnowledgeUnit ID;
- malformed ContentBlock;
- dangling Claim source;
- missing mandatory provenance;
- invalid lifecycle;
- invalid version;
- invalid assessment reference;
- AI-ineligible draft;
- Search/private-data leak;
- invalid learner reference;
- universal-core violation;
- warning-only optional enrichment.

The existing `verify:content-pilot`, content, knowledge, Search, Assessment,
Learner Intelligence, Phase 7/8/9/9F, and AI verifiers remain separate
regression checks.

## 14. Known Limitations

- The gate verifies declared provenance structure, not scholarly truth.
- It does not perform semantic natural-language correctness or conflict
  resolution.
- Pilot assessment IDs are structural references and are not registered in the
  production Assessment catalog.
- Freshness validation is structural; future callers must inject review dates
  and policy.
- The pilot package is intentionally separate from the legacy production
  catalog; no migration or delivery integration is implied.

## 15. Future Extension Boundary

Future packages may add typed, namespaced extensions and dedicated validators
only when the universal schema explicitly declares them. Extensions must remain
optional, JSON-safe, versioned, and referential. They cannot add answer keys,
learner state, scoring, provider credentials, or presentation authority.

The next phase is the Canonical Content Production Pipeline. Large-scale
Geography retirement or rebuilding remains a later controlled activity.
