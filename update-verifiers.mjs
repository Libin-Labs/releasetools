import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./policy.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(root, "ReleaseTools/catalog.json"))),
);
for (const project of catalog) {
  const path = resolve(root, project.folder, "scripts/verify.mjs");
  let text = await readFile(path, "utf8");
  const typeCheck = "run([require.resolve('typescript/bin/tsc'), '--noEmit']);";
  assert.equal(
    text.split(typeCheck).length,
    2,
    `${project.folder}: expected one TypeScript gate`,
  );
  text = text.replace(
    typeCheck,
    "run([require.resolve('prettier/bin/prettier.cjs'), '--check', 'src/**/*.{ts,tsx}', 'test/**/*.{mjs,ts,tsx}', 'scripts/**/*.mjs', 'README.md', 'SECURITY.md', 'package.json', 'tsconfig.json', '.prettierrc.json', '.github/workflows/*.yml']);\n" +
      typeCheck,
  );
  const sections =
    "['Installation', 'Quick Start', 'API', 'Security And Limits', 'Support']";
  assert.ok(
    text.includes(sections),
    `${project.folder}: expected documentation gate`,
  );
  text = text.replace(
    sections,
    "['Installation', 'Quick Start', 'API', 'Benefits', 'Customization', 'Security And Limits', 'Support']",
  );
  await writeFile(path, text);
}
