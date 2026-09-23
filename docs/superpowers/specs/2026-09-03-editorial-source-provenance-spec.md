# Editorial + Source/Provenance Specification

**Date:** 2026-09-03  
**Status:** Design specification for review  
**Applies to:** Future canonical multi-subject content  
**Authority:** The approved Universal Content Schema Design

## 1. Executive Summary

Sajib Atlas canonical quality is established by an editorial process, not by
structural validity alone. This specification defines the minimum process for
researching, authoring, sourcing, verifying, reviewing, publishing, monitoring,
correcting, and retiring canonical content.

The process is intentionally risk-based. Small editorial changes do not require
the same review as legal, scientific, disputed historical, or volatile current
affairs content. Every published package must be traceable to its sources,
explicit about fact versus interpretation, suitable for its audience, safe for
AI grounding, and immutable after publication.

Current Geography payloads remain **LEGACY / REFERENCE MATERIAL ONLY**. They are
not the editorial baseline and are not automatically promoted or migrated.

## 2. Editorial Principles

1. Explain the concept; do not accumulate disconnected facts.
2. State only what the evidence and scope support.
3. Use stable terminology consistently within a language and audience.
4. Separate canonical knowledge, editorial explanation, context, assessment,
   learner state, and AI output.
5. Label interpretation, synthesis, uncertainty, disagreement, and examples.
6. Match depth, vocabulary, mathematical detail, and evidence to the intended
   learner level.
7. Prefer original wording and attribution over copied source language.
8. AI may assist work, but human/source verification is mandatory before
   publication.
9. Preserve historical truth: published versions and learner/assessment history
   are never silently rewritten.
10. Treat safety, privacy, defamation, discrimination, and harmful instructions
    as publication concerns requiring escalation.

## 3. Editorial Lifecycle

```text
Research
→ Draft
→ Source Verification
→ Editorial Review
→ Academic Review
→ Technical Validation
→ Publication
→ Monitoring
→ Revision
→ Deprecation
→ Archive
```

### Mandatory stages

- **Research:** define scope, audience, objective, and source plan.
- **Draft:** create original semantic content and classify statements.
- **Source Verification:** verify every required factual/statistical/scientific
  or historical claim and record usable references.
- **Editorial Review:** check clarity, structure, terminology, duplication,
  audience fit, and fact/interpretation labeling.
- **Academic Review:** required for high-risk or specialist material.
- **Technical Validation:** schema, identity, references, lifecycle, version,
  localization, alignment, and projection checks.
- **Publication:** release only a passing immutable package.
- **Monitoring:** review content according to freshness class and triggers.
- **Revision/Deprecation/Archive:** create a new version or retire the old one
  without destroying references.

Academic Review may be waived for a low-risk typo or formatting correction;
Source Verification may be waived only when no factual meaning changes.
Technical Validation and publication authority remain mandatory for every
published package.

## 4. Authoring Rules

### Required for every KnowledgeUnit

- Stable Topic/KnowledgeUnit identity and content version.
- At least one meaningful semantic ContentBlock; no block sequence is required.
- At least one explicit objective unless the unit is reference-only.
- Declared audience/level when the unit is learner-facing.
- Original wording, consistent terminology, and appropriate scope.
- Classification of material as fact, interpretation, synthesis, explanation,
  example, or commentary where ambiguity could mislead.
- Sources and Claims where the content makes independently supportable claims.

### Prohibited

- Unsupported factual assertions presented as fact.
- Copied source prose beyond short, attributed quotations.
- A fixed definition → explanation → example → misconception template.
- Exam notes, summaries, cards, sidebars, or quick-revision material as
  mandatory canonical entities.
- Empty fields added only to satisfy a template.
- AI-generated wording treated as authoritative without review.
- Duplicating a KnowledgeUnit for an exam, language, page, or audience.

### Quality rules

Sentences should be concise enough for the audience but complete enough to
preserve conditions and exceptions. Define specialist terms before relying on
them. Distinguish correlation from causation, observation from explanation,
model from reality, and historical evidence from later interpretation.

## 5. Source Hierarchy

| Tier | Sources | Canonical use |
|---|---|---|
| 1 | Government, constitutional/legal primary sources, official international organizations, official statistics, official institutions | Sole authority for claims within their jurisdiction/scope when current and directly relevant |
| 2 | Peer-reviewed literature, recognized academic publishers, universities, authoritative textbooks | Sole or corroborating authority according to claim type and review |
| 3 | Reputable reference works, established research institutions, professional organizations | Corroboration or contextual authority; specialist review required for contentious claims |
| 4 | High-quality journalism, established editorial/reference material | Context, chronology, or corroboration; never sole authority for disputed or technical claims |
| 5 | General web pages, blogs, unsourced summaries, social media, AI output | Discovery only; never a sole canonical authority |

Lower tier does not mean false. It means the source needs corroboration,
limited contextual use, or specialist review. Tier 5 material may identify leads
but cannot satisfy publication evidence.

## 6. Source Selection

Evaluate every proposed source for authority, relevance, recency, methodology,
geographic and temporal scope, institutional credibility, independence, and
primary/secondary status.

- Prefer a directly relevant primary or official source over a newer secondary
  summary when the primary source remains valid.
- Prefer a newer authoritative source when it supersedes an older one or
  describes a changed fact.
- Use a newer secondary source to discover updates, not to override a valid
  primary source without documented reason.
- Conflicting official sources require date, jurisdiction, definition, and
  methodology comparison; never select silently.
- Textbooks are suitable for established teaching explanations, but current
  statistics, law, policy, and active science require current authoritative
  evidence.
- Government statistics take precedence over media reports for the same
  officially defined measure, while media may provide event context.
- Independent corroboration is required when a claim is material, disputed,
  high-risk, unusually precise, or supported only by Tier 3/4 sources.

## 7. Claim Verification

Not every pedagogical sentence becomes a Claim. Create a Claim when independent
support, scope, date, disagreement, or AI citation readiness matters.

| Claim category | Minimum evidence | Review | Freshness |
|---|---|---|---|
| Stable fact/definition | One authoritative Tier 1/2 source or two independent Tier 3 sources | Editorial; academic if disputed | Review on source change |
| Time-sensitive fact | Current authoritative source with publication and verification dates | Editorial plus source verification | Scheduled by volatility and trigger |
| Statistic/numerical fact | Source defining value, unit, date, scope, and methodology | Source verification; academic for consequential measures | Each release/update |
| Scientific claim | Peer-reviewed, institutional, or authoritative textbook evidence | Academic review when non-basic, contested, or safety-relevant | Review on consensus/source change |
| Mathematical principle | Independently checked derivation or authoritative reference | Mathematics-capable academic check | Stable unless correction found |
| Historical claim | Primary evidence where available plus reputable scholarship | Academic review for material events or contested readings | Review when scholarship changes |
| Interpretation | Attributed source(s), explicit status, scope, and disagreement context | Academic review | Review on significant scholarship change |
| Synthesized claim | Multiple identified sources and explanation of synthesis | Editorial plus academic review when material | Review when component evidence changes |
| Pedagogical statement | Accurate derivation from approved content; source not always required | Editorial | Review with parent content |

Verification records the source reference, locator, date checked, reviewer, and
any limitation. Unsupported or unresolved claims are blocked from publication.

## 8. Fact vs Interpretation

- **Fact:** A proposition supported within a stated scope and time period.
- **Interpretation:** An attributed analysis or explanation that reasonable
  sources may contest.
- **Synthesis:** An editorial combination of multiple supported claims, labeled
  as synthesis rather than disguised as a single source fact.
- **Pedagogical explanation:** Original teaching language that clarifies
  approved knowledge; it is not automatically a new factual claim.
- **Illustrative example:** A labeled example used to teach; it must not imply
  unsupported generality.
- **Opinion/commentary:** A viewpoint, not canonical fact; it is excluded from
  factual grounding unless explicitly contextualized.

History, International Affairs, Geography, Economics, political science, and
social science must identify actors, jurisdiction, date, source tradition, and
uncertainty where relevant. When scholarship disagrees, preserve the relevant
positions and explain the editorial basis for any synthesis. Never present a
disputed interpretation as an undisputed fact.

## 9. Time-Sensitive Content

Time-sensitive material includes office holders, policy, population, indicators,
rankings, treaty/status, geopolitical events, technology specifications,
laws/regulations, and current events.

Required metadata:

- source publication date;
- verification date;
- effective date or period;
- scope/jurisdiction;
- review-by or expiry date;
- update trigger;
- freshness class.

Re-review, rather than a cosmetic version bump, is mandatory when a source
withdraws, a law/policy changes, an office holder changes, a statistic is
revised, a treaty/status changes, or the underlying scientific/technical
consensus materially changes. A new version must preserve the old version's
historical validity and references.

## 10. Statistics/Numerical Facts

Every published numerical statement must include value, unit, reference
date/year, geographic or institutional scope, source, and methodology context
when definitions or comparability matter. Coordinates require datum/reference
context where precision matters. Rankings require edition/date and population
of compared entities. Percentages require denominator or measure definition.
Exam statistics require exam, cohort, date, and calculation basis.

“Floating numbers” without date, scope, unit, or source are blocked. Rounding
must be stated when it could affect interpretation.

## 11. Scientific/Mathematical Content

Formulas require defined variables, units, assumptions, conditions, domain,
and interpretation. Derivations must identify each non-obvious step. Models
must state limitations and distinguish approximation from identity.

Scientific material labels established principle, empirical observation, model,
hypothesis, and interpretation. Mathematical content receives an independent
correctness check by a suitably qualified reviewer. A formula without its
conditions or variable definitions is blocked for production use.

## 12. English/Language Content

Grammar and usage units must state the convention, rule conditions, examples,
exceptions, terminology, and intended register/dialect where relevant. Examples
must actually demonstrate the rule and must not introduce a conflicting
construction.

When authoritative references disagree, name the convention, cite the source,
and avoid presenting one register or dialect as universally correct. Definitions
must distinguish formal rule, common usage, and prescriptive convention.

## 13. Exam Context

BCS, admission, IELTS, curriculum, country, institution, and similar contexts
are mappings to canonical Concepts, KnowledgeUnits, Objectives, and
AssessmentAlignments. They do not create copied content.

An exam mapping may specify syllabus relevance, audience, difficulty, question
angle, revision emphasis, and exam-specific terminology. It must not alter
academic truth, add answer keys, or imply that predicted questions are facts.
Exam-specific summaries and notes are projections or editorial compositions.

## 14. Pedagogical Quality

Select requirements by content type, level, and intended use. A unit should
have the components needed to meet its objective, not every possible component.

- Concepts and objectives must be understandable and measurable.
- Prerequisites are referenced when assumed knowledge is material.
- Explanations preserve causal, logical, temporal, or conditional structure.
- Examples, applications, and misconceptions are added when they improve the
  objective; they are not mandatory for every unit.
- Retrieval/revision and assessment alignment are separate projections or
  references, not required canonical blocks.
- Content must avoid unnecessary verbosity and artificial exam framing.

## 15. Depth Levels

| Level | Terminology | Explanation/prerequisites | Evidence and assessment |
|---|---|---|---|
| Foundational | Common terms defined | Minimal assumptions; concrete examples | Direct recall and recognition |
| Intermediate | Subject terminology introduced | Relationships, conditions, and common exceptions | Explanation and application |
| Advanced | Precise specialist terminology | Competing models, derivation, limitations | Analysis and evaluation |
| Expert/reference | Full technical vocabulary | Source traditions, edge cases, unresolved issues | Research-oriented synthesis |

Depth changes representation and support, not canonical Topic identity. A
foundational and advanced treatment may reference the same unit or version and
must not be duplicated as separate knowledge merely for level.

## 16. Source Conflict Protocol

When sources disagree:

1. Record the competing claims and references.
2. Compare publication/reference dates.
3. Compare geographic, institutional, demographic, and temporal scope.
4. Compare authority, primary status, definitions, and methodology.
5. Determine whether the disagreement is factual, definitional, or interpretive.
6. Record a named editorial decision and its rationale.
7. Preserve relevant alternatives when they are academically material.
8. Label uncertainty or dispute in the published content.
9. Set a review trigger if later evidence may resolve the conflict.

No value or interpretation may be silently selected. An unresolved material
conflict blocks a definitive statement but may publish as a clearly labeled
comparison of positions.

## 17. Citation Standard

Use a readable source list for a coherent unit and inline claim citations when
the statement is disputed, time-sensitive, statistical, technical, legally
material, or likely to be misunderstood without attribution.

Claims reference one or more SourceReferences. Each reference includes a human
readable citation, locator where available, support type, and access/publication
dates as applicable. Textbooks include author, title, edition, publisher, and
year. Academic papers include authors, title, venue, year, and persistent
reference. Government/institutional sources include issuing body, title, date,
and document reference. Web sources include publisher, title, publication date
when available, URL, and accessed date.

Internal IDs support traceability but are never the learner-facing citation by
themselves. Short quotations require attribution and must not replace original
explanation.

## 18. Provenance Confidence

Use categorical provenance status, never a fake numeric precision:

- **verified:** evidence checked and adequate for the claim;
- **corroborated:** supported by multiple independent suitable sources;
- **authoritative-single-source:** adequate authoritative source, with no
  independent corroboration required for the claim type;
- **synthesized:** conclusion explicitly derived from multiple sources;
- **disputed:** credible sources materially disagree;
- **insufficient-evidence:** not eligible for canonical publication.

Status describes evidence and review maturity, not psychological confidence,
truth probability, or future performance.

## 19. AI-Generated Content Policy

AI may assist with drafting, restructuring, summarization, terminology
suggestions, question generation, and gap detection. AI output is always
non-canonical at generation time.

Promotion is mandatory:

```text
AI-assisted draft
→ human/source verification
→ editorial review
→ academic review where required
→ technical validation
→ canonical publication
```

Plausibility, agreement from another AI, retrieved citations, or fluent wording
never satisfies promotion. AI-generated material may become canonical only after
the same Claim, Source, review, lifecycle, and publication gates as human
writing. AI retrieval may use only eligible published versions and must retain
version, scope, interpretation, and provenance context.

## 20. Review Roles

- **Author/editor:** defines objective and audience, drafts original content,
  classifies material, and resolves clarity/duplication issues.
- **Source verifier:** checks source identity, scope, dates, locators,
  support type, independence, and conflict records.
- **Academic reviewer:** checks disciplinary correctness, interpretation,
  methodology, mathematical/scientific validity, and level appropriateness.
- **Technical/content validator:** checks schema shape, references, IDs,
  lifecycle, version immutability, localization, alignment, and projection
  eligibility.
- **Publisher/release authority:** confirms all blocking gates pass and
  publishes the immutable package.

Minimum staffing is risk-based. Low-risk editorial corrections may use
author/editor plus technical validation. New factual claims need source
verification. Disputed history, advanced science/math, law/policy, safety,
material statistics, and volatile current affairs require academic review.
One person may hold multiple roles only when the risk classification permits it;
the publisher remains accountable for the release record.

## 21. Publication Gate

### Blocking conditions

A package cannot publish if any applies:

- invalid identity, references, lifecycle, version, or required structure;
- missing objective where learner-facing;
- unsupported factual, statistical, scientific, legal, or historical claim;
- missing date/scope/unit/methodology for a required numerical fact;
- interpretation, dispute, model, or hypothesis mislabeled as fact;
- required reviewer sign-off absent;
- unresolved material source conflict presented as a definitive statement;
- copied or AI-generated material lacks verification and attribution;
- invalid assessment alignment or accidental answer/scoring data;
- ineligible content marked for AI grounding;
- published version would mutate or erase a historical version.

### Warning conditions

Warnings do not block release but require a recorded decision: optional
corroboration for a stable low-risk fact, incomplete translation, limited
example coverage, non-material source age, or an editorial opportunity.

### Pass conditions

Structure, sources, claims, factual review, terminology, pedagogy, assessment
alignment where applicable, AI eligibility, lifecycle, version, and technical
validation all pass or have documented warnings. Publication records the
package version, reviewers, timestamp, source snapshot, and decision.

## 22. Correction Protocol

| Change | Version | Other action |
|---|---|---|
| Typo/formatting with no meaning change | New published package or projection revision according to release policy | Technical validation; no assessment re-score |
| Minor editorial correction | New version when canonical wording changes | Editorial review; update Search/AI projections |
| Factual correction | New Claim/unit/Topic version as affected | Source and academic review; assess affected alignments |
| Major conceptual correction | New KnowledgeUnit and affected Topic version | Mandatory academic review; review assessments and learner display |
| Source withdrawal | New version or deprecation | Remove grounding eligibility; reindex Search/AI |
| Changed external fact | New time-valid version | Source verification; preserve old historical version |

Assessment attempts, canonical AssessmentResults, learner history, and
completed-topic records remain unchanged. Assessment content is reviewed when
an item depends on corrected meaning, but historical scores are not recalculated
silently. Search and AI indexes are updated to exclude superseded content and
retain historical version references where required.

## 23. Deprecation/Retirement

- **Deprecated:** no longer recommended for new delivery, but historically
  valid and addressable.
- **Replaced:** a successor version or unit is identified through
  `replacedBy`/`supersedes`.
- **Archived:** removed from ordinary delivery while retained for history,
  citations, and learner/assessment references.

Outdated statistics, obsolete science, superseded laws/policies, replaced
terminology, and old exam syllabi require the appropriate status. Published
content is never silently erased because learner history or assessment history
depends on it.

## 24. Source Monitoring

| Freshness class | Examples | Minimum review |
|---|---|---|
| Static | Basic mathematics, established principles | On source change, correction, or scheduled quality review |
| Slow-changing | Textbooks, demographic structures, geographic classifications | At least every 24 months and on trigger |
| Time-sensitive | Laws, office holders, policies, official indicators, exam syllabi | At least every 12 months; sooner at effective-date or source trigger |
| Volatile | Live geopolitics, markets, current affairs, rapidly changing technology | Before each release and at least every 90 days while actively delivered |

Triggers include source withdrawal, official revision, legal change, material
scientific update, terminology change, learner safety concern, credible error
report, or a changed assessment syllabus. Monitoring produces a review decision:
unchanged, revised, deprecated, or archived.

## 25. Quality Dimensions

There is no single content-quality score. Each dimension is `PASS`, `WARNING`,
or `BLOCKED`:

| Dimension | PASS | WARNING | BLOCKED |
|---|---|---|---|
| Factual | Claims accurate within scope | Minor uncertainty documented | Material unsupported/error |
| Evidence | Suitable references and locators | Adequate single authority where corroboration would help | Missing/inadequate evidence |
| Editorial | Clear, original, consistent | Non-material clarity issue | Misleading, copied, or duplicated |
| Pedagogical | Objective and level fit | Optional component absent | Cannot meet stated objective |
| Assessment | Alignment references valid | Alignment not applicable | Incorrect or duplicated scoring data |
| Technical | IDs, schema, version, lifecycle valid | Non-blocking projection warning | Invalid reference or mutable published data |
| Freshness | Review current for class | Review approaching | Expired or contradicted time-sensitive content |

Any blocked mandatory dimension blocks publication.

## 26. Practical Editorial Checklist

Before requesting publication, the editor answers:

- Is the objective measurable and the audience/level appropriate?
- Does the unit explain the concept rather than merely list facts?
- Are all material claims correctly classified?
- Is every factual, statistical, scientific, legal, or disputed statement
  sufficiently sourced?
- Are date, scope, units, definitions, conditions, and methodology clear?
- Is interpretation, synthesis, example, and uncertainty labeled?
- Are terminology, examples, exceptions, and formulas correct?
- Is exam context a mapping rather than duplicated knowledge?
- Is assessment alignment reference-only and free of answer/scoring data?
- Is the content safe and eligible for AI grounding?
- Are version, lifecycle, reviewers, and correction links correct?
- Are warnings documented and are there no blocking failures?

## 27. Multi-Subject Pilot Requirements

The pilot must include:

1. One Geography unit;
2. One English or Mathematics unit;
3. One History or International Affairs unit.

Each pilot unit must demonstrate KnowledgeUnit identity, measurable objectives,
selected semantic blocks, selective claims, suitable sources, provenance
status, version, lifecycle transitions, assessment alignment, deterministic
Search projection, AI grounding eligibility, and at least one context mapping.

The pilot must include at least one numerical or time-sensitive example, one
interpretation/disagreement example, and one subject extension. Reviewers must
record rejected alternatives and verify that no unit requires a Geography-only
core field. Pilot content is not created by this specification.

## 28. Legacy Geography Rule

Current Geography content is legacy/reference material. It must not be
automatically promoted into the new canonical system. Any factual material
reused from it must pass source verification, structural restructuring,
editorial review, academic review where required, technical validation, and the
publication gate.

No bulk migration, field-by-field conversion, deletion, or silent relabeling is
permitted before pilot validation and human approval. Existing Geography
payloads remain available according to their current runtime contract and are
not the quality baseline for other subjects.

## 29. Final Editorial/Provenance Standard

Canonical content is publishable only when it is original, scoped, appropriately
deep, source-traceable, correctly classified, reviewed according to risk,
technically valid, versioned immutably, and safe for its intended projections.

The minimum approved process is:

```text
Research → Draft → Source Verification → Editorial Review
→ Academic Review when risk requires → Technical Validation
→ Publication → Monitoring → Revision/Deprecation/Archive
```

This standard preserves the approved separation:

```text
CORE KNOWLEDGE → CONTEXT → EXPERIENCE
```

Assessment Engine remains authoritative for correctness and scoring. Learner
Intelligence remains authoritative for performance projections. Search, AI,
editorial renderings, exam mappings, and learner continuity remain projections
or separate boundaries. AI-generated output remains non-canonical until it
passes the complete human/source publication process.

### Self-review

This specification is operational for editors, source verifiers, academic
reviewers, technical validators, and publishers; blocks unsupported factual
content; prevents automatic AI authority; distinguishes fact and
interpretation; records conflict and time validity; preserves learner and
assessment history; separates exam context; supports Geography, English,
Mathematics, Science, History, and International Affairs; and does not use
current Geography as the quality standard.

## Final Verdict

EDITORIAL STANDARD APPROVED FOR MULTI-SUBJECT PILOT

The next phase after human review and approval is **MULTI-SUBJECT CANONICAL
CONTENT PILOT**. No pilot content or tooling is created by this document.
