import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = validateCatalog(
  JSON.parse(
    await readFile(resolve(root, "ReleaseTools/catalog.json"), "utf8"),
  ),
);
for (const project of catalog) {
  const path = resolve(root, project.folder, "package.json");
  const pkg = JSON.parse(await readFile(path, "utf8"));
  assert.equal(pkg.name, `@lp-labs/${project.name}`);
  assert.ok(
    !Object.hasOwn(pkg, "author"),
    `${project.folder}: author already exists; review manually.`,
  );
  pkg.author = {
    name: "Libin Prasanth",
    url: "https://www.linkedin.com/in/libinprasanth/",
  };
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Added npm author metadata to ${project.name}`);
}
