export function noteIdFor(batchId: string, itemId: string, revision: number, index: number): string {
  return `note/${batchId}/${itemId}/${revision}/${index}`;
}
