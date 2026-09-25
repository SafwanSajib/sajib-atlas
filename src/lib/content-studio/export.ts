import type { ProductionRecord } from "@/lib/content/production/index";

export function exportStudioDraftJson(record: ProductionRecord): string {
  return JSON.stringify(record, null, 2);
}

export function exportStudioDraftTypeScript(record: ProductionRecord): string {
  return [
    'import type { PilotPackage } from "@/lib/content/pilot/index";',
    "",
    "export const studioDraftPackage = " + JSON.stringify(record.content, null, 2) + " as PilotPackage;",
    "",
    `export const studioDraftWorkflowState = ${JSON.stringify(record.workflowState)} as const;`,
  ].join("\n");
}
