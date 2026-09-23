import assert from "node:assert/strict";
import { getPublishedTopicDelivery, projectPublishedTopicDelivery } from "./delivery";
import { getCanonicalTopic } from "./manifest";

const available = getPublishedTopicDelivery("geography/earths-rotation");
assert.ok(available);
assert.equal(available.contentVersion, 1);
assert.equal(available.topic.id, "geography/earths-rotation");
assert.deepEqual(available.conceptIds, available.topic.conceptIds);
assert.deepEqual(available.assessmentSetIds, available.topic.assessmentSetIds);

const topic = getCanonicalTopic("geography/earths-rotation");
assert.ok(topic);
assert.equal(projectPublishedTopicDelivery({
  ...topic,
  contentMetadata: { ...topic.contentMetadata, lifecycle: "draft" },
}), undefined);
assert.equal(getPublishedTopicDelivery("missing/topic"), undefined);

console.log("Content delivery verification passed.");
