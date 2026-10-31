import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, projectPath } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
let cursor = 0;
async function worker() {
  while (cursor < catalog.length) {
    const project = catalog[cursor++];
    const folder = projectPath(root, project.folder);
    const prettier = join(folder, "node_modules/prettier/bin/prettier.cjs");
    console.log(`Formatting ${project.folder}`);
    execFileSync(
      process.execPath,
      [
        prettier,
        "--write",
        "src/**/*.{ts,tsx}",
        "test/**/*.{mjs,ts,tsx}",
        "scripts/**/*.mjs",
        "README.md",
        "SECURITY.md",
        "package.json",
        "tsconfig.json",
        ".prettierrc.json",
        ".github/workflows/*.yml",
      ],
      { cwd: folder, stdio: "inherit" },
    );
  }
}
await Promise.all([worker(), worker()]);
