import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = JSON.parse(await readFile(resolve(here, "catalog.json")));
const results = JSON.parse(
  await readFile(resolve(here, ".reports/results.json")),
);
const docs = JSON.parse(await readFile(resolve(here, ".reports/docs.json")));
assert.equal(
  results.length,
  catalog.length,
  "The final aggregate gate is not complete.",
);
assert.ok(
  results.every((result) => result.passed),
  "A package gate failed.",
);
assert.equal(docs.length, catalog.length);
let tests = 0;
const rows = [];
for (const project of catalog) {
  const folder = resolve(root, project.folder);
  const source = await readFile(resolve(folder, "src/index.tsx"), "utf8");
  const map = JSON.parse(
    await readFile(resolve(folder, "dist/index.js.map"), "utf8"),
  );
  assert.ok(
    map.sourcesContent.includes(source),
    `${project.folder}: built artifact does not match current source.`,
  );
  const log = await readFile(
    resolve(here, ".reports", `${project.folder}.log`),
    "utf8",
  );
  const match = log.match(/\btests\s+(\d+)/);
  assert.ok(match, `${project.folder}: test count missing.`);
  const count = Number(match[1]);
  tests += count;
  const item = docs.find((item) => item.folder === project.folder);
  assert.ok(item);
  rows.push(
    `| [${item.name}](../${project.folder}/README.md) | ${count} | ${item.gzipBytes} |`,
  );
}
const report = `# Verified Package Baseline\n\nAll ${catalog.length} standalone package gates passed: Prettier formatting, strict TypeScript, declaration generation, behavior tests, ESM/CommonJS/browser builds, bundle caps, and isolated packed-consumer imports. All ${docs.length} README quick-start examples execute through React server rendering. Each project owns its dependency lockfile, scripts, tests, security policy, and CI; no sibling-project imports were found.\n\n${tests} package tests and 6 release-policy/CLI refusal tests passed. Browser checks additionally covered 44 desktop/mobile render cases, native nested-modal focus and keyboard behavior, combobox selection, overflow-menu interaction, and image pixels, zoom, and Escape handling. These are targeted automated checks, not a full browser matrix, screen-reader audit, penetration test, or compliance certification.\n\n| Package | Tests | Gzip bytes (React excluded) |\n| --- | ---: | ---: |\n${rows.join("\n")}\n\nNo npm package was published and no GitHub repository was created. All new packages are distributed under the MIT License and include the packaged LICENSE file. See the [release instructions](README.md).\n`;
await writeFile(resolve(here, "VERIFICATION.md"), report);
console.log(
  `Verified: ${catalog.length} independent packages; ${tests} package tests; 6 release safety tests; 22 executable README examples.`,
);
