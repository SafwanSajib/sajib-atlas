export const BATCH_RUNTIME_LIMITATION = [
  "The batch production engine persists job state outside the initiating request, but it is not an autonomous worker.",
  "Next.js server actions and route handlers end when the response ends. Nothing here keeps polling after browser refresh, browser closure, or process exit.",
  "Browser localStorage is not used and is not a background worker.",
  "Durable state is a BatchJobStore: an in-memory store for tests, or one JSON file per batch under .data/content-studio/batches.",
  "Execution is a separate pull. tickBatchWorker processes exactly one eligible item per call and then returns.",
  "An operator, test, or future external worker must call that tick again. A 100-topic batch therefore survives the end of the request only as stored state, not as a running loop.",
  "A process restart keeps completed item results only when a file-backed store was used. An in-memory store dies with the process.",
  "An item left in running is reclaimed once by the next tick against the same store. A second reclaim is marked failed so a crash loop cannot retry forever.",
  "The file store has no cross-process lock. Two processes must not tick the same batch.",
  "Replacing BatchJobStore and the tick caller with a database and cloud worker later does not require rewriting the Studio pipeline.",
  "The engine does not approve, publish, or register drafts in /content-review. Canonical registration stays a separate human step after the production inbox.",
].join(" ");
