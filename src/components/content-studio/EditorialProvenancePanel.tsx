"use client";

import { useState } from "react";
import type { EditorialPatch } from "@/lib/content-studio/editorial/edit";
import type { ProductionRecord } from "@/lib/content/production/types";

export default function EditorialProvenancePanel({
  production,
  onPatch,
}: {
  production: ProductionRecord;
  onPatch: (patch: EditorialPatch) => void;
}) {
  const content = production.content;
  const [claims, setClaims] = useState(content.claims.map((claim) => ({
    id: claim.id,
    statement: claim.statement,
    conflictGroupId: claim.conflictGroupId ?? "",
    citationByReference: Object.fromEntries(content.sourceReferences.map((reference) => [reference.id, reference.citation])),
  })));

  function emit(next: typeof claims) {
    const patch: EditorialPatch = {};
    const claimPatch: NonNullable<EditorialPatch["claims"]> = {};
    for (const claim of next) {
      const baseline = content.claims.find((item) => item.id === claim.id);
      if (!baseline) continue;
      const fields: NonNullable<EditorialPatch["claims"]>[string] = {};
      if (claim.statement !== baseline.statement) fields.statement = claim.statement;
      if ((baseline.conflictGroupId ?? "") !== claim.conflictGroupId) fields.conflictGroupId = claim.conflictGroupId;
      if (Object.keys(fields).length > 0) claimPatch[claim.id] = fields;
    }
    if (Object.keys(claimPatch).length > 0) patch.claims = claimPatch;
    const referencePatch: NonNullable<EditorialPatch["sourceReferences"]> = {};
    for (const reference of content.sourceReferences) {
      const citation = next[0]?.citationByReference[reference.id];
      if (citation !== undefined && citation !== reference.citation) referencePatch[reference.id] = { citation };
    }
    if (Object.keys(referencePatch).length > 0) patch.sourceReferences = referencePatch;
    onPatch(patch);
  }

  return (
    <section className="section">
      <h2>Provenance</h2>
      <p>Claim, source reference, then source. Unresolved ids stay visible as errors.</p>
      {content.claims.map((claim) => {
        const current = claims.find((item) => item.id === claim.id);
        const references = claim.sourceReferenceIds.map((id) => content.sourceReferences.find((reference) => reference.id === id));
        return (
          <article key={claim.id}>
            <h3>{claim.id}</h3>
            <p>{claim.kind} · {claim.interpretationStatus} · {claim.supportStatus}{claim.conflictGroupId ? ` · ${claim.conflictGroupId}` : ""}</p>
            <label htmlFor={`claim-${claim.id}`}>Statement</label>
            <textarea
              id={`claim-${claim.id}`}
              rows={3}
              value={current?.statement ?? claim.statement}
              onChange={(event) => {
                const next = claims.map((item) => item.id === claim.id ? { ...item, statement: event.target.value } : item);
                setClaims(next);
                emit(next);
              }}
            />
            {references.map((reference) => {
              if (!reference) return <p key={`${claim.id}-missing`}>Unresolved source reference</p>;
              const source = content.sources.find((item) => item.id === reference.sourceId);
              return (
                <div key={reference.id}>
                  <p>{reference.supportType} · {reference.locator ?? "no locator"} · {reference.quote ?? "no quote"}</p>
                  <label htmlFor={`citation-${reference.id}`}>Citation</label>
                  <input
                    id={`citation-${reference.id}`}
                    value={current?.citationByReference[reference.id] ?? reference.citation}
                    onChange={(event) => {
                      const next = claims.map((item) => ({
                        ...item,
                        citationByReference: { ...item.citationByReference, [reference.id]: event.target.value },
                      }));
                      setClaims(next);
                      emit(next);
                    }}
                  />
                  <p>{source ? `${source.type} · ${source.title} · ${source.publisherOrOrganization} · ${source.reference}` : `Unresolved source ${reference.sourceId}`}</p>
                </div>
              );
            })}
          </article>
        );
      })}
    </section>
  );
}
