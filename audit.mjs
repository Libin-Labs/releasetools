import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = JSON.parse(await readFile(resolve(here, "catalog.json")));
let baseline;
for (const project of catalog) {
  const lock = JSON.parse(
    await readFile(resolve(root, project.folder, "package-lock.json")),
  );
  const inventory = Object.entries(lock.packages)
    .filter(([name]) => name.startsWith("node_modules/"))
    .map(([name, value]) => ({
      name,
      version: value.version,
      integrity: value.integrity ?? null,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
  if (!baseline) baseline = inventory;
  else
    assert.deepEqual(
      inventory,
      baseline,
      `${project.folder}: dependency inventories differ; audit it separately.`,
    );
}
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
let text;
let status = 0;
try {
  text = execFileSync(
    process.execPath,
    [
      npm,
      "--prefix",
      resolve(root, "Form"),
      "audit",
      "--audit-level=high",
      "--json",
      "--registry",
      "https://registry.npmjs.org/",
    ],
    {
      encoding: "utf8",
      timeout: 60000,
      env: {
        ...process.env,
        NODE_TLS_REJECT_UNAUTHORIZED: "1",
        npm_config_strict_ssl: "true",
      },
    },
  );
} catch (error) {
  text = String(error.stdout ?? "");
  status = error.status ?? 1;
}
let audit;
try {
  audit = JSON.parse(text);
} catch {
  audit = { error: "Advisory response unavailable." };
  status = 1;
}
await writeFile(
  resolve(here, ".reports/audit.json"),
  JSON.stringify(
    { identicalInventories: catalog.length, status, audit },
    null,
    2,
  ),
);
console.log(
  `Resolved dependency inventories match across ${catalog.length} projects.`,
);
if (audit.metadata?.vulnerabilities)
  console.log(JSON.stringify(audit.metadata.vulnerabilities));
else
  console.log(
    "Advisory audit could not be completed; inspect .reports/audit.json.",
  );
if (status !== 0) process.exitCode = 1;
