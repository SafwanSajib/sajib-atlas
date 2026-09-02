import { pathToFileURL } from "node:url";
import path from "node:path";

const srcRoot = pathToFileURL(path.resolve("src") + "/").href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const withoutAlias = specifier.slice(2);
    const withExt = withoutAlias.endsWith(".ts") ? withoutAlias : `${withoutAlias}.ts`;
    return nextResolve(new URL(withExt, srcRoot).href, context);
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL &&
    path.extname(specifier) === ""
  ) {
    return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
  }

  return nextResolve(specifier, context);
}
