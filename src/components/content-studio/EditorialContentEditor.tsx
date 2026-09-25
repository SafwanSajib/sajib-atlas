"use client";

import { useState } from "react";
import type { EditorialPatch } from "@/lib/content-studio/editorial/edit";
import type { PilotBlockType } from "@/lib/content/pilot/types";
import type { ProductionRecord } from "@/lib/content/production/types";

const BLOCK_TYPES: readonly PilotBlockType[] = [
  "definition",
  "explanation",
  "mechanism-process",
  "chronology",
  "comparison",
  "cause-effect",
  "example",
  "case-study",
  "formula-rule",
  "exception",
  "misconception",
  "procedure-derivation",
];

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

export default function EditorialContentEditor({
  production,
  onPatch,
}: {
  production: ProductionRecord;
  onPatch: (patch: EditorialPatch) => void;
}) {
  const content = production.content;
  const [title, setTitle] = useState(content.topic.title);
  const [summary, setSummary] = useState(content.topic.summary);
  const [audience, setAudience] = useState(content.topic.audience);
  const [level, setLevel] = useState(content.topic.level);
  const [provenanceStatus, setProvenanceStatus] = useState(content.topic.provenanceStatus);
  const [concepts, setConcepts] = useState(content.concepts.map((concept) => ({
    id: concept.id,
    title: concept.title,
    aliases: concept.aliases.join(", "),
  })));
  const [objectives, setObjectives] = useState(content.objectives.map((objective) => ({
    id: objective.id,
    statement: objective.statement,
    verb: objective.verb,
    level: objective.level,
  })));
  const [units, setUnits] = useState(content.knowledgeUnits.map((unit) => ({
    id: unit.id,
    title: unit.title,
    summary: unit.summary ?? "",
    blocks: unit.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      order: String(block.order),
      text: typeof block.payload.text === "string" ? block.payload.text : "",
    })),
  })));

  function emit(next: {
    title: string;
    summary: string;
    audience: string;
    level: typeof level;
    provenanceStatus: typeof provenanceStatus;
    concepts: typeof concepts;
    objectives: typeof objectives;
    units: typeof units;
  }) {
    const patch: EditorialPatch = {};
    const topic: NonNullable<EditorialPatch["topic"]> = {};
    if (next.title !== content.topic.title) topic.title = next.title;
    if (next.summary !== content.topic.summary) topic.summary = next.summary;
    if (next.audience !== content.topic.audience) topic.audience = next.audience;
    if (next.level !== content.topic.level) topic.level = next.level;
    if (next.provenanceStatus !== content.topic.provenanceStatus && ["verified", "corroborated", "synthesized", "disputed"].includes(next.provenanceStatus)) {
      topic.provenanceStatus = next.provenanceStatus as NonNullable<EditorialPatch["topic"]>["provenanceStatus"];
    }
    if (Object.keys(topic).length > 0) patch.topic = topic;
    const conceptPatch: NonNullable<EditorialPatch["concepts"]> = {};
    for (const concept of next.concepts) {
      const baseline = content.concepts.find((item) => item.id === concept.id);
      if (!baseline) continue;
      const fields: NonNullable<EditorialPatch["concepts"]>[string] = {};
      if (concept.title !== baseline.title) fields.title = concept.title;
      const aliases = concept.aliases.split(",").map((alias) => alias.trim()).filter(Boolean);
      if (aliases.join("\n") !== baseline.aliases.join("\n")) fields.aliases = aliases;
      if (Object.keys(fields).length > 0) conceptPatch[concept.id] = fields;
    }
    if (Object.keys(conceptPatch).length > 0) patch.concepts = conceptPatch;
    const objectivePatch: NonNullable<EditorialPatch["objectives"]> = {};
    for (const objective of next.objectives) {
      const baseline = content.objectives.find((item) => item.id === objective.id);
      if (!baseline) continue;
      const fields: NonNullable<EditorialPatch["objectives"]>[string] = {};
      if (objective.statement !== baseline.statement) fields.statement = objective.statement;
      if (objective.verb !== baseline.verb) fields.verb = objective.verb;
      if (objective.level !== baseline.level) fields.level = objective.level;
      if (Object.keys(fields).length > 0) objectivePatch[objective.id] = fields;
    }
    if (Object.keys(objectivePatch).length > 0) patch.objectives = objectivePatch;
    const unitPatch: NonNullable<EditorialPatch["knowledgeUnits"]> = {};
    for (const unit of next.units) {
      const baseline = content.knowledgeUnits.find((item) => item.id === unit.id);
      if (!baseline) continue;
      const fields: NonNullable<EditorialPatch["knowledgeUnits"]>[string] = {};
      if (unit.title !== baseline.title) fields.title = unit.title;
      if (unit.summary !== (baseline.summary ?? "")) fields.summary = unit.summary;
      const blocks: NonNullable<NonNullable<EditorialPatch["knowledgeUnits"]>[string]["blocks"]> = {};
      for (const block of unit.blocks) {
        const baseBlock = baseline.blocks.find((item) => item.id === block.id);
        if (!baseBlock) continue;
        const blockFields: NonNullable<NonNullable<EditorialPatch["knowledgeUnits"]>[string]["blocks"]>[string] = {};
        if (block.type !== baseBlock.type) blockFields.type = block.type;
        if (Number(block.order) !== baseBlock.order && Number.isInteger(Number(block.order))) blockFields.order = Number(block.order);
        if (typeof baseBlock.payload.text === "string" && block.text !== baseBlock.payload.text) {
          blockFields.payload = { ...baseBlock.payload, text: block.text };
        }
        if (Object.keys(blockFields).length > 0) blocks[block.id] = blockFields;
      }
      if (Object.keys(blocks).length > 0) fields.blocks = blocks;
      if (Object.keys(fields).length > 0) unitPatch[unit.id] = fields;
    }
    if (Object.keys(unitPatch).length > 0) patch.knowledgeUnits = unitPatch;
    onPatch(patch);
  }

  const snapshot = () => ({ title, summary, audience, level, provenanceStatus, concepts, objectives, units });

  return (
    <section className="section">
      <h2>Content</h2>
      <FieldLabel label="Title">
        <input value={title} onChange={(event) => { setTitle(event.target.value); emit({ ...snapshot(), title: event.target.value }); }} />
      </FieldLabel>
      <FieldLabel label="Summary">
        <textarea rows={3} value={summary} onChange={(event) => { setSummary(event.target.value); emit({ ...snapshot(), summary: event.target.value }); }} />
      </FieldLabel>
      <FieldLabel label="Audience">
        <input value={audience} onChange={(event) => { setAudience(event.target.value); emit({ ...snapshot(), audience: event.target.value }); }} />
      </FieldLabel>
      <FieldLabel label="Level">
        <select value={level} onChange={(event) => {
          const next = event.target.value as typeof level;
          setLevel(next);
          emit({ ...snapshot(), level: next });
        }}>
          <option value="foundational">foundational</option>
          <option value="intermediate">intermediate</option>
        </select>
      </FieldLabel>
      <FieldLabel label="Provenance status">
        <select value={provenanceStatus} onChange={(event) => {
          const next = event.target.value as typeof provenanceStatus;
          setProvenanceStatus(next);
          emit({ ...snapshot(), provenanceStatus: next });
        }}>
          {provenanceStatus !== "verified" && provenanceStatus !== "corroborated" && provenanceStatus !== "synthesized" && provenanceStatus !== "disputed" ? (
            <option value={provenanceStatus}>{provenanceStatus}</option>
          ) : null}
          <option value="verified">verified</option>
          <option value="corroborated">corroborated</option>
          <option value="synthesized">synthesized</option>
          <option value="disputed">disputed</option>
        </select>
      </FieldLabel>
      <h3>Concepts</h3>
      {concepts.map((concept) => (
        <div key={concept.id}>
          <FieldLabel label={`Concept ${concept.id}`}>
            <input value={concept.title} onChange={(event) => {
              const next = concepts.map((item) => item.id === concept.id ? { ...item, title: event.target.value } : item);
              setConcepts(next);
              emit({ ...snapshot(), concepts: next });
            }} />
          </FieldLabel>
          <FieldLabel label="Aliases">
            <input value={concept.aliases} onChange={(event) => {
              const next = concepts.map((item) => item.id === concept.id ? { ...item, aliases: event.target.value } : item);
              setConcepts(next);
              emit({ ...snapshot(), concepts: next });
            }} />
          </FieldLabel>
        </div>
      ))}
      <h3>Objectives</h3>
      {objectives.map((objective) => (
        <div key={objective.id}>
          <FieldLabel label={`Objective ${objective.id}`}>
            <input value={objective.statement} onChange={(event) => {
              const next = objectives.map((item) => item.id === objective.id ? { ...item, statement: event.target.value } : item);
              setObjectives(next);
              emit({ ...snapshot(), objectives: next });
            }} />
          </FieldLabel>
        </div>
      ))}
      <h3>Knowledge units and blocks</h3>
      {units.map((unit) => (
        <article key={unit.id}>
          <FieldLabel label={`Unit ${unit.id}`}>
            <input value={unit.title} onChange={(event) => {
              const next = units.map((item) => item.id === unit.id ? { ...item, title: event.target.value } : item);
              setUnits(next);
              emit({ ...snapshot(), units: next });
            }} />
          </FieldLabel>
          {unit.blocks.map((block) => (
            <div key={block.id}>
              <FieldLabel label="Block type">
                <select value={block.type} onChange={(event) => {
                  const next = units.map((item) => item.id === unit.id ? {
                    ...item,
                    blocks: item.blocks.map((entry) => entry.id === block.id ? { ...entry, type: event.target.value as PilotBlockType } : entry),
                  } : item);
                  setUnits(next);
                  emit({ ...snapshot(), units: next });
                }}>
                  {BLOCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </FieldLabel>
              <FieldLabel label="Order">
                <input value={block.order} onChange={(event) => {
                  const next = units.map((item) => item.id === unit.id ? {
                    ...item,
                    blocks: item.blocks.map((entry) => entry.id === block.id ? { ...entry, order: event.target.value } : entry),
                  } : item);
                  setUnits(next);
                  emit({ ...snapshot(), units: next });
                }} />
              </FieldLabel>
              <FieldLabel label="Payload text">
                <textarea rows={3} value={block.text} onChange={(event) => {
                  const next = units.map((item) => item.id === unit.id ? {
                    ...item,
                    blocks: item.blocks.map((entry) => entry.id === block.id ? { ...entry, text: event.target.value } : entry),
                  } : item);
                  setUnits(next);
                  emit({ ...snapshot(), units: next });
                }} />
              </FieldLabel>
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}
