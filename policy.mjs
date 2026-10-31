import { resolve, relative, isAbsolute } from "node:path";

export function validateCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length !== 22)
    throw new Error("Exactly 22 allowlisted projects are required.");
  for (const field of ["folder", "name"])
    if (new Set(catalog.map((entry) => entry[field])).size !== catalog.length)
      throw new Error(`Duplicate ${field}.`);
  for (const entry of catalog) {
    if (
      !/^[A-Z][A-Za-z]+$/.test(entry.folder) ||
      !/^react-[a-z]+(?:-[a-z]+)*$/.test(entry.name)
    )
      throw new Error("Invalid project name or folder.");
  }
  return catalog;
}

export function projectPath(root, folder) {
  const path = resolve(root, folder);
  const local = relative(root, path);
  if (local.startsWith("..") || isAbsolute(local) || !local)
    throw new Error("Project path escapes the release root.");
  return path;
}

export function assertPublishable(pkg, expectedName, environment) {
  if (pkg.name !== `@lp-labs/${expectedName}` || pkg.private)
    throw new Error("Unexpected or private package.");
  if (pkg.license !== "MIT" || !pkg.files?.includes("LICENSE"))
    throw new Error(
      `${pkg.name}: publishing requires the approved MIT license and a packaged LICENSE file.`,
    );

  if (pkg.publishConfig?.registry !== "https://registry.npmjs.org/")
    throw new Error("Only the public npm registry is allowed.");
}
