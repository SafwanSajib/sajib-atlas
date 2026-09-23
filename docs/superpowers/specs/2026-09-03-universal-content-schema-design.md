# Universal Content Schema Design

**Date:** 2026-09-03  
**Status:** Design specification for review  
**Scope:** Universal academic content; no production migration

## 1. Executive Summary

Sajib Atlas needs a semantic content model that can represent Geography,
History, International Affairs, English, Mathematics, Science, examinations,
and institutional learning without making Geography's page-shaped payload the
template. This specification defines a small universal core, typed semantic
blocks, selective claim provenance, immutable published versions, and loose
assessment alignment.

Existing Geography content is legacy/reference material and is NOT the
canonical quality standard. It remains untouched until this model, its
editorial/source rules, and a cross-subject pilot are approved.

## 2. Design Goals

- Represent reusable academic knowledge independently of pages and routes.
- Keep one canonical identity model and avoid duplicated content.
- Support conceptual, procedural, historical, linguistic, mathematical, and
  scientific learning.
- Make source support, interpretation, scope, and time validity explicit.
- Produce deterministic Search and AI grounding projections.
- Preserve stable references for learner progress and content versions.
- Keep assessment correctness and learner performance outside content.
- Remain JSON-safe and usable by Web, future Android, and future iOS clients.
- Keep the core small; place subject details in validated extensions.

## 3. Non-Goals

- No TypeScript production contract implementation.
- No Geography rewrite, migration, deletion, or normalization.
- No CMS, database, authentication, synchronization, or API changes.
- No Assessment Engine, Search, AI, Topic Engine, or learner-state rewrite.
- No generated text becoming canonical content automatically.
- No universal page layout or mandatory subject-specific fields.

## 4. Architecture Boundaries

| Boundary | Owns | Must not own |
|---|---|---|
| Content catalog | Discipline, Subject, Category, Topic identity | Page state or learner state |
| Knowledge content | Concepts, KnowledgeUnits, semantic blocks, objectives | Answer keys or attempts |
| Editorial/provenance | Sources, claims, review and publication evidence | Learner performance |
| Assessment Engine | Delivery, answer keys, correctness, scoring, results | Canonical explanations |
| Learner Intelligence | Assessment interpretation and revision projections | Content authoring |
| Learner state | Study continuity, completion, local history | Canonical content |
| Search | Deterministic retrieval projection | Canonical content authority |
| AI | Grounded generated responses | Canonical facts or publication |
| Platform/client | Transport, envelopes, cache, projection | Domain scoring or publication |

## 5. Canonical Entity Model

### Discipline

**Purpose:** Top-level academic or institutional domain.  
**Owner:** Content catalog.  
**Identity:** Globally unique, stable slug ID such as `discipline/science`.  
**Required:** `id`, `slug`, `title`.  
**Optional:** `description`, `aliases`, `metadata`.  
**Relationships:** Owns Subjects.  
**Lifecycle/version:** Catalog lifecycle; versioned only when metadata changes.  
**Must not contain:** Study prose, questions, answer keys, learner state.

### Subject

**Purpose:** Curriculum or examination subject within a Discipline.  
**Owner:** Content catalog.  
**Identity:** Globally unique `subjectId`, compatible with existing subject IDs.  
**Required:** `id`, `disciplineId`, `slug`, `title`.  
**Optional:** `description`, `aliases`, `audiences`.  
**Relationships:** Belongs to Discipline; contains Topics.  
**Must not contain:** Duplicated KnowledgeUnits or assessment answers.

### Category

**Purpose:** Optional grouping for navigation or curriculum organization.  
**Owner:** Content catalog.  
**Identity:** Globally unique `categoryId`.  
**Required:** `id`, `subjectId`, `slug`, `title` when used.  
**Optional:** `description`, `order`.  
**Relationships:** Belongs to Subject; groups Topics.  
**Lifecycle/version:** Catalog metadata.  
**Must not contain:** Required semantic content; categories may be absent.

### Topic

**Purpose:** Stable learner-facing content address and composition boundary.  
**Owner:** Content catalog.  
**Identity:** Existing `${subjectId}/${slug}` remains stable and human-readable.  
**Required:** `id`, `subjectId`, `title`, `contentVersion`, `lifecycle`,
`conceptIds`, `knowledgeUnitIds`.  
**Optional:** `categoryId`, `summary`, `aliases`, `objectiveIds`,
`assessmentAlignmentIds`, `scope`, `audience`, `level`.  
**Relationships:** References Concepts, KnowledgeUnits, Objectives, and
AssessmentAlignments.  
**Lifecycle:** `draft`, `review`, `published`, `deprecated`, `archived`,
`replaced`.  
**Must not contain:** Page sections, answer keys, attempts, learner progress,
or generated AI output.

### Concept

**Purpose:** Reusable semantic idea, term, rule, process, entity, or principle.  
**Owner:** Knowledge catalog.  
**Identity:** Globally unique stable ID; existing topic-bound IDs remain valid
for compatibility, while future shared concepts use a stable global namespace.  
**Required:** `id`, `title`, `definition`, `topicIds`.  
**Optional:** `aliases`, `relatedConceptIds`, `prerequisiteConceptIds`,
`scope`, `sourceReferenceIds`.  
**Relationships:** Many-to-many with Topics and KnowledgeUnits.  
**Invariants:** Prerequisite and related-concept graphs must be acyclic where
the relationship is directional; references must resolve.  
**Must not contain:** Assessment correctness or learner mastery.

### KnowledgeUnit

**Purpose:** Smallest reusable canonical learning object. It is semantic, not a
page, route, screen, component, or Geography section.  
**Owner:** Knowledge content.  
**Identity:** Globally unique stable `knowledgeUnitId`; immutable identity across
revisions.  
**Required:** `id`, `title`, `summary`, `conceptIds`, `objectiveIds`, `blocks`,
`contentVersion`, `lifecycle`.  
**Optional:** `topicIds`, `prerequisiteUnitIds`, `audience`, `level`, `scope`,
`claimIds`, `sourceReferenceIds`, `extension`.  
**Relationships:** May be reused by multiple Topics when scope and meaning are
compatible; references Concepts and Objectives.  
**Lifecycle/version:** Published versions are immutable; replacement creates a
new version related by `supersedes`.  
**Must not contain:** UI layout, answer keys, learner attempts, revision
priority, or generated output marked canonical.

### Objective

**Purpose:** Measurable learner outcome.  
**Owner:** Content/editorial model.  
**Identity:** Stable globally unique ID, normally scoped by unit or topic.  
**Required:** `id`, `verb`, `statement`, `level`.  
**Optional:** `conceptIds`, `knowledgeUnitIds`, `assessmentAlignmentIds`.  
**Allowed verbs:** `know`, `recall`, `explain`, `distinguish`, `apply`,
`calculate`, `analyze`, `evaluate`.  
**Must not contain:** Marketing claims, learner completion, scores, or
psychological predictions.

### ContentBlock

**Purpose:** Typed semantic material inside a KnowledgeUnit.  
**Owner:** Knowledge content.  
**Identity:** Stable block ID within a KnowledgeUnit version.  
**Required:** `id`, `type`, `order`, and type-specific payload.  
**Optional:** `claimIds`, `sourceReferenceIds`, `objectiveIds`, `extension`.  
**Must not contain:** Page-layout instructions, answer keys, learner state, or
unreviewed generated prose presented as fact.

### Claim

**Purpose:** Independently supportable factual or assertive proposition; it is
not every sentence.  
**Owner:** Editorial/provenance layer.  
**Identity:** Globally unique stable claim ID.  
**Required:** `id`, `statement`, `kind`, `supportStatus`, `interpretationStatus`,
`sourceReferenceIds`, `reviewStatus`.  
**Optional:** `scope`, `validity`, `notes`, `conflictGroupId`.  
**Kinds:** `factual`, `statistical`, `historical`, `scientific`,
`definition`, `time-sensitive`, `geographic`, `interpretive`.  
**Support status:** `direct`, `synthesized`, `contextual`, `disputed`,
`unsupported`. Only approved supported statuses may enter published grounding.  
**Must not contain:** Assessment correctness or AI-generated authority.

### Source

**Purpose:** External or editorial origin used to support content.  
**Owner:** Editorial/provenance layer.  
**Identity:** Globally unique stable source ID; never only a URL.  
**Required:** `id`, `type`, `title`, `publisherOrOrganization`,
`reference`, `language`.  
**Optional:** `author`, `publicationDate`, `accessedDate`, `url`,
`editionOrVersion`, `scope`.  
**Types:** `government`, `international-organization`, `university`,
`academic-paper`, `textbook`, `exam-document`, `reference-editorial`,
`repository-editorial`.  
**Must not contain:** Claims copied without context, learner data, or provider
credentials.

### Evidence/SourceReference

**Decision:** Use an embedded, first-class-by-ID `SourceReference`, not a
separate citation graph.  
**Purpose:** Connect a Claim or block to a Source with citation-ready context.  
**Required:** `id`, `sourceId`, `supportType`, `citation`.  
**Optional:** `locator`, `quote`, `scope`, `validity`, `reviewerNote`.  
**Support types:** `direct`, `synthesized`, `contextual`.  
**Relationships:** A claim may have many references; a source may support many
claims. Conflicts use `conflictGroupId` on claims rather than graph edges.  
**Must not contain:** A new source identity, score, or generated answer.

### AssessmentAlignment

**Purpose:** Loose alignment between objectives/content and an assessment set
or item.  
**Owner:** Content/assessment integration boundary.  
**Identity:** Stable ID for the alignment record.  
**Required:** `id`, `objectiveIds`, `conceptIds`, `knowledgeUnitIds`,
`assessmentSetId`.  
**Optional:** `assessmentItemId`, `skill`, `contentVersion`.  
**Must not contain:** Answer keys, correctness, attempts, or scores.

### ContentVersion/Lifecycle metadata

**Purpose:** Govern publication and historical identity.  
**Owner:** Editorial/content catalog.  
**Required:** `version`, `lifecycle`, `publishedAt` for published versions,
`provenanceStatus`.  
**Optional:** `supersedes`, `replacedBy`, `correctionOf`, `reviewedAt`,
`reviewerId`, `effectiveFrom`, `effectiveUntil`.  
**Invariant:** Published versions are immutable. A correction or source update
creates a new version.

## 6. Identity Model

- IDs are deterministic, stable, and JSON-safe.
- Existing topic IDs `${subjectId}/${slug}` are preserved.
- Discipline, Subject, Category, Topic, KnowledgeUnit, Objective, Claim, Source,
  and Alignment IDs are globally unique in their namespace.
- Concept IDs may retain existing topic scope for compatibility; new shared
  concepts use a global namespace and explicit topic relationships.
- IDs are human-readable where existing compatibility requires it; version
  identifiers are explicit metadata, not part of topic identity.
- IDs are immutable. Titles, labels, and content may change in a new version.
- Runtime UUIDs and array indexes are not canonical identity.

## 7. Hierarchy

```text
Discipline
  → Subject
    → Category? 
      → Topic
        → Concept ↔ KnowledgeUnit
                      → Objective
                      → ContentBlock
                      → Claim → SourceReference → Source
                      → AssessmentAlignment → AssessmentSet/Item
```

Category is optional. Concepts and KnowledgeUnits are references, not owned
copies. Cross-topic reuse requires compatible scope, audience, language, and
version metadata. Prerequisite relationships must be validated as acyclic.

## 8. KnowledgeUnit

KnowledgeUnit remains the canonical name because it covers a process, event,
grammar rule, formula, mechanism, case study, comparison, misconception, and
exam-oriented explanation without implying a page or a teaching schedule.

A unit must state its purpose through its title, summary, objectives, and typed
blocks. It may combine several blocks, but no block name may be required for
every subject. A unit can be reused by multiple topics through references.

## 9. Objective

Objectives are measurable outcomes scoped to a Topic or KnowledgeUnit and may
align to concepts and assessments. They must use an observable verb and a
specific statement. “Understand the topic” is invalid because it is not
observable; “distinguish X from Y using two defining properties” is valid.

## 10. ContentBlock

Canonical semantic block types:

- `definition`: term, meaning, boundaries, and optional usage.
- `explanation`: structured teaching text for a concept or relationship.
- `mechanism-process`: ordered stages, inputs, outputs, and conditions.
- `chronology`: ordered events with dates or sequence labels.
- `classification`: named groups and distinguishing criteria.
- `comparison`: structured dimensions with values for compared subjects.
- `cause-effect`: causes, effects, conditions, and relationship direction.
- `example`: clearly labeled illustration of a concept or rule.
- `case-study`: scoped real-world instance with context and evidence.
- `formula-rule`: expression, variables, units, conditions, and explanation.
- `exception`: rule boundary and the condition that changes application.
- `misconception`: misconception, correction, and supporting explanation.
- `procedure-derivation`: ordered reasoning steps, assumptions, and result.

`exam-note` and `quick-revision` are contextual/projection-oriented forms, not
required universal block types. `source-note` is provenance metadata. No block
represents page layout.

## 11. Claim

Claims are selective. A claim is used where independent verification,
time/scope handling, or disagreement matters. Pedagogical transitions and
clearly labeled illustrative examples do not require claim records by default.

`interpretationStatus` distinguishes `fact`, `interpretation`, `synthesis`,
`illustrative`, and `disputed`. A disputed historical interpretation cannot be
published as an objective fact. Statistical and time-sensitive claims require
scope, date, unit, and validity metadata.

## 12. Source

Sources require stable identity and bibliographic context. A URL is a locator,
not the identity. Sources may be authoritative, textbook, institutional,
academic, exam, or editorial. Source quality is evaluated by type, provenance,
recency, scope, and reviewer status.

## 13. Evidence/SourceReference

SourceReference is the smallest sufficient evidence model. It supports multiple
sources, direct/synthesized/contextual support, citation locators, and explicit
conflicts without creating a general citation graph. Claims may remain
unpublished when support is absent or unresolved.

## 14. Fact vs Interpretation

Canonical content distinguishes:

- **Verified fact:** supported proposition within stated scope.
- **Interpretation:** analysis attributed to a source or editorial position.
- **Synthesis:** supported combination of multiple claims.
- **Pedagogical explanation:** teaching language derived from approved content.
- **Illustrative example:** clearly labeled example, not automatically factual.
- **Disputed claim:** competing support or unresolved disagreement.

Generated AI output is always non-canonical.

## 15. Scope/Time Validity

Use universal metadata:

- `scope.kind`: `geographic`, `institutional`, `demographic`, `disciplinary`,
  or `other`;
- `scope.value`: canonical reference or explicit bounded label;
- `validity.effectiveFrom`;
- `validity.effectiveUntil`;
- `validity.reviewBy`.

These fields apply equally to a country statistic, institutional rule,
historical interpretation, scientific condition, or demographic statement.

## 16. Version/Lifecycle

Lifecycle is:

```text
draft → review → published → deprecated → archived
                                  ↘ replaced
```

Published Topic and KnowledgeUnit versions are immutable. A new version records
`supersedes`; a correction records `correctionOf`; replacement records
`replacedBy`. Topic versions may compose unit versions. Unit changes that affect
meaning require a new unit version; presentation-only changes may use a new
projection revision.

Search indexes and AI retrieval use only approved published versions. Assessment
history retains the content version used. Learner progress retains stable unit
and version references. Offline caches retain version metadata. Archived content
remains historically addressable but is not newly delivered.

## 17. Assessment Alignment

Alignment is reference-only:

```text
Objective ↔ Concept ↔ KnowledgeUnit ↔ AssessmentSet / AssessmentItem
```

The content schema may identify expected skill, objective, concept, unit, and
content version. The Assessment Engine alone owns delivery, answer keys,
correctness, scoring, sessions, and results. This works for MCQ, true/false,
matching, short answer, numerical problems, grammar correction, and future
modalities.

## 18. AI Grounding Projection

The projection must expose `title`, `topicId`, `conceptId`,
`knowledgeUnitId`, block type, claim IDs, source references, content version,
lifecycle, scope, validity, interpretation status, audience, level, and
canonical/generated status.

Only published, reviewed, source-supported content is authoritative grounding.
Unsupported commentary and assessment feedback are distinguishable. Generated
responses never write back to canonical content.

## 19. Search Projection

Deterministic SearchDocuments may be generated from title, aliases, canonical
IDs, concepts, keywords, semantic text, terminology, exam terminology, source
terminology, subject/category/topic references, and content version.

Search must consume semantic projections and never parse Geography-specific
presentation fields. KnowledgeUnit and concept documents can be added
additively to the existing Search model.

## 20. Learner Compatibility

Learner progress may reference `topicId`, `conceptId`, `knowledgeUnitId`,
`objectiveId`, and `contentVersion`. Minimum stable resume identity is
`topicId + contentVersion`; unit-level resume requires a published stable
KnowledgeUnit ID.

Completion remains learner-state authority. Assessment history remains canonical
AssessmentResult/Learner Intelligence data. Revision and performance are not
content fields. Content replacement preserves historical progress and results;
new activity targets the current published version.

## 21. Extension Model

```text
Universal Core
+ validated subject extension
```

Extensions must be namespaced, optional, JSON-safe, schema-versioned, and
validated independently. They may not be required by a universal entity or
change universal identity semantics.

Examples:

- Geography: spatial coordinates, map layers, region metadata.
- Mathematics: symbolic variables, expression trees, units.
- Chemistry: chemical notation, reaction metadata.
- English: grammar features, register, usage constraints.
- History: actor, event, treaty, interpretation metadata.

Extensions reference core IDs and must not duplicate canonical content.

## 22. Canonical JSON Examples

These are design examples only and are not production content.

### Geography KnowledgeUnit

```json
{
  "id": "unit/geography/sample-process",
  "title": "A physical process",
  "summary": "A reusable explanation of a process and its observable effects.",
  "conceptIds": ["concept/geography/sample-process"],
  "objectiveIds": ["objective/unit/geography-explain-process"],
  "blocks": [
    {
      "id": "block-1",
      "type": "mechanism-process",
      "order": 1,
      "stages": ["input condition", "transformation", "observable outcome"],
      "claimIds": ["claim/geography/sample-process"]
    }
  ],
  "contentVersion": 1,
  "lifecycle": "published",
  "extension": {
    "namespace": "geography",
    "spatialScope": "region/example"
  }
}
```

### History KnowledgeUnit

```json
{
  "id": "unit/history/sample-event",
  "title": "A historical event",
  "summary": "An event described with actors, sequence, causes, and consequences.",
  "conceptIds": ["concept/history/sample-event"],
  "objectiveIds": ["objective/unit/history-analyze-causation"],
  "blocks": [
    {
      "id": "block-1",
      "type": "chronology",
      "order": 1,
      "events": ["earlier event", "turning point", "later consequence"],
      "claimIds": ["claim/history/sample-event"]
    },
    {
      "id": "block-2",
      "type": "cause-effect",
      "order": 2,
      "causes": ["condition A"],
      "effects": ["outcome B"],
      "interpretationStatus": "interpretation"
    }
  ],
  "contentVersion": 1,
  "lifecycle": "published",
  "extension": {
    "namespace": "history",
    "actors": ["actor/example"]
  }
}
```

### English KnowledgeUnit

```json
{
  "id": "unit/english/sample-rule",
  "title": "A grammar rule",
  "summary": "A rule with conditions, examples, and an exception.",
  "conceptIds": ["concept/english/sample-rule"],
  "objectiveIds": ["objective/unit/english-distinguish-usage"],
  "blocks": [
    {
      "id": "block-1",
      "type": "formula-rule",
      "order": 1,
      "expression": "condition → form",
      "conditions": ["condition example"],
      "explanation": "Rule explanation"
    },
    {
      "id": "block-2",
      "type": "exception",
      "order": 2,
      "condition": "exception condition",
      "explanation": "Why the exception applies"
    }
  ],
  "contentVersion": 1,
  "lifecycle": "published",
  "extension": {
    "namespace": "english",
    "register": "academic"
  }
}
```

### Mathematics/Science KnowledgeUnit

```json
{
  "id": "unit/science/sample-law",
  "title": "A quantitative principle",
  "summary": "A principle with variables, constraints, and a derivation.",
  "conceptIds": ["concept/science/sample-law"],
  "objectiveIds": ["objective/unit/science-apply-principle"],
  "blocks": [
    {
      "id": "block-1",
      "type": "formula-rule",
      "order": 1,
      "expression": "q = f(a, b)",
      "variables": [
        {"symbol": "q", "meaning": "quantity", "unit": "unit"}
      ],
      "conditions": ["condition example"],
      "explanation": "Meaning of the relationship"
    },
    {
      "id": "block-2",
      "type": "procedure-derivation",
      "order": 2,
      "steps": ["state assumption", "substitute values", "interpret result"]
    }
  ],
  "contentVersion": 1,
  "lifecycle": "published",
  "extension": {
    "namespace": "science",
    "model": "domain-specific-model"
  }
}
```

## 23. Universality Proof

| Example | Universal fields | Optional fields | Extension fields |
|---|---|---|---|
| Geography process | Topic, Concept, KnowledgeUnit, mechanism-process, Objective | Scope, claims, case study | Spatial scope/map metadata |
| Historical event | KnowledgeUnit, chronology, cause-effect, Claim, SourceReference | Interpretation, validity | Actors/event metadata |
| English grammar rule | KnowledgeUnit, formula-rule, exception, example, Objective | Audience, terminology | Grammar register/features |
| Mathematical formula | KnowledgeUnit, formula-rule, procedure-derivation, Objective | Variables, units, conditions | Symbolic representation |
| Scientific mechanism | KnowledgeUnit, mechanism-process, explanation, Claim | Model limits, evidence | Scientific notation/model |
| Case study | KnowledgeUnit, case-study, scope, claims | Sources, validity | Domain-specific case metadata |
| Misconception | KnowledgeUnit, misconception, explanation, Objective | Sources | None required |
| Exam-oriented content | Objective, KnowledgeUnit, exam-context projection, Alignment | Audience/level | Exam metadata |

No example requires a Geography-only field in the universal core.

## 24. Minimality Review

| Entity/feature | Classification |
|---|---|
| Discipline, Subject, Topic | CORE |
| Category | CORE optional |
| Concept | CORE |
| KnowledgeUnit | CORE |
| Objective | CORE |
| ContentBlock | CORE |
| Claim | CORE optional |
| Source | CORE editorial dependency |
| SourceReference | CORE optional evidence relation |
| ContentVersion/Lifecycle | CORE governance |
| AssessmentAlignment | CORE reference boundary |
| Exam context, audience, level, localization | EXTENSION/metadata |
| Search document | PROJECTION |
| AI grounding excerpt | PROJECTION |
| Review workflow | EDITORIAL |
| Answer key, correctness, score, attempts | ASSESSMENT-ONLY |
| Study progress, completion, mastery/performance | LEARNER-ONLY |
| Page layout sections | NOT REQUIRED |
| Sentence-by-sentence claim graph | NOT REQUIRED |

## 25. Compatibility Review

- Existing `${subjectId}/${slug}` topic identity remains compatible.
- `ContentMetadata` maps to version/lifecycle/provenance metadata.
- Topic Engine can compose the new references without owning content blocks.
- Assessment Engine receives alignment and version references only.
- Learner Intelligence receives results, not content internals.
- Search adds KnowledgeUnit projections without changing its authority.
- AI receives published semantic projections and source-backed references.
- Content Delivery can expose published JSON-safe projections.
- Platform envelopes and client/cache boundaries remain unchanged.
- Future mobile clients consume the same projections and stable IDs.

Required future integration points are additive: manifest references,
KnowledgeUnit/search projections, AI grounding projection, and learner
progress references to stable unit/version IDs.

## 26. Migration Boundary

The old Geography payload remains legacy/reference material. There is no
automatic migration, field-by-field conversion plan, or deletion in this
specification. Existing Geography data is not the quality baseline.

Future migration must be a separate controlled phase after schema approval,
editorial/source specification, cross-subject pilot validation, and automated
quality-gate implementation. Factual reuse is permitted only after it passes
the new provenance and quality requirements.

## 27. Risks

1. **Legacy-template drift:** fixed Geography fields reappear in the core.
   Detect by cross-subject fixtures; mitigate with extension-only rules.
2. **Over-modeling:** every sentence becomes a claim or every page section a
   block. Detect through schema review; mitigate with selective claims and
   semantic blocks.
3. **Fact/interpretation collapse:** disputed history becomes fact. Detect via
   review checks; mitigate with explicit statuses and conflict groups.
4. **Version mutation:** published content changes in place. Detect through
   immutable-version validation; mitigate with superseding versions.
5. **Assessment coupling:** answer keys or score fields enter content. Detect
   contract checks; mitigate with reference-only alignment.
6. **AI authority leakage:** generated text is treated as canonical. Detect
   provenance/status validation; mitigate with published-source requirements.
7. **Unstable learner references:** units are renamed or deleted casually.
   Detect identity checks; mitigate with immutable IDs and replacement links.
8. **Subject extension leakage:** one extension becomes universally required.
   Detect schema dependency checks; mitigate with namespaced optional extensions.

## 28. Open Decisions

The following require approval in the next Editorial + Source/Provenance
Specification stage:

1. Exact source confidence rubric and reviewer roles.
2. Minimum block/objective requirements by audience and academic level.
3. Whether concept IDs should be globally migrated beyond existing topic scope.
4. Exact localization/translation relationship between unit versions.
5. Canonical mathematical notation representation.
6. Source-conflict editorial resolution policy.
7. Publication authority and review evidence requirements.
8. Whether `exam-note` is stored canonically or generated as a projection.
9. The first Geography and non-Geography pilot topics.
10. Retention policy for legacy Geography after pilot approval.

## Schema Architecture Review

### Findings

The proposed `KnowledgeUnit` is semantic rather than presentation-oriented,
provided that its blocks remain an unordered-by-meaning collection with an
optional editorial order. A unit may contain one representation, several
complementary representations, or only the representation needed for its
objective. It may be smaller than a lesson and may be reused by reference in
another Topic without copying.

The model works for a theorem, grammar rule, historical event, scientific
mechanism, geographical process, case study, and conceptual distinction. The
core does not require a summary, a fixed block sequence, an exam note, or a
quick-revision field. `summary` is therefore optional editorial metadata; a
unit can be valid with a title, objective or concept relationship, and one
meaningful semantic block.

The block names are semantic affordances, not a curriculum template. They do
not imply that every Topic or unit has any particular block, and renderers may
combine, omit, reorder, or transform them for different experiences.

### Required revisions

The following clarifications are normative:

1. `KnowledgeUnit.blocks` is non-empty but has no required block types.
2. `summary`, `audience`, `level`, `scope`, and `prerequisites` are optional
   metadata or relationships, not required lesson fields.
3. `objectives`, `concepts`, `claims`, and `sources` are references; embedded
   copies are invalid except for immutable block payload values.
4. `exam-note`, `quick-revision`, summary cards, sidebars, tabs, accordions,
   and page sections are projections or editorial compositions, never core
   entities.
5. `interpretationStatus` is metadata on a Claim or relevant block, not a
   claim that all prose must be sentence-indexed.
6. A content variant contains localized labels and semantic text keyed to the
   same stable unit/version identity; it does not create a second KnowledgeUnit.
7. Context mappings (BCS, admission, IELTS, curriculum, country, exam, and
   institution) are references/projections and never duplicate canonical units.

### Hidden-template risks

The principal risks are requiring a definition/explanation/example sequence,
making `summary` mandatory, treating block `order` as a page layout, and
storing exam notes as canonical content. These are rejected. `order` is only a
deterministic editorial hint within one representation; consumers may render
the same semantic material differently. No block type is mandatory, and an
empty field is not used to satisfy a template.

### Final core model

**CORE:** stable Topic identity, Concept, KnowledgeUnit identity and version,
Objective, ContentBlock type plus payload, lifecycle, and provenance status.

**OPTIONAL CORE:** Discipline, Subject, Category, summary, aliases, audience,
level, scope, validity, prerequisite relationships, Claims, Sources, and
SourceReferences. These are optional because a minimal unit need not require
all of them, but their semantics are universal when present.

**RELATIONSHIP:** Topic-to-Concept, Topic-to-KnowledgeUnit,
Concept-to-KnowledgeUnit, prerequisite/related references, Objective
alignment, Claim-to-SourceReference, and AssessmentAlignment.

### Final optional model

Optional semantic blocks include definition, explanation, mechanism-process,
chronology, classification, comparison, cause-effect, example, case-study,
formula-rule, exception, misconception, and procedure-derivation. They are
selected by meaning, not by subject checklist. Examples normally remain
pedagogical content; only independently supportable assertions inside them
become selective Claims.

Context metadata is optional and externalized as mappings:
`contextId`, `contextType`, `label`, `relevance`, and referenced canonical
IDs. Audience, difficulty, curriculum, country, exam, and institution are not
new copies of knowledge.

### Extension model

An extension is optional, namespaced, independently validated, versioned, and
referential. It may add Geography spatial data, Mathematics symbolic data,
Chemistry notation, English grammar features, History actors/events, GIS
layers, or research-method metadata. It cannot add a required universal field,
replace a core identity, duplicate a Claim, or change lifecycle semantics.
Future Physics, Biology, Philosophy, Economics, International Affairs, BCS,
admission, IELTS, institutional, and research content use the same rule.

### Projection model

Canonical semantic objects feed separate projections:

- **Editorial:** lesson, summary, quick-revision, exam-note, card, and page
  compositions.
- **Search:** title, aliases, identifiers, concepts, terminology, semantic
  text, context terms, and source terms.
- **AI grounding:** published version, block type, claim/source context, scope,
  validity, interpretation status, audience, and level.
- **Learner:** stable Topic/Concept/KnowledgeUnit/Objective/version references.
- **Assessment:** reference-only alignments to sets/items.

Projections are derived and replaceable. They never become canonical content,
scoring authority, learner-performance authority, or a second identity system.

### Versioning decision

Use the minimum immutable structure of a stable object ID plus an integer
version and lifecycle metadata. A Topic version is a published composition
that references specific KnowledgeUnit versions. Changing one unit does not
require changing every Topic identity, but it requires a new Topic published
version when that Topic's delivered composition changes. A unit can be
revised independently when its meaning changes.

Changing only a source's URL, access date, or bibliographic record creates a
new Source revision and provenance snapshot; it does not require new
educational wording unless support changes. A corrected Claim creates a new
Claim version and any affected unit/topic published version. Historical
learner progress, AssessmentResults, search documents, and AI citations retain
the old version references and are never rewritten. A published package is
the immutable set of the Topic version, referenced unit versions, claims,
source references, and approved projections. `supersedes` and `replacedBy`
link later packages; they do not mutate history.

### Identity decision

Preserve `${subjectId}/${slug}` for Topic IDs. Discipline, Subject, Concept,
KnowledgeUnit, Objective, Claim, Source, SourceReference, and Alignment use
stable namespace IDs. Object identity is immutable; title, localization,
scope, and semantic payload changes use versions. Human-readable IDs are
allowed for existing catalog compatibility, while opaque IDs are acceptable
for editorial records. No route, array position, localized title, or runtime
UUID is canonical identity.

### Localization decision

Language is a content-variant dimension, not a duplicated hierarchy. A
variant is keyed by `(stableObjectId, contentVersion, locale)` and contains
localized title, semantic text, terminology, aliases, and optional locale
metadata. Missing translations fall back to the approved source-language
variant; they do not create empty “Bangla Summary” or “English Summary”
fields. Localized Claims and citations preserve the same claim/source identity,
with translated wording marked as a variant.

### Cross-subject validation

| Test | Core | Optional/relationships | Extension/projections |
|---|---|---|---|
| Geography process | unit, mechanism-process, objective | scope, case-study, claims | spatial metadata; map/search/AI projections |
| Historical event | unit, chronology, cause-effect | interpretation, validity, sources | actors/events; chronology/search/AI |
| English grammar | unit, formula-rule, exception, example | audience, terminology | grammar features; practice/search |
| Mathematical theorem/formula | unit, formula-rule, procedure-derivation | variables, prerequisites | symbolic tree; calculator/search |
| Scientific mechanism | unit, mechanism-process, explanation | conditions, evidence | notation/model; AI/search |
| Case study | unit, case-study, scope, claims | sources, validity | domain metadata; context projection |
| Misconception | unit, misconception, explanation, objective | source references | none required; revision projection |
| Exam-context mapping | objective, alignment, unit reference | audience/context mapping | exam metadata; exam projection |

All eight tests use the same core. Geography adds no required universal field.
The broader future set (Physics, Chemistry, Biology, Philosophy, Economics,
International Affairs, GIS, research methodology, BCS, admission, IELTS,
institutional courses, and reference material) can add only namespaced
extensions and context mappings.

### Minimality result

The model can be reduced without loss by removing mandatory `summary`, block
checklists, canonical exam-note/quick-revision blocks, embedded source copies,
and sentence-level claim records. Keep the stable unit/version, one or more
meaningful typed blocks, optional objectives/concepts, selective provenance,
and reference-only alignment. Search, AI, editorial, assessment, and learner
objects remain projections or separate authorities.

### Compatibility result

The design remains compatible with current ContentMetadata, Topic Engine,
Assessment Engine, Learner Intelligence, Search, AI Intelligence, Content
Delivery, platform envelopes, local-first state, and future mobile clients.
Integration is additive: manifests and read projections may later reference
unit versions without changing existing topic IDs or assessment scoring.
Current Geography remains accessible as legacy data and is not silently
reinterpreted as this schema.

### Remaining open decisions

The next Editorial + Source/Provenance Specification must decide the source
quality rubric, reviewer evidence, minimum requirements by audience/level,
translation workflow, source-conflict resolution, and the first pilot units.
It must not introduce new core entities or make any semantic block mandatory.

## 29. Final Schema Summary

```text
Discipline
→ Subject
→ Category?
→ Topic
→ Concept
↔ KnowledgeUnit
   → Objective
   → Typed ContentBlock
   → Selective Claim
      → SourceReference
         → Source
   → AssessmentAlignment
   → Version/Lifecycle metadata
```

The universal core is semantic, source-aware, versioned, assessment-separated,
AI-groundable, searchable, learner-compatible, and extension-friendly. It does
not embed Geography-specific fields, page layout, answer keys, or learner
state.

## Final Verdict

SCHEMA APPROVED FOR EDITORIAL SPECIFICATION
