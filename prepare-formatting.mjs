import { execFileSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, projectPath } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
let npm = process.env.npm_execpath;
for (const candidate of [
  resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
  resolve(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
  "/usr/share/nodejs/npm/bin/npm-cli.js",
]) {
  if (npm) break;
  try {
    await access(candidate);
    npm = candidate;
  } catch {}
}
if (!npm) throw new Error("Cannot locate npm.");
let cursor = 0;
const failures = [];
async function worker() {
  while (cursor < catalog.length) {
    const project = catalog[cursor++];
    const folder = projectPath(root, project.folder);
    const path = resolve(folder, "package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.devDependencies = { ...pkg.devDependencies, prettier: "^3.6.2" };
    pkg.scripts = {
      ...pkg.scripts,
      format:
        'prettier --write "src/**/*.{ts,tsx}" "test/**/*.{mjs,ts,tsx}" "scripts/**/*.mjs" "README.md" "SECURITY.md" "package.json" "tsconfig.json" ".github/workflows/*.yml"',
      "format:check":
        'prettier --check "src/**/*.{ts,tsx}" "test/**/*.{mjs,ts,tsx}" "scripts/**/*.mjs" "README.md" "SECURITY.md" "package.json" "tsconfig.json" ".github/workflows/*.yml"',
    };
    pkg.scripts.verify = pkg.scripts.verify.replace(
      "npm run check &&",
      "npm run format:check && npm run check &&",
    );
    pkg.scripts.prepack = "npm run verify";
    await writeFile(path, JSON.stringify(pkg, null, 2) + "\n");
    await writeFile(
      resolve(folder, ".prettierrc.json"),
      JSON.stringify(
        {
          singleQuote: true,
          semi: true,
          trailingComma: "all",
          printWidth: 100,
          tabWidth: 2,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`Installing formatter in ${project.folder}`);
    try {
      execFileSync(
        process.execPath,
        [
          npm,
          "--prefix",
          folder,
          "install",
          "--save-dev",
          "prettier@^3.6.2",
          "--registry",
          "https://registry.npmjs.org/",
        ],
        {
          stdio: "inherit",
          env: {
            ...process.env,
            NODE_TLS_REJECT_UNAUTHORIZED: "1",
            npm_config_strict_ssl: "true",
          },
          timeout: 120000,
        },
      );
    } catch (error) {
      failures.push({ folder: project.folder, error: String(error.message) });
      console.error(`${project.folder} formatter setup failed.`);
    }
  }
}
await Promise.all([worker(), worker()]);
if (failures.length)
  throw new AggregateError(
    failures.map((item) => new Error(`${item.folder}: ${item.error}`)),
    "Some formatter installs failed.",
  );
