function fail(message: string): never {
  throw new Error(`Batch production: ${message}`);
}

export function canonicalBatchNumber(value: number | string): string {
  if (typeof value === "string" && !/^[0-9]{1,4}$/.test(value)) fail("batch number is invalid");
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 9999) {
    fail("batch number must be an integer from 1 to 9999");
  }
  return String(numeric).padStart(3, "0");
}

export function batchIdFor(batchNumber: string): string {
  return `studio-batch/${batchNumber}`;
}

export function batchItemId(batchNumber: string, ordinal: number, topicSlug: string): string {
  if (!Number.isInteger(ordinal) || ordinal < 1) fail("item ordinal is invalid");
  return `studio-batch/${batchNumber}/item/${String(ordinal).padStart(3, "0")}/${topicSlug}`;
}
