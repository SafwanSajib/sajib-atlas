# Multi-Subject Canonical Content Pilot

**Date:** 2026-09-03  
**Status:** Controlled vertical-slice pilot  
**Scope:** Geography, English, and History

## 1. Pilot Objective

Prove that the approved universal content standard can represent and project
small, source-backed canonical learning objects across three subjects without
using the legacy Geography payload as a template.

The validated chain is:

```text
Canonical Content
→ Editorial/Provenance
→ Immutable Version/Lifecycle
→ Assessment Alignment
→ Search Projection
→ AI Grounding Projection
→ Learner References
→ Web/Mobile-safe JSON
```

This pilot is not a bulk content migration, production catalog replacement, or
new UI experience.

## 2. Topic Selection

| Subject | Pilot topic | Selection reason |
|---|---|---|
| Geography | The Water Cycle | Bounded foundational process with mechanism, comparison, global scope, and authoritative government/international sources |
| English | Subject-Verb Agreement | Demonstrates formula/rule, examples, misconception, exceptions, terminology, and register-sensitive usage |
| History | Adoption of the Universal Declaration of Human Rights | Bounded historical event with chronology, documented fact, post-war context, interpretation, and international sources |

The topics are new pilot identities under `topic/...` and do not reuse or
rewrite the existing Geography payload.

## 3. Canonical Content Examples

The implementation contains one `PilotPackage` per subject, each with:

- 3–5 Concepts;
- 4 KnowledgeUnits;
- measurable Objectives;
- selected semantic ContentBlocks;
- selective Claims;
- 3 Sources;
- SourceReferences;
- one assessment alignment.

KnowledgeUnits are coherent reusable semantic objects. They are not page
sections, cards, tabs, exam notes, or fixed lesson steps.

## 4. Schema Application

The pilot uses one shared model:

```text
Topic
→ Concept ↔ KnowledgeUnit
             → Objective
             → typed ContentBlock
             → selective Claim → SourceReference → Source
             → AssessmentAlignment
```

All packages use stable IDs, version `1`, and lifecycle `published`. Blocks are
selected by pedagogical meaning: Geography uses mechanism/comparison, English
uses formula-rule/example/exception/misconception/comparison, and History uses
chronology/cause-effect/definition/explanation.

No package requires a subject-specific universal field. Subject details are
namespaced extensions only.

## 5. Editorial Application

The pilot applies the approved editorial standard:

- objectives use observable verbs;
- content uses original, learner-appropriate language;
- claims are selective, not sentence-level records;
- facts, interpretations, and illustrative examples are labeled;
- exam and presentation structures are absent from canonical objects;
- current Geography is treated as legacy/reference only.

Optional enrichment is not forced. A unit can have one meaningful semantic
block, while a unit needing a rule and exception can contain several.

## 6. Provenance Application

Sources are authoritative or established institutional references:

- U.S. Geological Survey, NOAA, and UNESCO for Geography;
- Cambridge Dictionary Grammar, British Council, and Chicago Manual of Style
  for English;
- United Nations and OHCHR for History.

Each material claim has one or more SourceReferences with support type and
human-readable citation. The History significance statement is explicitly
`interpretation`, synthesized from identified sources, and assigned a conflict
group. The documented adoption date is a corroborated fact.

AI output is not a source.

## 7. Assessment Alignment

Every package includes a reference-only alignment from objectives and concepts
to a pilot assessment-set identifier. Alignments include the content version
but no answer key, correctness, score, response, attempt, or learner state.

The Assessment Engine remains the sole scoring authority. The pilot only proves
that assessment content can refer to canonical units without embedding
assessment implementation in the content model.

## 8. Search Projection

`projectPilotToSearch` deterministically projects Topic, Concept, and
KnowledgeUnit documents containing:

- canonical ID and subject/topic identity;
- title and aliases/keywords;
- semantic block text;
- content version and lifecycle.

Documents are sorted by canonical ID. No answers, learner state, private data,
or unsupported internal payload is projected. This is a pilot projection and
does not replace the existing Search implementation.

## 9. AI Grounding Projection

`projectPilotToAiGrounding` emits only published KnowledgeUnit blocks with
source references. Each row identifies subject, topic, concept, unit, block
type, content version, lifecycle, audience, interpretation status, and evidence
references.

Blocks carrying disputed or synthesized claims are excluded from authoritative
grounding in this pilot. Existing AI provider/retrieval architecture remains
unchanged; no vector retrieval, provider, agent, or API is added.

## 10. Learner Compatibility

`projectPilotToLearnerReferences` emits deterministic stable references in the
form `knowledgeUnitId@vcontentVersion`. Learner state is not embedded in the
pilot package. Existing completion, assessment history, performance, and study
progress authorities remain unchanged.

The references demonstrate future resume, completion, revision, and history
compatibility while preserving old learner records when a future version
supersedes version `1`.

## 11. Web/Mobile Projection

All pilot values are JSON-safe primitives and arrays. No HTML, CSS, route
layout, desktop assumption, or React component is stored in canonical content.
The same package and derived projections can be consumed by Web and future
mobile clients. No mobile implementation is included.

## 12. Cross-Subject Comparison

| Subject | Universal core | Optional structures | Extension | Projections |
|---|---|---|---|---|
| Geography | Topic, Concept, Unit, Objective, semantic block, claim/source | scope, comparison | spatial metadata | search, AI, learner |
| English | Topic, Concept, Unit, Objective, formula-rule/example/exception | audience, register context | grammar metadata | search, AI, learner |
| History | Topic, Concept, Unit, Objective, chronology, claim/source | validity, interpretation/conflict | actor/event metadata | search, AI, learner |

English convention differences are labeled as interpretation/context. History
interpretation and conflict are explicit. Geography scope is represented as
metadata/extension. No Geography-specific field leaked into the core.

## 13. Quality Gate Results

| Dimension | Geography | English | History |
|---|---|---|---|
| Identity and stable IDs | PASS | PASS | PASS |
| Lifecycle/version/publication | PASS | PASS | PASS |
| KnowledgeUnit integrity | PASS | PASS | PASS |
| ContentBlock validity | PASS | PASS | PASS |
| Sources and provenance | PASS | PASS | PASS |
| Claim classification | PASS | PASS | PASS |
| Assessment alignment | PASS | PASS | PASS |
| Search projection | PASS | PASS | PASS |
| AI grounding eligibility | PASS | PASS | PASS |
| Learner/version references | PASS | PASS | PASS |

The focused verifier blocks duplicate/empty identities, missing evidence,
unknown references, invalid publication metadata, version mismatch, missing
assessment alignment, and projection nondeterminism. Optional pedagogical
enrichment is not treated as a blocking requirement.

## 14. Legacy Geography Implications

The current Geography payload remains legacy/reference material. It was not
read into the pilot model, rewritten, migrated, deleted, or promoted. Any
future reuse must pass source verification, restructuring, editorial review,
academic review where required, technical validation, and publication gates.

No bulk migration decision is made here.

## 15. Findings

1. The universal core represents all three subjects without presentation
   coupling.
2. A small typed-block vocabulary is expressive without requiring a fixed
   sequence.
3. Selective claims and SourceReferences provide citation-ready evidence
   without a sentence-level citation graph.
4. Assessment alignment remains safely reference-only.
5. Search, AI, and learner outputs can be deterministic projections.
6. History requires explicit interpretation/conflict handling; English requires
   convention/register context; Geography benefits from scoped extensions.
7. The existing production catalog remains intentionally separate until a
   reviewed migration boundary exists.

## 16. Required Schema/Editorial Changes

No blocking schema change was discovered. The implementation confirms the
approved rules that blocks are optional by type, summary is optional metadata,
context is a mapping, localization is a variant, and published versions are
immutable.

Before broad production adoption, the Editorial + Source/Provenance
Specification should define the source quality rubric, reviewer evidence,
translation workflow, conflict resolution policy, and pilot acceptance evidence
retention. These are editorial follow-ups, not pilot blockers.

## 17. Final Verdict

**PILOT PASSED — READY FOR AUTOMATED CONTENT QUALITY GATE**

All three subjects use the same universal foundation, mandatory structural and
provenance checks pass, no hidden Geography template is required, and existing
Topic, Assessment, Search, AI, Learner, and delivery authorities remain intact.
