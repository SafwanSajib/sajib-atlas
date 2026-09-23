# Geography Canonical Batch #2 Readiness

**Status:** Design/readiness only; no Batch #2 production package exists

## Selection criteria

The next topic should be conceptually important, useful for BCS and competitive-exam learners, independently authorable without legacy payload migration, supported by authoritative sources, and structurally different from the Water Cycle. It should exercise spatial relationships, classification, comparison, chronology, or rules without forcing artificial block types.

## Candidates considered

| Candidate | Strengths | Limitation for Batch #2 |
|---|---|---|
| Earth's Rotation | Strong physical Geography relevance; chronology and cause/effect | Reuses process-heavy structures already demonstrated |
| Latitude and Longitude | Foundational spatial literacy; clear comparisons, classification, angular rules, and coordinate relationships | Requires careful distinction between geographic coordinates and time-zone applications |
| Atmosphere | Broad and important; supports classification and vertical structure | Too broad for a small controlled batch unless narrowed substantially |
| Plate Tectonics | Strong causal model and landform relevance; authoritative sources available | Large scope and risk of over-expanding into a full Earth-science unit |
| Earth's Interior | Clear layered classification and comparison | Less varied spatial/application structure than coordinate systems |
| Geomorphic Processes | High Geography value and process diversity | Scope is too broad for a bounded second batch |
| Climate Classification | Strong exam relevance and classification | Requires selecting and sourcing a specific classification system carefully |

## Recommended topic

**Latitude and Longitude**

Canonical boundary proposal:

- subject: `geography`
- topic slug: `latitude-and-longitude`
- proposed identity: `topic/geography/latitude-and-longitude`
- proposed content version: `1`

## Why this is the correct next topic

Latitude and Longitude is foundational to Geography and competitive-exam map reasoning, while remaining bounded enough for a controlled package. It complements rather than duplicates Water Cycle by emphasizing spatial reference, coordinate relationships, classification, comparison, and rule-based application. It can be authored independently from legacy Geography content and does not require importing existing page sections.

## Proposed concepts

1. Latitude and parallels
2. Longitude and meridians
3. Hemispheres and reference lines
4. Angular distance and coordinate notation
5. Geographic position and spatial application

## Proposed KnowledgeUnit boundaries

1. **Coordinate reference system** — what geographic coordinates represent and how latitude/longitude work together.
2. **Latitude and parallels** — equator, parallels, north/south classification, and angular distance.
3. **Longitude and meridians** — prime meridian, east/west classification, and meridian convergence.
4. **Reading coordinates** — order, degrees/minutes/seconds or decimal notation, sign conventions, and common ambiguity.
5. **Spatial relationships** — hemispheres, relative position, and interpreting coordinate changes.
6. **Geographic application and limitations** — locating places and distinguishing coordinate position from map projection or time-zone conventions.

## Expected ContentBlock types

- definition
- classification
- comparison
- explanation
- formula-rule where the rule is academically justified
- example for coordinate reading
- misconception for reversing latitude/longitude or confusing coordinates with time zones
- cause-effect only where meridian convergence or coordinate changes genuinely require it

No fixed block sequence is required, and no block type should be added merely for coverage.

## Expected source categories

- government geospatial or national mapping agencies
- authoritative international geospatial standards or organizations
- university geography or cartography references
- authoritative physical geography textbooks

Sources must be selected and verified during authoring. No source metadata, URL, statistic, or formula should be fabricated.

## Expected assessment alignment

Reference-only alignment to future assessment sets and items for:

- identifying latitude versus longitude
- classifying hemispheres and reference lines
- reading and ordering coordinate pairs
- applying angular-distance rules
- interpreting spatial relationships

No answer keys, responses, scoring, or Assessment Engine logic belong in the package.

## Expected Search terms

latitude, longitude, parallels, meridians, equator, prime meridian, coordinates, geographic coordinates, hemispheres, north latitude, south latitude, east longitude, west longitude, degrees, minutes, seconds, decimal degrees, coordinate position.

Terms should come from canonical titles, aliases, concepts, and semantic blocks rather than keyword padding.

## AI grounding considerations

Grounding projections should preserve canonical identity, content version, concept and KnowledgeUnit structure, interpretation status, and source references. Draft content must not become authoritative AI knowledge; AI eligibility remains governed by the existing published-production boundary. No provider, generation, or public AI API changes are part of Batch #2.

## Learner references

Learner projections should contain only stable topic, concept, KnowledgeUnit, and content-version references. They must not contain learner identity, scores, responses, mastery, adaptive decisions, or private state.

## Risks

1. **Coordinate convention ambiguity:** mitigate with explicit ordering and notation rules.
2. **Scope creep into navigation and time zones:** keep applications bounded to geographic position; treat time zones as a clearly separated non-canonical context or omit them.
3. **Formula overuse:** include only rules that improve understanding and can be sourced and reviewed.
4. **Legacy contamination:** author a new package from verified sources and the universal model; never import `src/lib/geography-data.ts`.
5. **Assessment duplication:** keep all correctness and scoring in Assessment Engine alignments only.

## Scope boundary

Batch #2 readiness does not authorize content creation, publication, route changes, legacy migration, assessment implementation, Search changes, AI changes, learner changes, database/CMS work, or infrastructure additions. It proposes one future canonical package only.

## Readiness status

**READY FOR A SEPARATE CONTROLLED AUTHORING TASK**

Water Cycle remains a separate version-1 draft package. Batch #2 has design readiness only; no production content exists.
