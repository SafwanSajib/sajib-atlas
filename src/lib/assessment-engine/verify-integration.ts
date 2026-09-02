import { readFileSync } from "node:fs";
import { runAssessmentEngineVerification } from "./verify-engine";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assessment-integration verification failed: ${message}`);
}

function importedModules(source: string): string[] {
  const imports: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    imports.push(match[1]);
    match = re.exec(source);
  }
  return imports;
}

function readRuntime(name: string): string {
  return readFileSync(`src/lib/assessment-engine/${name}`, "utf8");
}

const BROWSER_MARKERS = ["window.", "document.", "localStorage", "sessionStorage", "from \"react\"", "from 'react'"] as const;

export function runAssessmentIntegrationVerification(): string[] {
  const passed: string[] = [];

  const types = readRuntime("types.ts");
  const identity = readRuntime("identity.ts");
  const scoring = readRuntime("scoring.ts");
  const adapter = readRuntime("payload-adapter.ts");
  const delivery = readRuntime("delivery.ts");
  const session = readRuntime("session.ts");
  const result = readRuntime("result.ts");
  const index = readRuntime("index.ts");

  const scoringImports = importedModules(scoring);
  const adapterImports = importedModules(adapter);
  const deliveryImports = importedModules(delivery);
  const sessionImports = importedModules(session);
  const resultImports = importedModules(result);
  const indexImports = importedModules(index);

  assert(
    adapterImports.some((specifier) => specifier.includes("geography-data")),
    "adapter owns Geography payload access",
  );
  assert(
    adapterImports.some((specifier) => specifier.includes("lib/assessment/sets")),
    "adapter resolves Phase 1D AssessmentSet identity",
  );
  assert(deliveryImports.includes("./payload-adapter"), "delivery consumes the adapter");
  assert(!deliveryImports.includes("./scoring"), "delivery does not import scoring");
  assert(!deliveryImports.includes("./session"), "delivery does not import session");
  assert(!deliveryImports.some((specifier) => specifier.includes("geography-data")), "delivery does not import Geography");
  assert(sessionImports.includes("./scoring"), "session reuses Phase 3B scoring");
  assert(sessionImports.includes("./result"), "session uses Phase 3F result");
  assert(!sessionImports.includes("./payload-adapter"), "session does not bypass delivery via the adapter");
  assert(!sessionImports.includes("./delivery"), "session consumes delivery objects, not the delivery module");
  assert(!sessionImports.some((specifier) => specifier.includes("geography-data")), "session does not import Geography");
  assert(resultImports.includes("./scoring") || result.includes("McqAssessmentScore"), "result consumes scoring output types");
  assert(!result.includes("scoreMcqAssessment"), "result does not invoke the scorer");
  assert(!resultImports.includes("./session"), "result does not import session lifecycle");
  assert(!resultImports.some((specifier) => specifier.includes("geography-data")), "result does not import Geography");
  assert(!scoringImports.some((specifier) => specifier.includes("geography-data")), "scoring does not import Geography");
  assert(!scoringImports.includes("./session"), "scoring does not import session");
  assert(!scoringImports.includes("./delivery"), "scoring does not import delivery");
  assert(!scoringImports.includes("./payload-adapter"), "scoring does not import the adapter");
  passed.push("dependency direction matches adapter → delivery; session → scoring + result; scoring stays Geography-free");

  for (const [label, source] of [
    ["types", types],
    ["identity", identity],
    ["scoring", scoring],
    ["adapter", adapter],
    ["delivery", delivery],
    ["session", session],
    ["result", result],
    ["index", index],
  ] as const) {
    for (const marker of BROWSER_MARKERS) {
      assert(!source.includes(marker), `${label} must not contain ${marker}`);
    }
    assert(!source.includes("from \"react\""), `${label} has no React import`);
    assert(!source.includes("useState"), `${label} has no React hooks`);
    assert(!source.includes("sajib_atlas_learner_state"), `${label} does not touch learner storage`);
  }
  passed.push("engine runtime modules have no window, document, localStorage, or React");

  assert(indexImports.includes("./delivery"), "index exports delivery");
  assert(indexImports.includes("./session"), "index exports session");
  assert(indexImports.includes("./scoring"), "index exports scoring");
  assert(indexImports.includes("./result"), "index exports result");
  assert(indexImports.includes("./payload-adapter"), "index exports adapter");
  assert(indexImports.includes("./types"), "index exports contracts");
  assert(!indexImports.some((specifier) => specifier.includes("geography-data")), "index does not import Geography payload");
  assert(index.includes("ScoringMcqQuestion"), "scoring-only type remains an intentional domain export");
  assert(index.includes("McqDeliveryQuestion"), "public delivery type is exported");
  assert(index.includes("AssessmentResult"), "result contract is exported");
  assert(!index.includes("geographyTopicsBySlug"), "index does not export Geography payload objects");
  passed.push("public Assessment Engine surface is the intended domain API");

  const enginePasses = runAssessmentEngineVerification();
  assert(enginePasses.length > 0, "Phase 3G composition verifier still returns passes");
  passed.push("Phase 3G end-to-end composition remains the integration proof");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-integration.ts");

if (executedFromCli) {
  const passed = runAssessmentIntegrationVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("ASSESSMENT_INTEGRATION_VERIFICATION: PASS");
}
