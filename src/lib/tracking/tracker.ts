import type { AnalyticsEvent } from "./events";

export interface Tracker { track(event: AnalyticsEvent): void; }
export const noopTracker: Tracker = { track() {} };
