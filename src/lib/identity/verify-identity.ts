import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { defaultLocalProfile, learnerGoalId, LOCAL_LEARNER_ID as LEARNER_MODULE_LOCAL_ID } from "@/lib/learner/identity";
import { validateLearnerGoal, validateLearnerProfile } from "@/lib/learner/validate";
import { runLearnerProfileVerification } from "@/lib/learner/verify-profile";
import { parseLearnerState } from "@/store/learner/storage";
import {
  ACTIVE_IDENTITY_MODE,
  FORBIDDEN_PUBLIC_IDENTITY_FIELDS,
  IDENTITY_ERROR_CODES,
  IDENTITY_MODES,
  IDENTITY_STATUSES,
  LOCAL_LEARNER_ID,
  createLocalIdentityResolver,
  createUnauthenticatedIdentitySource,
  defaultIdentityRead,
  describeLocalToAuthenticatedMigration,
  isCanonicalLocalLearnerId,
  isOpaqueAuthenticatedLearnerIdShape,
  isUnsafeCanonicalLearnerId,
  localLearnerIdentity,
  resolveLearnerIdentity,
  toIdentityRead,
  validateAuthenticationIdentity,
  validateExternalIdentityRef,
  validateLearnerIdentity,
  type IdentityRead,
  type LearnerIdentity,
} from "./index";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Identity verification failed: ${message}`);
}

function expectThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Identity verification failed: expected throw (${label})`);
}

function assertJsonSafe(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assert(typeof serialized === "string" && serialized.length > 2, `${label} serializes`);
  assert(serialized === JSON.stringify(JSON.parse(serialized)), `${label} is JSON-roundtrippable`);
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

function collectKeys(value: unknown, keys: Set<string> = new Set()): Set<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    keys.add(key);
    collectKeys(record[key], keys);
  }
  return keys;
}

function listFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else acc.push(full.replace(/\\/g, "/"));
  }
  return acc;
}

function identityRuntimeFiles(): string[] {
  return listFiles("src/lib/identity").filter(
    (path) => path.endsWith(".ts") && !path.endsWith("verify-identity.ts"),
  );
}

export function runIdentityVerification(): string[] {
  const passed: string[] = [];

  const resolved = resolveLearnerIdentity();
  assert(resolved.ok === true, "empty input resolves");
  if (!resolved.ok) return passed;
  assert(resolved.identity.learnerId === "learner/local", "empty input resolves to learner/local");
  assert(resolved.identity.mode === "local", "empty input mode is local");
  assert(resolved.identity.status === "active", "local identity is active");
  passed.push("TEST 1 learner/local resolves successfully");

  const again = resolveLearnerIdentity({ mode: "local" });
  const third = resolveLearnerIdentity({ learnerId: LOCAL_LEARNER_ID });
  assert(again.ok && third.ok, "repeat resolution succeeds");
  assert(
    again.ok &&
      third.ok &&
      JSON.stringify(resolved.identity) === JSON.stringify(again.identity) &&
      JSON.stringify(again.identity) === JSON.stringify(third.identity),
    "local resolution is deterministic",
  );
  assert(LOCAL_LEARNER_ID === "learner/local", "LOCAL_LEARNER_ID is learner/local");
  assert(isCanonicalLocalLearnerId(LOCAL_LEARNER_ID), "canonical local predicate holds");
  passed.push("TEST 2 learner/local is deterministic");

  assert(ACTIVE_IDENTITY_MODE === "local", "active mode is local");
  const mapped = resolveLearnerIdentity({ mode: "local" });
  assert(mapped.ok && mapped.identity.learnerId === "learner/local", "local mode maps to learner/local");
  const resolver = createLocalIdentityResolver();
  const viaResolver = resolver.resolve();
  assert(viaResolver.ok && viaResolver.identity.learnerId === "learner/local", "IdentityResolver maps local mode");
  passed.push("TEST 3 local mode maps to learner/local");

  const futureAuthenticated: LearnerIdentity = validateLearnerIdentity({
    learnerId: "learner/a1b2c3d4e5f67890",
    mode: "authenticated",
    status: "active",
  });
  assert(futureAuthenticated.mode === "authenticated", "authenticated mode is representable");
  assert(futureAuthenticated.learnerId.startsWith("learner/"), "authenticated id stays in learner namespace");
  assert(isOpaqueAuthenticatedLearnerIdShape(futureAuthenticated.learnerId), "authenticated id is opaque");
  assertJsonSafe(futureAuthenticated, "authenticated identity");
  const authResolve = resolveLearnerIdentity({
    mode: "authenticated",
    learnerId: futureAuthenticated.learnerId,
  });
  assert(authResolve.ok === false, "authenticated mode is not resolved now");
  assert(
    !authResolve.ok && authResolve.error.code === "unsupported_identity_mode",
    "authenticated resolution is unsupported_identity_mode",
  );
  passed.push("TEST 4 future authenticated mode is structurally representable");

  const external = validateExternalIdentityRef({
    provider: "future-provider",
    subject: "opaque-provider-subject",
  });
  assert(external.provider === "future-provider", "external provider is representable");
  assert(external.subject !== LOCAL_LEARNER_ID, "external subject is not learner/local");
  assertJsonSafe(external, "external identity");
  const externalResolve = resolveLearnerIdentity({ mode: "external", external });
  assert(
    externalResolve.ok === false && externalResolve.error.code === "unsupported_identity_mode",
    "external mode is not canonical identity",
  );
  passed.push("TEST 5 future external identity is structurally representable");

  const emailResolve = resolveLearnerIdentity({ learnerId: "user@example.com" });
  assert(!emailResolve.ok && emailResolve.error.code === "invalid_identity", "email is invalid_identity");
  expectThrow("email learnerId", () =>
    validateLearnerIdentity({
      learnerId: "learner/user@example.com",
      mode: "authenticated",
      status: "active",
    }),
  );
  assert(isUnsafeCanonicalLearnerId("learner/user@example.com"), "email-shaped learnerId is unsafe");
  passed.push("TEST 6 email cannot become canonical learnerId");

  const phoneResolve = resolveLearnerIdentity({ learnerId: "learner/+8801712345678" });
  assert(!phoneResolve.ok && phoneResolve.error.code === "invalid_identity", "phone is invalid_identity");
  expectThrow("phone learnerId", () =>
    validateLearnerIdentity({
      learnerId: "learner/+8801712345678",
      mode: "local",
      status: "active",
    }),
  );
  passed.push("TEST 7 phone cannot become canonical learnerId");

  const providerResolve = resolveLearnerIdentity({ learnerId: "google-oauth2|12345" });
  assert(!providerResolve.ok && providerResolve.error.code === "invalid_identity", "provider subject is invalid");
  expectThrow("provider in learnerId", () =>
    validateLearnerIdentity({
      learnerId: "learner/google/123",
      mode: "authenticated",
      status: "active",
    }),
  );
  expectThrow("provider prefix learnerId", () =>
    validateLearnerIdentity({
      learnerId: "learner/google-12345",
      mode: "authenticated",
      status: "active",
    }),
  );
  assert(external.subject !== futureAuthenticated.learnerId, "provider subject is not canonical id");
  passed.push("TEST 8 provider subject cannot become canonical learnerId");

  const jwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature";
  const tokenResolve = resolveLearnerIdentity({ learnerId: jwt });
  assert(!tokenResolve.ok && tokenResolve.error.code === "invalid_identity", "JWT is invalid_identity");
  const bearerResolve = resolveLearnerIdentity({ learnerId: "Bearer abc.def.ghi" });
  assert(!bearerResolve.ok, "bearer token is not a learnerId");
  passed.push("TEST 9 tokens cannot become canonical learnerId");

  const publicRead: IdentityRead = defaultIdentityRead();
  assert(publicRead.learnerId === "learner/local", "public read uses learner/local");
  assert(publicRead.mode === "local", "public read mode is local");
  assert(publicRead.status === "active", "public read status is active");
  const readKeys = [...collectKeys(publicRead)];
  assert(readKeys.length === 3, "public read has exactly learnerId, mode, status");
  for (const field of FORBIDDEN_PUBLIC_IDENTITY_FIELDS) {
    assert(!readKeys.includes(field), `public read has no ${field}`);
  }
  assert(!("subject" in publicRead), "public read has no provider subject");
  assert(!("provider" in publicRead), "public read has no provider");
  assertJsonSafe(publicRead, "public identity read");
  const serializedRead = JSON.stringify(publicRead);
  for (const field of FORBIDDEN_PUBLIC_IDENTITY_FIELDS) {
    assert(!serializedRead.includes(`"${field}"`), `serialized public read has no ${field}`);
  }
  passed.push("TEST 10 public identity read contains no secrets");

  const profile = validateLearnerProfile(defaultLocalProfile());
  assert(profile.learnerId === LOCAL_LEARNER_ID, "LearnerProfile uses identity learner/local");
  assert(profile.learnerId === resolved.identity.learnerId, "profile consumes resolved identity");
  const named = validateLearnerProfile({
    learnerId: LOCAL_LEARNER_ID,
    displayName: "Atlas Learner",
    locale: "en",
    createdAt: "2026-09-02T12:00:00.000Z",
    updatedAt: "2026-09-02T12:00:01.000Z",
  });
  assert(named.displayName === "Atlas Learner", "existing displayName remains valid");
  const profileChecks = runLearnerProfileVerification();
  assert(profileChecks.length > 0, "Phase 1G profile verifier still runs");
  passed.push("TEST 11 existing LearnerProfile remains compatible");

  const study = validateLearnerGoal({
    id: learnerGoalId("study", "geography"),
    type: "study",
    status: "active",
    target: { subjectId: "geography" },
  });
  assert(study.id === "goal/study/geography", "goal identity remains goal/{type}/{targetId}");
  const complete = validateLearnerGoal({
    id: learnerGoalId("complete", "geography/earths-rotation"),
    type: "complete",
    status: "active",
    target: { topicId: "geography/earths-rotation" },
  });
  assert(complete.target.topicId === "geography/earths-rotation", "complete goal target is unchanged");
  passed.push("TEST 12 existing LearnerGoal remains compatible");

  const persisted = parseLearnerState(
    JSON.stringify({
      mcqResults: [{ topicSlug: "earths-rotation", correct: true, timestamp: 1 }],
      completedTopics: ["geography/earths-rotation"],
      intelligence: { learnerId: "learner/local", assessments: [] },
    }),
  );
  assert(persisted.completedTopics[0] === "geography/earths-rotation", "completion state still parses");
  assert(persisted.mcqResults.length === 1, "MCQ results still parse");
  assert(persisted.intelligence?.learnerId === "learner/local", "intelligence remains learner/local");
  assert(!("learnerId" in persisted), "completion state does not include profile identity");
  assert(!("goals" in persisted), "completion state does not include goals");
  assert(!("mode" in persisted), "completion state does not include identity mode");
  const storage = readFileSync("src/store/learner/storage.ts", "utf8");
  assert(storage.includes("sajib_atlas_learner_state"), "storage key sajib_atlas_learner_state is unchanged");
  passed.push("TEST 13 existing learner/local state remains compatible");

  assert(LEARNER_MODULE_LOCAL_ID === LOCAL_LEARNER_ID, "learner module reuses identity LOCAL_LEARNER_ID");
  const identityTypes = readFileSync("src/lib/identity/types.ts", "utf8");
  const learnerTypes = readFileSync("src/lib/learner/types.ts", "utf8");
  assert(
    identityTypes.includes('export const LOCAL_LEARNER_ID = "learner/local"'),
    "identity module is the LOCAL_LEARNER_ID authority",
  );
  assert(
    learnerTypes.includes('export { LOCAL_LEARNER_ID } from "@/lib/identity/types"'),
    "learner types re-export identity LOCAL_LEARNER_ID",
  );
  assert(!learnerTypes.includes("LearnerProfileV2"), "no LearnerProfileV2");
  assert(!learnerTypes.includes("export const LOCAL_LEARNER_ID ="), "learner types do not redefine LOCAL_LEARNER_ID");
  assert(identityTypes.includes("export type LearnerIdentity"), "LearnerIdentity lives in identity");
  assert(!learnerTypes.includes("LearnerIdentity"), "learner types do not define LearnerIdentity");
  const identityRuntime = identityRuntimeFiles();
  for (const path of identityRuntime) {
    const source = readFileSync(path, "utf8");
    const imports = importedModules(source);
    for (const specifier of imports) {
      assert(!specifier.includes("/learner/") && specifier !== "@/lib/learner", `${path} does not import learner domain`);
      assert(!specifier.includes("learner-intelligence"), `${path} does not import learner-intelligence`);
      assert(!specifier.includes("entitlement"), `${path} does not import entitlement`);
      assert(!specifier.includes("commerce"), `${path} does not import commerce`);
    }
  }
  passed.push("TEST 14 no duplicate identity authority exists");

  const missing = resolveLearnerIdentity({ learnerId: "learner/a1b2c3d4e5f67890" });
  assert(!missing.ok && missing.error.code === "identity_not_found", "unknown local id is identity_not_found");
  assert(IDENTITY_ERROR_CODES.includes("invalid_identity"), "invalid_identity exists");
  assert(IDENTITY_ERROR_CODES.includes("unsupported_identity_mode"), "unsupported_identity_mode exists");
  assert(IDENTITY_ERROR_CODES.includes("identity_not_found"), "identity_not_found exists");
  for (const result of [emailResolve, phoneResolve, providerResolve, tokenResolve, authResolve, externalResolve, missing]) {
    if (!result.ok) {
      assert(!("stack" in result.error), "errors have no stack");
      assertJsonSafe(result.error, "identity error");
    }
  }
  passed.push("typed identity errors remain deterministic and opaque");

  const auth = validateAuthenticationIdentity({ authenticated: false });
  assert(auth.authenticated === false, "local principal is unauthenticated");
  const source = createUnauthenticatedIdentitySource();
  assert(source.current()?.authenticated === false, "AuthenticationIdentitySource is unauthenticated");
  const described = describeLocalToAuthenticatedMigration(futureAuthenticated);
  assert(described.ok === true, "migration description succeeds");
  if (described.ok) {
    assert(described.description.implemented === false, "migration is not implemented");
    assert(described.description.copiesState === false, "migration does not copy state");
    assert(described.description.deletesState === false, "migration does not delete state");
    assert(described.description.mergesRecords === false, "migration does not merge records");
    assert(described.description.fromLearnerId === "learner/local", "migration from learner/local");
  }
  passed.push("authentication remains separate; migration is a contract only");

  const identityFromLocal = localLearnerIdentity();
  const readFromIdentity = toIdentityRead(identityFromLocal);
  assert(readFromIdentity.learnerId === profile.learnerId, "identity supplies learnerId consumed by profile");
  assert(IDENTITY_MODES.includes("local"), "local mode exists");
  assert(IDENTITY_MODES.includes("authenticated"), "authenticated mode exists");
  assert(IDENTITY_MODES.includes("external"), "external mode exists");
  assert(IDENTITY_STATUSES.includes("active"), "active status exists");
  assert(IDENTITY_STATUSES.includes("disabled"), "disabled status exists");
  passed.push("identity supplies canonical learnerId to LearnerProfile");

  const forbiddenImportMarks = [
    "supabase",
    "firebase",
    "@clerk",
    "next-auth",
    "nextauth",
    "@auth/",
    "prisma",
    "drizzle",
    "mongodb",
    "ioredis",
    "pg'",
    "jsonwebtoken",
    "jose",
  ];
  for (const path of identityRuntime) {
    const source = readFileSync(path, "utf8").toLowerCase();
    const imports = importedModules(readFileSync(path, "utf8"));
    for (const specifier of imports) {
      const lower = specifier.toLowerCase();
      for (const mark of forbiddenImportMarks) {
        assert(!lower.includes(mark), `${path} has no ${mark} import`);
      }
      assert(!specifier.includes("next/headers"), `${path} does not read cookies`);
      assert(!specifier.includes("server-only"), `${path} is client-safe`);
    }
    assert(!source.includes("localstorage"), `${path} does not use localStorage`);
    assert(!source.includes("sajib_atlas_learner_state") || path.includes("verify"), `${path} does not own learner state`);
  }
  const pkg = readFileSync("package.json", "utf8").toLowerCase();
  for (const mark of [
    "supabase",
    "firebase",
    "clerk",
    "next-auth",
    "@auth/core",
    "prisma",
    "drizzle-orm",
    "mongodb",
    "ioredis",
    "jsonwebtoken",
  ]) {
    assert(!pkg.includes(mark), `package.json does not add ${mark}`);
  }
  passed.push("no authentication provider, SDK, or database is introduced");

  const appFiles = listFiles("src/app");
  for (const path of appFiles) {
    const normalized = path.toLowerCase();
    assert(!normalized.includes("/login"), "no /login route");
    assert(!normalized.includes("/register"), "no /register route");
    assert(!normalized.includes("/signup"), "no /signup route");
    assert(!normalized.includes("/logout"), "no /logout route");
    assert(!normalized.includes("/account"), "no /account route");
    assert(!normalized.includes("/api/auth"), "no /api/auth route");
    assert(!normalized.includes("/api/identity"), "no /api/identity route");
    assert(!normalized.includes("/api/user"), "no /api/user route");
    assert(!normalized.includes("/api/account"), "no /api/account route");
  }
  passed.push("no authentication UI or identity HTTP API is introduced");

  const readSource = readFileSync("src/lib/identity/read.ts", "utf8");
  const typesSource = readFileSync("src/lib/identity/types.ts", "utf8");
  for (const field of FORBIDDEN_PUBLIC_IDENTITY_FIELDS) {
    assert(!readSource.includes(`${field}:`), `identity read source has no ${field} field`);
  }
  assert(typesSource.includes("export type IdentityRead"), "IdentityRead is defined");
  const identityReadBlock = typesSource.slice(typesSource.indexOf("export type IdentityRead"));
  const identityReadDecl = identityReadBlock.slice(0, identityReadBlock.indexOf("};") + 2);
  for (const field of FORBIDDEN_PUBLIC_IDENTITY_FIELDS) {
    assert(!identityReadDecl.includes(field), `IdentityRead type has no ${field}`);
  }
  passed.push("security scan of identity read types and outputs is clean");

  return passed;
}

const executedFromCli =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("verify-identity.ts");

if (executedFromCli) {
  const passed = runIdentityVerification();
  for (const line of passed) {
    console.log(`PASS ${line}`);
  }
  console.log("IDENTITY_VERIFICATION: PASS");
}
